// src/db.ts
import Dexie, { type Table } from 'dexie';
import type { Job, Candidate, Assessment, CandidateTimelineEvent } from './types';

export class MySubClassedDexie extends Dexie {
  // We need to declare the tables properties right here
  jobs!: Table<Job>;
  candidates!: Table<Candidate>;
  assessments!: Table<Assessment>;
  timeline!: Table<CandidateTimelineEvent>;

  constructor() {
    super('myAppDatabase');
    this.version(1).stores({
      // '++id' is the primary key (auto-incrementing)
      // 'slug, status, *tags' are indexes for faster queries
      jobs: '++id, slug, status, *tags, order',
      // 'jobId' is an index to quickly find candidates for a specific job
      candidates: '++id, jobId, stage',
      assessments: '++id, jobId',
      timeline: '++id, candidateId, timestamp',
    });
  }
}

// Export a single instance of the database
export const db = new MySubClassedDexie();