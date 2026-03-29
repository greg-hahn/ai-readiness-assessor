export type SectionId = 'intro' | 'A' | 'B' | 'C' | 'D' | 'E' | 'results';

export interface Question {
  id: number;
  text: string;
  type: 'binary' | 'rating' | 'compliance';
  description?: string;
}

export interface Section {
  id: SectionId;
  title: string;
  subtitle?: string;
  questions: Question[];
}

export interface AssessmentState {
  problemDescription: string;
  answers: Record<number, number | boolean>;
  currentSection: SectionId;
}
