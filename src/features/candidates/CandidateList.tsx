// hr-app/src/features/candidates/CandidateList.tsx

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { faker } from '@faker-js/faker'; // Make sure you have `npm install @faker-js/faker`
import type { Candidate } from '../../types.ts';

// Create a large array of 1000+ mock candidates
const candidates: Candidate[] = Array.from({ length: 1000 }).map(() => ({
//   id: faker.number.int({ min: 1, max: 1000 }), //No need for id as it's optional
  name: faker.person.fullName(),
  email: faker.internet.email(),
  stage: faker.helpers.arrayElement(["applied","screen","tech","offer","hired","rejected"]),
  jobId: faker.number.int({ min: 1, max: 100}),
}));

// 2. --- Create the missing component to render one item ---
const CandidateListItem = ({ candidate }: { candidate: Candidate }) => {
  return (
    <div style={{ padding: '10px 20px', borderBottom: '1px solid #eee' }}>
      <p style={{ fontWeight: 'bold', margin: 0 }}>{candidate.name}</p>
      <p style={{ color: '#666', margin: 0 }}>{candidate.email}</p>
    </div>
  );
};

// 3. --- Export the main component ---
export const CandidateList = () => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: candidates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 75, // Estimate height of one row
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '80vh', overflow: 'auto', border: '1px solid #ccc' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {/* Render your CandidateListItem component here */}
            <CandidateListItem candidate={candidates[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};