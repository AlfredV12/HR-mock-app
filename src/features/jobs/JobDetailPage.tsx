// src/jobs/JobDetailPage.tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Job } from '../../types';

const fetchJobById = async (jobId: string): Promise<Job> => {
  const res = await fetch(`/api/jobs/${jobId}`);
  if (!res.ok) throw new Error('Failed to fetch job');
  return res.json();
};

export const JobDetailPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => fetchJobById(jobId!),
    enabled: !!jobId,
  });

  if (isLoading) return <div>Loading job details...</div>;
  if (isError) return <div>Error loading job.</div>;

  return (
    <div className="card">
      <h1>{job?.title}</h1>
      <p><strong>Status:</strong> {job?.status}</p>
      <p><strong>Slug:</strong> /jobs/{job?.slug}</p>
      <div>
        <strong>Tags:</strong>
        {job?.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
      </div>
    </div>
  );
};