// src/features/jobs/JobEditorModal.tsx

import { useForm, type SubmitHandler } from 'react-hook-form';
import { useEffect } from 'react';
import type { Job } from '../../types';

type JobFormData = Omit<Job, 'id' | 'order'> & { id?: number };

interface JobEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: JobFormData) => void;
  jobToEdit?: Job | null;
  serverError?: string | null;
}

export const JobEditorModal = ({ isOpen, onClose, onSave, jobToEdit, serverError }: JobEditorModalProps) => {
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<JobFormData>();

  useEffect(() => {
    if (isOpen) {
      if (jobToEdit) {
        reset(jobToEdit);
      } else {
        reset({ title: '', slug: '', status: 'active', tags: [] });
      }
    }
  }, [jobToEdit, reset, isOpen]);
  
  // Display server-side validation errors
  useEffect(() => {
    if (serverError) {
        setError("slug", { type: "server", message: serverError });
    }
  }, [serverError, setError]);

  if (!isOpen) return null;

  const onSubmit: SubmitHandler<JobFormData> = data => {
    onSave(data);
  };

  // Basic modal styles - replace with your own CSS solution
  const modalOverlayStyle: React.CSSProperties = { /* ... */ };
  const modalContentStyle: React.CSSProperties = { /* ... */ };

  return (
    <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
            <h2>{jobToEdit ? 'Edit Job' : 'Create New Job'}</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Title Input */}
                <div>
                    <label>Title</label>
                    <input {...register('title', { required: 'Title is required' })} />
                    {errors.title && <p style={{color: 'red'}}>{errors.title.message}</p>}
                </div>
                {/* Slug Input */}
                <div>
                    <label>Slug</label>
                    <input {...register('slug', { required: 'Slug is required' })} />
                    {errors.slug && <p style={{color: 'red'}}>{errors.slug.message}</p>}
                </div>
                {/* ... other form fields ... */}
                <button type="submit">Save</button>
                <button type="button" onClick={onClose}>Cancel</button>
            </form>
        </div>
    </div>
  );
};