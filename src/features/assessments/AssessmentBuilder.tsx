// src/components/AssessmentBuilder.tsx
import { useReducer } from 'react';
import type { Assessment, AssessmentSection, Question, QuestionType } from '../../types';
import { AssessmentFormRuntime } from './AssessmentFormRuntime';
import { faker } from '@faker-js/faker';

// --- Reducer Logic ---
type AssessmentAction =
  | { type: 'UPDATE_SECTION_TITLE'; payload: { sectionId: string; title: string } }
  | { type: 'ADD_SECTION' }
  | { type: 'REMOVE_SECTION'; payload: { sectionId: string } }
  | { type: 'ADD_QUESTION'; payload: { sectionId: string } }
  | { type: 'REMOVE_QUESTION'; payload: { sectionId: string; questionId: string } }
  | { type: 'UPDATE_QUESTION'; payload: { sectionId: string; questionId: string; props: Partial<Question> } };

const assessmentReducer = (state: Assessment, action: AssessmentAction): Assessment => {
  switch (action.type) {
    case 'ADD_SECTION':
      const newSection: AssessmentSection = { id: faker.string.uuid(), title: 'New Section', questions: [] };
      return { ...state, sections: [...state.sections, newSection] };
    case 'REMOVE_SECTION':
      return { ...state, sections: state.sections.filter(s => s.id !== action.payload.sectionId) };
    case 'UPDATE_SECTION_TITLE':
      return { ...state, sections: state.sections.map(s => s.id === action.payload.sectionId ? { ...s, title: action.payload.title } : s) };
    case 'ADD_QUESTION':
      const newQuestion: Question = { id: faker.string.uuid(), type: 'short-text', label: 'New Question' };
      return { ...state, sections: state.sections.map(s => s.id === action.payload.sectionId ? { ...s, questions: [...s.questions, newQuestion] } : s) };
    case 'REMOVE_QUESTION':
      return { ...state, sections: state.sections.map(s => s.id === action.payload.sectionId ? { ...s, questions: s.questions.filter(q => q.id !== action.payload.questionId) } : s) };
    case 'UPDATE_QUESTION':
      return { ...state, sections: state.sections.map(s => s.id === action.payload.sectionId ? { ...s, questions: s.questions.map(q => q.id === action.payload.questionId ? { ...q, ...action.payload.props } : q) } : s) };
    default:
      return state;
  }
};

const initialAssessment: Assessment = {
  jobId: 1,
  title: 'Sample Assessment',
  sections: [{
    id: 'sec1',
    title: 'Basic Information',
    questions: [{
      id: 'q1', type: 'short-text', label: 'What is your name?', validations: { required: true }
    }, {
      id: 'q2', type: 'single-choice', label: 'Legally authorized to work?', options: ['Yes', 'No'], validations: { required: true }
    }, {
      id: 'q3', type: 'long-text', label: 'Provide work authorization details.', condition: { questionId: 'q2', value: 'Yes' }
    }]
  }]
};
const QUESTION_TYPES: QuestionType[] = ['short-text', 'long-text', 'single-choice', 'multi-choice', 'numeric'];

export const AssessmentBuilder = () => {
  const [assessment, dispatch] = useReducer(assessmentReducer, initialAssessment);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>
      <div>
        <h2>Builder Controls</h2>
        {assessment.sections.map(section => (
          <div key={section.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px' }}>
            <input 
              value={section.title}
              onChange={(e) => dispatch({ type: 'UPDATE_SECTION_TITLE', payload: { sectionId: section.id, title: e.target.value }})}
            />
            <button onClick={() => dispatch({ type: 'REMOVE_SECTION', payload: { sectionId: section.id } })}>Remove Section</button>
            {section.questions.map(q => (
              <div key={q.id}>
                <input
                  value={q.label}
                  onChange={(e) => dispatch({ type: 'UPDATE_QUESTION', payload: { sectionId: section.id, questionId: q.id, props: { label: e.target.value } }})}
                />
                <select 
                  value={q.type}
                  onChange={(e) => dispatch({ type: 'UPDATE_QUESTION', payload: { sectionId: section.id, questionId: q.id, props: { type: e.target.value as QuestionType } }})}
                >
                  {QUESTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <button onClick={() => dispatch({ type: 'REMOVE_QUESTION', payload: { sectionId: section.id, questionId: q.id } })}>X</button>
              </div>
            ))}
            <button onClick={() => dispatch({ type: 'ADD_QUESTION', payload: { sectionId: section.id } })}>+ Add Question</button>
          </div>
        ))}
        <button onClick={() => dispatch({ type: 'ADD_SECTION' })}>+ Add New Section</button>
      </div>
      <div>
        <h2>Live Preview</h2>
        <AssessmentFormRuntime assessment={assessment} />
      </div>
    </div>
  );
};