// src/features/jobs/KanbanColumn.tsx

import { useDroppable } from '@dnd-kit/core';
import React from 'react';
import type { CSSProperties } from 'react';

interface KanbanColumnProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export const KanbanColumn = ({ id, title, children }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const style: CSSProperties = {
    backgroundColor: isOver ? '#e0e0e0' : '#f4f5f7',
    borderRadius: '4px',
    padding: '8px',
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'background-color 0.2s ease',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <h3 style={{ margin: '0 0 16px 0', padding: '0 8px', textTransform: 'capitalize' }}>{title}</h3>
      <div style={{ flexGrow: 1 }}>
        {children}
      </div>
    </div>
  );
};