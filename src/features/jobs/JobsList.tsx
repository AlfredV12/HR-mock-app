// src/jobs/JobsList.tsx

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData, type QueryFunctionContext } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { JobEditorModal } from './JobEditorModal';
import { useDebounce } from '../hooks/useDebounce';
import type { Job } from '../../types';

// --- API Fetching Function ---

interface ApiResponse {
  data: Job[];
  pagination: { page: number; pageSize: number; totalCount: number; };
}
type JobsQueryKey = ['jobs', { search: string; status: string; page: number }];

const fetchJobs = async ({ queryKey }: QueryFunctionContext<JobsQueryKey>): Promise<ApiResponse> => {
  const [_key, { search, status, page }] = queryKey;
  const params = new URLSearchParams({ status, page: page.toString() });
  if (search) params.append('search', search);
  const res = await fetch(`/api/jobs?${params.toString()}`);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

// --- Draggable Job Item Sub-component ---

const SortableJobItem = ({ job, onEdit, onArchive }: { job: Job, onEdit: (j: Job) => void, onArchive: (j: Job) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: job.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '1rem 1.5rem' }}>
        <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none', color: 'var(--primary-color)', fontWeight: 500 }}>
          {job.title}
        </Link>
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => onArchive(job)} className="button">
            {job.status === 'active' ? 'Archive' : 'Activate'}
          </button>
          <button onClick={() => onEdit(job)} className="button">
            Edit
          </button>
        </div>
      </div>
    </li>
  );
};

// --- Main JobsList Component ---

export const JobsList = () => {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchInput, 500);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);

  // Manages body scroll when modal is open/closed
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isModalOpen]);

  const queryKey: JobsQueryKey = ['jobs', { search: debouncedSearch, status, page }];
  const { data, isLoading, isError } = useQuery({ queryKey, queryFn: fetchJobs, placeholderData: keepPreviousData });
  
  // --- Mutations ---

  // Mutation for creating and editing jobs (not optimistic)
  const saveJobMutation = useMutation({
    mutationFn: (jobData: Job | Omit<Job, 'id' | 'order'>) => {
      const isEditing = 'id' in jobData;
      const url = isEditing ? `/api/jobs/${jobData.id}` : '/api/jobs';
      const method = isEditing ? 'PATCH' : 'POST';
      return fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(jobData) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setIsModalOpen(false);
    },
  });
  
  // Optimistic mutation for archiving/unarchiving
  const archiveMutation = useMutation({
    mutationFn: (jobToUpdate: Job) => {
        const newStatus = jobToUpdate.status === 'active' ? 'archive' : 'active';
        return fetch(`/api/jobs/${jobToUpdate.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
    },
    onMutate: async (jobToUpdate) => {
        await queryClient.cancelQueries({ queryKey });
        const previousData = queryClient.getQueryData<ApiResponse>(queryKey);

        // Optimistically remove the job from the list
        queryClient.setQueryData<ApiResponse>(queryKey, (old) => 
            old ? { ...old, data: old.data.filter(job => job.id !== jobToUpdate.id) } : undefined
        );
        return { previousData };
    },
    onError: (_err, _job, context) => {
        if (context?.previousData) {
            queryClient.setQueryData(queryKey, context.previousData);
        }
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
    },
  });

  // Optimistic mutation for reordering jobs
  const reorderMutation = useMutation({
    mutationFn: (reorderedJobs: Job[]) => 
      fetch('/api/jobs/reorder', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: reorderedJobs.map((job, index) => ({ ...job, order: index })) }) 
      }),
    onMutate: async (reorderedJobs) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<ApiResponse>(queryKey);
      queryClient.setQueryData<ApiResponse>(queryKey, (old) => old ? { ...old, data: reorderedJobs } : undefined);
      return { previousData };
    },
    onError: (_err, _newJobs, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // --- Event Handlers ---

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && data?.data) {
      const oldIndex = data.data.findIndex(j => j.id === active.id);
      const newIndex = data.data.findIndex(j => j.id === over.id);
      const reorderedJobs = arrayMove(data.data, oldIndex, newIndex);
      reorderMutation.mutate(reorderedJobs);
    }
  };
  
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const handleOpenModal = (job: Job | null = null) => { setIsModalOpen(true); setJobToEdit(job); };
  const handleSave = (jobData: Job | Omit<Job, 'id' | 'order'>) => { saveJobMutation.mutate(jobData); };
  const handleArchive = (job: Job) => { archiveMutation.mutate(job); };

  const totalPages = data ? Math.ceil(data.pagination.totalCount / data.pagination.pageSize) : 0;

  // Safely filter and memoize the list to prevent passing `undefined` IDs to dnd-kit
  const jobItems = useMemo(() => data?.data.filter(job => job.id != null) ?? [], [data]);
  const jobItemIds = useMemo(() => jobItems.map(job => job.id), [jobItems]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Job Postings</h2>
        <button className="button" onClick={() => handleOpenModal()}>+ Create Job</button>
      </div>
      <div className="card">
        <div className="filter-bar">
          <input type="text" placeholder="Search jobs by title..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="input" style={{ maxWidth: '300px' }}/>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="select" style={{ maxWidth: '150px' }}>
            <option value="active">Active</option>
            <option value="archive">Archived</option>
          </select>
        </div>
        
        {isLoading && <div style={{ padding: '1rem' }}>Loading...</div>}
        {isError && <div style={{ color: 'red', padding: '1rem' }}>Error fetching jobs.</div>}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={jobItemIds} strategy={verticalListSortingStrategy}>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {jobItems.map(job => (
                <SortableJobItem key={job.id} job={job} onEdit={handleOpenModal} onArchive={handleArchive} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} className="button">Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => (data && page < totalPages ? p + 1 : p))} disabled={!data || page >= totalPages} className="button">Next</button>
        </div>
      </div>
      <JobEditorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} jobToEdit={jobToEdit} />
    </div>
  );
};