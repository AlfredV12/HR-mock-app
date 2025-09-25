// Structure for a job posting
export interface Job{
    id: number;
    title: string;
    slug: string;
    status: "active" | "archive";
    tags: string[];
    order: number;
};

// Structure for a candidate
export interface Candidate{
    id?: number;
    name: string;
    email: string;
    stage: "applied"|"screen"|"tech"|"offer"|"hired"|"rejected";
    jobId: number;
};

// Structure for an assessment associated with a job
export interface Assessment{
    jobId: number;
    title: string;
    sections: AssessmentSection[];

};

// Structure for a section within an assessment
export interface AssessmentSection {
  id: string;
  title: string;
  questions: Question[];
}

//Defines a single event in a candidate's timeline
export interface CandidateTimelineEvent{
    id?: number;
    candidateId: number;
    timestamp: Date;
    event: string;
    notes?: string;
};

export type QuestionType = 'short-text' | 'long-text' | 'single-choice' | 'multi-choice' | 'numeric' | 'file-upload';

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  options?: string[]; // For single/multi-choice
  validations?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number; // For numeric
    max?: number; // For numeric
  };
  condition?: {
    questionId: string;
    value: string;
  };
}