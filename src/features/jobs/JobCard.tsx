// src/features/jobs/JobCard.tsx

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Job } from '../../types';

interface JobCardProps {
  job: Job;
  onEdit: (job: Job) => void;
}

export const JobCard = ({ job, onEdit }: JobCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    data: { // Pass the job data for use in onDragEnd
      job,
      stage: job.status,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '4px',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>{job.title}</span>
            <button onClick={() => onEdit(job)} style={{ marginLeft: '8px' }}>Edit</button>
        </div>
    </div>
  );
};