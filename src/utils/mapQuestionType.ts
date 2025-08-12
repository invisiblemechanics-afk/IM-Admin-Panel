export function mapQuestionType(uiValue: string): 'MCQ' | 'MultipleAnswer' | 'Numerical' {
  // Map UI display values to internal QuestionType enum values
  if (/multiple/i.test(uiValue) && (/answer|correct/i.test(uiValue) || /multi/i.test(uiValue))) {
    return 'MultipleAnswer';
  }
  if (/numerical/i.test(uiValue)) {
    return 'Numerical';
  }
  return 'MCQ'; // Default to single choice MCQ
}

export function mapQuestionTypeToUI(type: string): string {
  // Map internal type to UI display string
  switch (type) {
    case 'MultipleAnswer':
      return 'Multiple Choice (Multiple Answers)';
    case 'Numerical':
      return 'Numerical';
    case 'MCQ':
    default:
      return 'Multiple Choice (Single Answer)';
  }
}




