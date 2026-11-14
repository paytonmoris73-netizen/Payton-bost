export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: number;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  accentColor: string;
  fontSize: "small" | "medium" | "large";
  aiDifficulty: "beginner" | "intermediate" | "advanced";
  preferredExplanationStyle: "simple" | "detailed" | "step-by-step" | "visual";
  reducedMotion: boolean;
  dyslexiaFont: boolean;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Document {
  id: string;
  subjectId?: string;
  projectId?: string;
  name: string;
  type: "pdf" | "docx" | "txt" | "pptx" | "image" | "audio" | "video" | "link" | "text";
  content: string;
  extractedText?: string;
  pages?: number;
  size?: number;
  url?: string;
  createdAt: number;
  updatedAt: number;
  processed: boolean;
}

export interface Recording {
  id: string;
  subjectId?: string;
  projectId?: string;
  title: string;
  duration: number;
  audioUrl?: string;
  audioBlob?: Blob;
  transcript?: string;
  timestamps?: TranscriptSegment[];
  bookmarks: AudioBookmark[];
  createdAt: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface AudioBookmark {
  id: string;
  time: number;
  label: string;
}

export interface Note {
  id: string;
  subjectId?: string;
  projectId?: string;
  title: string;
  content: string;
  format: "rich" | "cornell" | "outline" | "qa";
  tags: string[];
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface FlashcardDeck {
  id: string;
  subjectId?: string;
  projectId?: string;
  name: string;
  description?: string;
  cards: Flashcard[];
  createdAt: number;
  updatedAt: number;
  lastStudied?: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  type: "basic" | "vocabulary" | "fill-blank" | "image" | "math";
  difficulty: number;
  interval: number;
  nextReview: number;
  lastReview?: number;
  reviews: number;
  correct: number;
  streak: number;
}

export interface Test {
  id: string;
  subjectId?: string;
  projectId?: string;
  title: string;
  description?: string;
  type: "quiz" | "chapter" | "unit" | "final" | "mock" | "vocabulary" | "mixed";
  questions: Question[];
  settings: TestSettings;
  createdAt: number;
  updatedAt: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  topic?: string;
  sourceRef?: string;
  imageUrl?: string;
}

export type QuestionType =
  | "multiple-choice"
  | "multiple-select"
  | "true-false"
  | "fill-blank"
  | "short-answer"
  | "long-answer"
  | "essay"
  | "matching"
  | "ordering"
  | "vocabulary"
  | "math"
  | "diagram"
  | "explain";

export interface TestSettings {
  timeLimit?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showOneAtATime: boolean;
  showExplanationsAfterEach: boolean;
  allowRetakes: boolean;
  enableHints: boolean;
  passingGrade: number;
}

export interface TestAttempt {
  id: string;
  testId: string;
  answers: Record<string, string | string[]>;
  score: number;
  totalPoints: number;
  percentage: number;
  timeTaken: number;
  startedAt: number;
  completedAt?: number;
  graded: boolean;
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  answer: string | string[];
  correct: boolean;
  pointsEarned: number;
  feedback?: string;
}

export interface Podcast {
  id: string;
  subjectId?: string;
  projectId?: string;
  title: string;
  description?: string;
  style: PodcastStyle;
  duration?: number;
  audioUrl?: string;
  script?: string;
  createdAt: number;
  status: "generating" | "ready" | "error";
  listenProgress?: number;
}

export type PodcastStyle =
  | "one-host"
  | "two-host"
  | "teacher-student"
  | "interview"
  | "debate"
  | "explanation"
  | "revision"
  | "exam-prep"
  | "qa"
  | "story";

export interface Conversation {
  id: string;
  subjectId?: string;
  projectId?: string;
  title: string;
  mode: AIMode;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  archived: boolean;
}

export type AIMode =
  | "explain"
  | "teach"
  | "socratic"
  | "homework"
  | "deep-reasoning"
  | "test-prep"
  | "writing"
  | "language"
  | "image-tutor";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  attachments?: string[];
}

export interface StudySession {
  id: string;
  subjectId?: string;
  type: "flashcards" | "test" | "notes" | "audio" | "ai" | "game";
  duration: number;
  startedAt: number;
  endedAt?: number;
  score?: number;
  cardsReviewed?: number;
  questionsAnswered?: number;
}

export interface CalendarEvent {
  id: string;
  subjectId?: string;
  title: string;
  type: "exam" | "assignment" | "study" | "class" | "review" | "deadline" | "project" | "other";
  startTime: number;
  endTime: number;
  allDay: boolean;
  completed: boolean;
  notes?: string;
}

export interface StudyGuide {
  id: string;
  subjectId?: string;
  projectId?: string;
  topic: string;
  style: "comprehensive" | "quick" | "exam-prep" | "concept-map";
  content: string;
  sourceDocIds: string[];
  createdAt: number;
}

export interface LearningStats {
  totalStudyTime: number;
  questionsCompleted: number;
  averageScore: number;
  flashcardsReviewed: number;
  topicsMastered: string[];
  topicsNeedWork: string[];
  weeklyConsistency: number[];
  streakDays: number;
  lastStudiedAt?: number;
}
