import { Section } from './types';

export const SECTIONS: Section[] = [
  {
    id: 'A',
    title: 'Section A: The Nature of the Task',
    subtitle: 'The "AI Fit" Score',
    questions: [
      { id: 1, text: 'Is the task highly repetitive?', type: 'binary' },
      { id: 2, text: 'Is the task data-intensive?', type: 'binary', description: 'Does it require analyzing large volumes of text, numbers, or images?' },
      { id: 3, text: 'Does the task rely on finding patterns in data?', type: 'binary', description: 'For example, screening resumes, identifying trends.' },
      { id: 4, text: 'Is the task about generating standardized or templated content?', type: 'binary', description: 'For example, drafting first versions of job descriptions, emails.' },
      { id: 5, text: 'Have you already explored non-AI solutions, and found they are not sufficient?', type: 'binary' },
    ]
  },
  {
    id: 'B',
    title: 'Section B: The Impact of the Problem',
    subtitle: 'The "Pain Point" Score',
    questions: [
      { id: 6, text: 'What is the resource impact of this friction point?', type: 'rating', description: 'For example, time, financial, physical (1 = very low, 5 = very high)' },
      { id: 7, text: 'What is the psychological impact of this friction point on employees?', type: 'rating', description: 'For example, stress or frustration (1 = very low, 5 = very high)' },
      { id: 8, text: 'How often does this friction point lead to errors?', type: 'rating', description: 'What is the error rate in terms of rework? (1 = very low, 5 = very high)' },
      { id: 9, text: 'What is the impact of this friction point on the organization’s goals?', type: 'rating', description: 'What is the strategic cost of doing nothing? (1 = very low, 5 = very high)' },
    ]
  },
  {
    id: 'C',
    title: 'Section C: Process Quality',
    subtitle: '"Don’t Automate Bad Processes"',
    questions: [
      { id: 10, text: 'Is the current process well defined and stable?', type: 'binary', description: 'In other words, not constantly changing or completely ad hoc.' },
      { id: 11, text: 'Are the desired outcomes of the process clear and agreed upon?', type: 'binary', description: 'Do we know what "good" looks like?' },
      { id: 12, text: 'Has the process already been simplified as much as possible?', type: 'binary' },
    ]
  },
  {
    id: 'D',
    title: 'Section D: Data Quality',
    subtitle: '"Garbage In, Garbage Out"',
    questions: [
      { id: 13, text: 'Do we have access to the right data needed for the AI to learn or operate?', type: 'binary', description: 'For example, historical records, relevant documents that are fit for purpose.' },
      { id: 14, text: 'Is the available data of sufficient quality?', type: 'binary', description: 'Is the data accurate, complete, relatively clean and up to date?' },
      { id: 15, text: 'Is the data structured and in a usable format?', type: 'binary', description: 'For example, in a database with appropriate governance, in a machine-readable format.' },
    ]
  },
  {
    id: 'E',
    title: 'Section E: Compliance and Ethics',
    subtitle: 'Mandatory Policy Check',
    questions: [
      { id: 16, text: 'Does the AI tool process any personally identifiable information?', type: 'compliance', description: 'Names, employee numbers, performance ratings, financial info, etc.' },
      { id: 17, text: 'Does the AI tool assist or replace a human in making an administrative decision about or impacting an individual?', type: 'compliance', description: 'Screening resumes, determining eligibility, automating approvals, etc.' },
      { id: 18, text: 'Does the data used to train or operate the AI carry legal, compliance or accountability implications if errors occur?', type: 'compliance', description: 'For example, historical biases in training data, lack of data on marginalized groups.' },
    ]
  }
];
