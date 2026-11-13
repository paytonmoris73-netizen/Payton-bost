export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  grade: string;
  subjects: string[];
  createdAt: number;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  noteCount: number;
  flashcardCount: number;
  quizCount: number;
  lastStudied?: number;
  mastery: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  createdAt: number;
  updatedAt: number;
  sourceType?: "recording" | "upload" | "manual" | "ai-generated";
  tags: string[];
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  nextReview: number;
  interval: number;
  easeFactor: number;
  reviews: number;
  correct: number;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  subjectId: string;
  cardCount: number;
  dueCount: number;
  mastery: number;
  createdAt: number;
  lastStudied?: number;
}

export interface Quiz {
  id: string;
  title: string;
  subjectId: string;
  questions: QuizQuestion[];
  createdAt: number;
  attempts: QuizAttempt[];
}

export interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "fill-blank" | "short-answer";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  answers: Record<string, string>;
  score: number;
  total: number;
  completedAt: number;
}

export interface Recording {
  id: string;
  title: string;
  subjectId: string;
  duration: number;
  transcript?: string;
  createdAt: number;
  status: "recording" | "processing" | "ready" | "error";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  attachments?: { type: string; name: string; url?: string }[];
}

export interface TutorSession {
  id: string;
  subjectId?: string;
  topic?: string;
  mode: "teach" | "step-by-step" | "deep" | "beginner" | "test-prep" | "socratic";
  messages: ChatMessage[];
  createdAt: number;
}

export interface HomeworkSolution {
  id: string;
  question: string;
  questionImage?: string;
  subject: string;
  steps: SolutionStep[];
  finalAnswer: string;
  createdAt: number;
}

export interface SolutionStep {
  stepNumber: number;
  title: string;
  content: string;
  explanation: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: "assignment" | "exam" | "study-session" | "deadline" | "reminder";
  subjectId?: string;
  date: number;
  endDate?: number;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

export interface StudySession {
  id: string;
  subjectId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  type: "flashcards" | "quiz" | "notes" | "tutor" | "focus" | "game";
  score?: number;
}
