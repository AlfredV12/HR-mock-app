// hr-app/src/features/candidates/CandidateKanbanBoard.tsx

import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Candidate } from '../../types'; // Adjust path if needed
import { KanbanColumn } from './KanbanColumn'; // Adjust path if needed
import { CandidateCard } from './CandidateCard'; // Adjust path if needed

const STAGES = ["applied", "screen", "tech", "offer", "hired", "rejected"] as const;
type Stage = typeof STAGES[number];

// --- API Helper Functions ---

const fetchCandidates = async (): Promise<Candidate[]> => {
    const res = await fetch('/api/candidates');
    if (!res.ok) {
        throw new Error('Failed to fetch candidates');
    }
    return res.json();
};

const updateCandidateStage = async (variables: { candidateId: number; newStage: Stage }): Promise<Candidate> => {
    const { candidateId, newStage } = variables;
    const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
    });
    if (!res.ok) {
        throw new Error('Failed to update candidate stage');
    }
    return res.json();
};

// --- Main Component ---

export const CandidateKanbanBoard = () => {
  const queryClient = useQueryClient();

  const { data: candidates, isLoading, isError } = useQuery({ 
    queryKey: ['candidates'], 
    queryFn: fetchCandidates 
  });
  
  // Memoize the grouping logic to avoid re-calculating on every render
  const groupedCandidates = useMemo(() => {
    const grouped = STAGES.reduce((acc, stage) => ({ ...acc, [stage]: [] }), {} as Record<Stage, Candidate[]>);
    if (candidates) {
      candidates.forEach(candidate => {
        // Ensure candidate stage is a valid stage before grouping
        if (grouped[candidate.stage]) {
            grouped[candidate.stage].push(candidate);
        }
      });
    }
    return grouped;
  }, [candidates]);

  const updateStageMutation = useMutation({
    mutationFn: updateCandidateStage,
    // Optimistically update the UI
    onMutate: async ({ candidateId, newStage }) => {
        // Cancel any outgoing refetches to prevent them from overriding our optimistic update
        await queryClient.cancelQueries({ queryKey: ['candidates'] });

        // Snapshot the previous state
        const previousCandidates = queryClient.getQueryData<Candidate[]>(['candidates']);

        // Optimistically update to the new value
        queryClient.setQueryData<Candidate[]>(['candidates'], old => 
            old?.map(c => c.id === candidateId ? { ...c, stage: newStage } : c) || []
        );

        // Return a context object with the snapped-back value
        return { previousCandidates };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _variables, context) => {
        if (context?.previousCandidates) {
            queryClient.setQueryData(['candidates'], context.previousCandidates);
        }
    },
    // Always refetch after error or success to ensure server and client state are in sync
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;

    if (!over) return;

    const candidateId = Number(active.id);
    const newStage = over.id as Stage;
    const oldStage = active.data.current?.stage as Stage;

    // Only trigger mutation if the candidate is moved to a new, valid column
    if (newStage && STAGES.includes(newStage) && newStage !== oldStage) {
      updateStageMutation.mutate({ candidateId, newStage });
    }
  };

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Loading Kanban board...</div>;
  }

  if (isError) {
    return <div style={{ padding: '20px', color: 'red' }}>Error loading candidates for the board.</div>;
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: '16px', padding: '20px', overflowX: 'auto', minHeight: '80vh' }}>
        {STAGES.map(stage => (
          <KanbanColumn key={stage} id={stage} title={stage.charAt(0).toUpperCase() + stage.slice(1)}>
            {groupedCandidates[stage]?.map(candidate => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </KanbanColumn>
        ))}
      </div>
    </DndContext>
  );
};