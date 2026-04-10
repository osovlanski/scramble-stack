import axios from 'axios';
import type { Question, QuestionsResponse, Session, SessionResult, InterviewMessage } from './types';

const http = axios.create({ baseURL: '/api' });

export async function fetchQuestions(params: {
  company?: string;
  genre?: string;
  difficulty?: string;
  q?: string;
}): Promise<QuestionsResponse> {
  const { data } = await http.get<QuestionsResponse>('/questions', { params });
  return data;
}

export async function fetchQuestion(id: string): Promise<Question> {
  const { data } = await http.get<Question>(`/questions/${id}`);
  return data;
}

export async function generateQuestion(params: {
  company?: string;
  genre: string;
  difficulty: string;
}): Promise<{ id: string }> {
  const { data } = await http.post<{ id: string }>('/questions/generate', params);
  return data;
}

export async function createSession(params: {
  questionId: string;
  mode: string;
}): Promise<Session & { messages: InterviewMessage[] }> {
  const { data } = await http.post('/sessions', params);
  return data;
}

export async function sendMessage(sessionId: string, content: string): Promise<{
  content: string;
  readyToSubmit: boolean;
  messages: InterviewMessage[];
}> {
  const { data } = await http.post(`/sessions/${sessionId}/message`, { content });
  return data;
}

export async function submitSession(sessionId: string, params: {
  textAnswer: string;
  canvasDiagramId?: string;
}): Promise<{ ok: boolean; score: number | null }> {
  const { data } = await http.post(`/sessions/${sessionId}/submit`, params);
  return data;
}

export async function fetchResult(sessionId: string): Promise<SessionResult> {
  const { data } = await http.get<SessionResult>(`/sessions/${sessionId}/result`);
  return data;
}
