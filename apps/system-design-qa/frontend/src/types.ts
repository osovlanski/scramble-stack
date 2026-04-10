export interface Question {
  id: string;
  title: string;
  company: string | null;
  genre: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  hints: string[];
  isAiGenerated: boolean;
  createdAt: string;
}

export interface QuestionsResponse {
  questions: Question[];
  total: number;
}

export type SessionMode = 'structured' | 'interview' | 'graded';
export type SessionStatus = 'in_progress' | 'submitted' | 'scored';

export interface InterviewMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Session {
  id: string;
  mode: SessionMode;
  status: SessionStatus;
  messages: InterviewMessage[];
}

export interface ScoreBreakdown {
  scalability: number;
  data_model: number;
  component_design: number;
  reliability: number;
  tradeoffs: number;
}

export interface SessionResult {
  score: number;
  breakdown: ScoreBreakdown;
  strengths: string;
  gaps: string;
  modelAnswer: string;
  mode: SessionMode;
}
