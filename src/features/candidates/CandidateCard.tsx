import type { Candidate } from '../../types';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface CandidateCardProps {
  candidate: Candidate;
}

export const CandidateCard = ({ candidate }: CandidateCardProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: candidate.id!, // The unique ID for this draggable item
    data: { stage: candidate.stage }, // Pass the original stage for comparison
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    padding: '10px 20px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '8px',
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <p style={{ fontWeight: 'bold', margin: 0 }}>{candidate.name}</p>
      <p style={{ color: '#666', margin: 0, fontSize: '0.9em' }}>{candidate.email}</p>
    </div>
  );
};