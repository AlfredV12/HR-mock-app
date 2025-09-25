import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { faker } from '@faker-js/faker';
import type { Candidate, Job } from '../types';

/**
 * Simulates network latency and a potential random error.
 * @param errorRate The probability of the request failing (0 to 1).
 * @returns A promise that resolves to an HttpResponse on error, or null on success.
 */
const simulateNetwork = async (errorRate = 0.05) => {
  const delay = faker.number.int({ min: 200, max: 1200 });
  await new Promise(resolve => setTimeout(resolve, delay));

  if (Math.random() < errorRate) {
    return HttpResponse.json(
      { message: 'A random network error occurred!' },
      { status: 500 }
    );
  }
  return null;
};

export const handlers = [
  // --- JOB HANDLERS ---

  http.get('/api/jobs', async ({ request }) => {
    const netError = await simulateNetwork();
    if (netError) return netError;

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    let jobs = await db.jobs.orderBy('order').toArray();

    // Filter by status if the query parameter is present
    if (status) {
      jobs = jobs.filter(job => job.status === status);
    }
    
    // The front-end components expect the flat array to be in a `data` property
    return HttpResponse.json({
      data: jobs,
    });
  }),

  http.get('/api/jobs/:id', async ({ params }) => {
    const netError = await simulateNetwork();
    if (netError) return netError;
    
    const job = await db.jobs.get(Number(params.id));
    return job
      ? HttpResponse.json(job)
      : HttpResponse.json({ message: 'Job not found' }, { status: 404 });
  }),

  http.post('/api/jobs', async ({ request }) => {
    const netError = await simulateNetwork(0.1);
    if (netError) return netError;

    const newJobData = (await request.json()) as Omit<Job, 'id' | 'order'>;

    // Validation for unique slug
    const existingJob = await db.jobs.where('slug').equals(newJobData.slug).first();
    if (existingJob) {
        return HttpResponse.json({ message: 'Slug must be unique.' }, { status: 409 });
    }

    const count = await db.jobs.count();
    const newId = await db.jobs.add({ ...newJobData, order: count } as Job);
    const newJob = await db.jobs.get(newId);
    
    return HttpResponse.json(newJob, { status: 201 });
  }),

  http.patch('/api/jobs/:id', async ({ request, params }) => {
    const netError = await simulateNetwork(0.1);
    if (netError) return netError;
    
    const id = Number(params.id);
    const updates = (await request.json()) as Partial<Job>;

    // Validation for unique slug on update
    if (updates.slug) {
        const existingJob = await db.jobs.where('slug').equals(updates.slug).first();
        if (existingJob && existingJob.id !== id) {
            return HttpResponse.json({ message: 'Slug must be unique.' }, { status: 409 });
        }
    }

    const updatedCount = await db.jobs.update(id, updates);

    if (updatedCount === 0) {
      return HttpResponse.json({ message: 'Job not found' }, { status: 404 });
    }

    const updatedJob = await db.jobs.get(id);
    return HttpResponse.json(updatedJob);
  }),

  http.patch('/api/jobs/reorder', async ({ request }) => {
    const netError = await simulateNetwork(0.3);
    if (netError) return netError;

    const { jobs } = (await request.json()) as { jobs: Job[] };
    await db.jobs.bulkPut(jobs);

    return HttpResponse.json({ message: 'Order updated successfully' });
  }),

  // --- CANDIDATE HANDLERS ---

  http.get('/api/candidates', async () => {
    const netError = await simulateNetwork();
    if (netError) return netError;
    
    const results = await db.candidates.toArray();
    // Return the flat array directly as the Kanban board will group it
    return HttpResponse.json(results);
  }),

  http.patch('/api/candidates/:candidateId', async ({ request, params }) => {
    const netError = await simulateNetwork(0.1);
    if (netError) return netError;

    const id = Number(params.candidateId);
    const updates = (await request.json()) as Partial<Candidate>;

    const updatedCount = await db.candidates.update(id, updates);

    if (updatedCount === 0) {
        return HttpResponse.json({ message: 'Candidate not found' }, { status: 404 });
    }

    const updatedCandidate = await db.candidates.get(id);
    return HttpResponse.json(updatedCandidate);
  }),
];