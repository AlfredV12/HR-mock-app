// src/features/jobs/JobsBoard.tsx

import { DndContext, type DragEndEvent, type DragStartEvent, DragOverlay, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import type { Job } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { JobCard } from './JobCard';
import { JobEditorModal } from './JobEditorModal';

const STATUSES = ["active", "archive"] as const;
type Status = typeof STATUSES[number];

// --- API Helper Functions ---

const fetchAllJobs = async (): Promise<Job[]> => {
    const res = await fetch('/api/jobs');
    if (!res.ok) throw new Error('Failed to fetch jobs');
    const responseData = await res.json();
    return responseData.data;
};

const saveJob = async (jobData: Omit<Job, 'id' | 'order'> & { id?: number }): Promise<Job> => {
    const isEditing = jobData.id != null;
    const url = isEditing ? `/api/jobs/${jobData.id}` : '/api/jobs';
    const method = isEditing ? 'PATCH' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save job');
    }
    return res.json();
};

// --- Main Component ---

export const JobsBoard = () => {
    const queryClient = useQueryClient();
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const [activeJob, setActiveJob] = useState<Job | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);

    // --- Style objects for consistent sizing ---
    const largeButtonStyle: React.CSSProperties = {
        margin: '20px',
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#f0f0f0',
    };

    const columnWrapperStyle: React.CSSProperties = {
        flex: 1, // This makes each column take up equal space
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0, // Prevents columns from overflowing their container
    };

    const { data: jobs, isLoading } = useQuery({ 
        queryKey: ['jobs'], 
        queryFn: fetchAllJobs 
    });
    
    const groupedJobs = useMemo(() => {
        const grouped = STATUSES.reduce((acc, status) => ({ ...acc, [status]: [] }), {} as Record<Status, Job[]>);
        jobs?.forEach(job => {
            if (grouped[job.status]) {
                grouped[job.status].push(job);
            }
        });
        return grouped;
    }, [jobs]);

    const updateStatusMutation = useMutation({
        mutationFn: (variables: { jobId: number; newStatus: Status }) => {
            const { jobId, newStatus } = variables;
            return fetch(`/api/jobs/${jobId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
        },
        onMutate: async ({ jobId, newStatus }) => {
            await queryClient.cancelQueries({ queryKey: ['jobs'] });
            const previousJobs = queryClient.getQueryData<Job[]>(['jobs']);
            queryClient.setQueryData<Job[]>(['jobs'], old => 
                old?.map(j => j.id === jobId ? { ...j, status: newStatus } : j) || []
            );
            return { previousJobs };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousJobs) {
                queryClient.setQueryData(['jobs'], context.previousJobs);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
    });
    
    const saveJobMutation = useMutation({
        mutationFn: saveJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            handleCloseModal();
        },
        onError: (error) => {
            setServerError(error.message);
        }
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { over, active } = event;
        setActiveJob(null);
        if (!over) return;
        const jobId = Number(active.id);
        const newStatus = over.id as Status;
        const oldStatus = active.data.current?.stage as Status;

        if (newStatus && STATUSES.includes(newStatus) && newStatus !== oldStatus) {
            updateStatusMutation.mutate({ jobId, newStatus });
        }
    };
    
    const handleDragStart = (event: DragStartEvent) => {
        const job = event.active.data.current?.job as Job;
        if (job) setActiveJob(job);
    };
    
    const handleOpenModal = (job: Job | null = null) => {
        setJobToEdit(job);
        setIsModalOpen(true);
        setServerError(null); // Clear previous errors
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setJobToEdit(null);
        setServerError(null);
    };
    
    const handleSaveJob = (data: Omit<Job, 'id' | 'order'> & { id?: number }) => {
        saveJobMutation.mutate(data);
    };

    if (isLoading) return <div>Loading board...</div>;

    return (
        <>
            {/* MODIFIED: Applied the new, larger button style */}
            <button onClick={() => handleOpenModal()} style={largeButtonStyle}>+ Create Job</button>
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div style={{ display: 'flex', gap: '16px', padding: '20px' }}>
                    {STATUSES.map(status => (
                        // MODIFIED: Wrapped KanbanColumn in a styled div to enforce uniform width
                        <div key={status} style={columnWrapperStyle}>
                            <KanbanColumn id={status} title={status}>
                                {groupedJobs[status]?.map(job => (
                                    // NOTE: To make the "Edit" button larger, apply `largeButtonStyle`
                                    // to the button inside your JobCard.tsx component.
                                    <JobCard key={job.id} job={job} onEdit={handleOpenModal} />
                                ))}
                            </KanbanColumn>
                        </div>
                    ))}
                </div>
                <DragOverlay>
                    {activeJob ? <JobCard job={activeJob} onEdit={() => {}} /> : null}
                </DragOverlay>
            </DndContext>
            <JobEditorModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={handleSaveJob} 
                jobToEdit={jobToEdit}
                serverError={serverError}
            />
        </>
    );
};