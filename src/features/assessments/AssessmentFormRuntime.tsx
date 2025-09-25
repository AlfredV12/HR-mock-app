// src/components/AssessmentFormRuntime.tsx
import { useForm } from 'react-hook-form';
import type { Assessment, Question } from '../../types';

interface AssessmentFormRuntimeProps {
  assessment: Assessment;
}

export const AssessmentFormRuntime = ({ assessment }: AssessmentFormRuntimeProps) => {
  const { register, watch, formState: { errors } } = useForm();

  const renderQuestion = (question: Question) => {
    // Check for conditional logic
    if (question.condition) {
      const watchedValue = watch(question.condition.questionId);
      if (watchedValue !== question.condition.value) {
        return null; // Don't render if condition isn't met
      }
    }

    switch (question.type) {
      case 'short-text':
        return <input {...register(question.id, question.validations)} placeholder={question.label} />;
      case 'long-text':
        return <textarea {...register(question.id, question.validations)} placeholder={question.label} />;
      case 'single-choice':
        return (
          <select {...register(question.id, question.validations)}>
            {question.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      // Add cases for other question types...
      default:
        return <p>Unsupported question type: {question.type}</p>;
    }
  };

  return (
    <form style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      {assessment.sections.map(section => (
        <fieldset key={section.id} style={{ marginBottom: '20px' }}>
          <legend>{section.title}</legend>
          {section.questions.map(q => (
            <div key={q.id} style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{q.label}</label>
              {renderQuestion(q)}
              {errors[q.id] && <p style={{ color: 'red', fontSize: '0.8em' }}>This field is required.</p>}
            </div>
          ))}
        </fieldset>
      ))}
    </form>
  );
};