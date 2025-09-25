// hr-app/src/features/candidates/KanbanColumn.tsx

import { useDroppable } from '@dnd-kit/core';
import React from 'react';
import type { CSSProperties } from 'react';

interface KanbanColumnProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export const KanbanColumn = ({ id, title, children }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id }); // The ID must match the stage name

  const style: CSSProperties = {
    backgroundColor: '#f4f5f7',
    borderRadius: '4px',
    padding: '8px',
    minWidth: '250px',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <h3 style={{ margin: '0 0 16px 0', padding: '0 8px' }}>{title}</h3>
      {children}
    </div>
  );
};