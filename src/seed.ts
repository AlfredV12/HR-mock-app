// src/seed.ts
import { db } from './db';
import { faker } from '@faker-js/faker';
import type { Candidate, Job, Assessment } from './types';

const NUM_JOBS_TO_SEED = 25;
const NUM_CANDIDATES_TO_SEED = 1000;
const STAGES: Candidate['stage'][] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];

export async function seedDatabase() {
  try {
    const jobCount = await db.jobs.count();
    if (jobCount > 0) {
      console.log('Database already seeded.');
      return;
    }
    console.log('Seeding database...');

    // --- Seed Jobs ---
    // FIX: Type the array as Omit<Job, 'id'>[] to accurately represent data without an ID.
    const jobsToSeed: Omit<Job, 'id'>[] = [];
    for (let i = 0; i < NUM_JOBS_TO_SEED; i++) {
      const jobTitle = faker.person.jobTitle(); // Generate title once
      jobsToSeed.push({
        title: jobTitle,
        slug: faker.helpers.slugify(jobTitle).toLowerCase(), // Reuse it here
        status: faker.helpers.arrayElement(['active', 'archive']),
        tags: faker.helpers.arrayElements(['Remote', 'Full-time', 'Engineering'], { min: 1, max: 3 }),
        order: i,
      });
    }
    await db.jobs.bulkAdd(jobsToSeed as Job[]);

    // --- Seed Candidates ---
    // FIX: Apply the same Omit pattern for candidates.
    const candidatesToSeed: Omit<Candidate, 'id'>[] = [];
    for (let i = 0; i < NUM_CANDIDATES_TO_SEED; i++) {
      candidatesToSeed.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        stage: faker.helpers.arrayElement(STAGES),
        jobId: faker.number.int({ min: 1, max: NUM_JOBS_TO_SEED }),
      });
    }
    await db.candidates.bulkAdd(candidatesToSeed as Candidate[]);

    // --- Seed Assessments ---
    // FIX: Apply the same Omit pattern for assessments.
    const assessmentsToSeed: Omit<Assessment, 'id'>[] = [
      {
        jobId: 1,
        title: 'Frontend Developer Skills Assessment',
        sections: [{ id: 'sec1', title: 'Basic Information', questions: [{ id: 'q1', type: 'short-text', label: 'What is your name?', validations: { required: true } }] }]
      },
      {
        jobId: 2,
        title: 'Backend Engineering Challenge',
        sections: [{ id: 'secA', title: 'Database Knowledge', questions: [{ id: 'qA1', type: 'long-text', label: 'Describe the difference between SQL and NoSQL databases.' }] }]
      },
      {
        jobId: 3,
        title: 'UI/UX Design Portfolio Review',
        sections: [{ id: 'secB', title: 'Portfolio Submission', questions: [{ id: 'qB1', type: 'file-upload', label: 'Please upload a link to your portfolio.' }] }]
      },
    ];
    await db.assessments.bulkAdd(assessmentsToSeed as Assessment[]);

    console.log('Database seeding complete.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}