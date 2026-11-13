import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  UserProfile, Subject, Note, FlashcardDeck, Flashcard,
  Quiz, QuizAttempt, Recording, TutorSession, ChatMessage,
  HomeworkSolution, CalendarEvent, StudySession,
} from "../types";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "math", name: "Mathematics", icon: "calculator", color: "#6366f1", noteCount: 0, flashcardCount: 0, quizCount: 0, mastery: 0 },
  { id: "science", name: "Science", icon: "flask", color: "#22c55e", noteCount: 0, flashcardCount: 0, quizCount: 0, mastery: 0 },
  { id: "english", name: "English", icon: "book-open", color: "#f59e0b", noteCount: 0, flashcardCount: 0, quizCount: 0, mastery: 0 },
  { id: "history", name: "History", icon: "landmark", color: "#ef4444", noteCount: 0, flashcardCount: 0, quizCount: 0, mastery: 0 },
  { id: "geography", name: "Geography", icon: "globe", color: "#06b6d4", noteCount: 0, flashcardCount: 0, quizCount: 0, mastery: 0 },
  { id: "cs", name: "Computer Science", icon: "code", color: "#8b5cf6", noteCount: 0, flashcardCount: 0, quizCount: 0, mastery: 0 },
];

interface AppState {
  profile: UserProfile | null;
  darkMode: boolean;
  subjects: Subject[];
  notes: Note[];
  flashcardDecks: FlashcardDeck[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  recordings: Recording[];
  tutorSessions: TutorSession[];
  homeworkSolutions: HomeworkSolution[];
  calendarEvents: CalendarEvent[];
  studySessions: StudySession[];
  sidebarOpen: boolean;

  setProfile: (p: UserProfile) => void;
  toggleDarkMode: () => void;
  setSidebarOpen: (open: boolean) => void;
  addSubject: (name: string, icon: string, color: string) => Subject;
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addFlashcardDeck: (deck: Omit<FlashcardDeck, "id" | "createdAt" | "cardCount" | "dueCount" | "mastery">) => FlashcardDeck;
  addFlashcard: (card: Omit<Flashcard, "id" | "nextReview" | "interval" | "easeFactor" | "reviews" | "correct">) => Flashcard;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void;
  deleteFlashcard: (id: string) => void;
  addQuiz: (quiz: Omit<Quiz, "id" | "createdAt" | "attempts">) => Quiz;
  addQuizAttempt: (attempt: Omit<QuizAttempt, "id" | "completedAt">) => QuizAttempt;
  addTutorSession: (session: Omit<TutorSession, "id" | "createdAt">) => TutorSession;
  addTutorMessage: (sessionId: string, msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  addHomeworkSolution: (sol: Omit<HomeworkSolution, "id" | "createdAt">) => HomeworkSolution;
  addCalendarEvent: (event: Omit<CalendarEvent, "id">) => CalendarEvent;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  addStudySession: (session: Omit<StudySession, "id">) => StudySession;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      darkMode: false,
      subjects: DEFAULT_SUBJECTS,
      notes: [],
      flashcardDecks: [],
      flashcards: [],
      quizzes: [],
      quizAttempts: [],
      recordings: [],
      tutorSessions: [],
      homeworkSolutions: [],
      calendarEvents: [],
      studySessions: [],
      sidebarOpen: true,

      setProfile: (p) => set({ profile: p }),
      toggleDarkMode: () => {
        const next = !get().darkMode;
        document.documentElement.classList.toggle("dark", next);
        set({ darkMode: next });
      },
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      addSubject: (name, icon, color) => {
        const s: Subject = { id: uid(), name, icon, color, noteCount: 0, flashcardCount: 0, quizCount: 0, mastery: 0 };
        set((st) => ({ subjects: [...st.subjects, s] }));
        return s;
      },

      addNote: (note) => {
        const n: Note = { ...note, id: uid(), createdAt: Date.now(), updatedAt: Date.now() };
        set((st) => ({ notes: [n, ...st.notes] }));
        return n;
      },
      updateNote: (id, updates) =>
        set((st) => ({ notes: st.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n)) })),
      deleteNote: (id) => set((st) => ({ notes: st.notes.filter((n) => n.id !== id) })),

      addFlashcardDeck: (deck) => {
        const d: FlashcardDeck = { ...deck, id: uid(), createdAt: Date.now(), cardCount: 0, dueCount: 0, mastery: 0 };
        set((st) => ({ flashcardDecks: [...st.flashcardDecks, d] }));
        return d;
      },
      addFlashcard: (card) => {
        const c: Flashcard = {
          ...card, id: uid(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, reviews: 0, correct: 0,
        };
        set((st) => ({
          flashcards: [...st.flashcards, c],
          flashcardDecks: st.flashcardDecks.map((d) =>
            d.id === card.deckId ? { ...d, cardCount: d.cardCount + 1, dueCount: d.dueCount + 1 } : d
          ),
        }));
        return c;
      },
      updateFlashcard: (id, updates) =>
        set((st) => ({ flashcards: st.flashcards.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
      deleteFlashcard: (id) => {
        const card = get().flashcards.find((c) => c.id === id);
        set((st) => ({
          flashcards: st.flashcards.filter((c) => c.id !== id),
          flashcardDecks: card
            ? st.flashcardDecks.map((d) => (d.id === card.deckId ? { ...d, cardCount: Math.max(0, d.cardCount - 1) } : d))
            : st.flashcardDecks,
        }));
      },

      addQuiz: (quiz) => {
        const q: Quiz = { ...quiz, id: uid(), createdAt: Date.now(), attempts: [] };
        set((st) => ({ quizzes: [q, ...st.quizzes] }));
        return q;
      },
      addQuizAttempt: (attempt) => {
        const a: QuizAttempt = { ...attempt, id: uid(), completedAt: Date.now() };
        set((st) => ({
          quizAttempts: [a, ...st.quizAttempts],
          quizzes: st.quizzes.map((q) => (q.id === attempt.quizId ? { ...q, attempts: [...q.attempts, a] } : q)),
        }));
        return a;
      },

      addTutorSession: (session) => {
        const s: TutorSession = { ...session, id: uid(), createdAt: Date.now() };
        set((st) => ({ tutorSessions: [s, ...st.tutorSessions] }));
        return s;
      },
      addTutorMessage: (sessionId, msg) => {
        const m: ChatMessage = { ...msg, id: uid(), timestamp: Date.now() };
        set((st) => ({
          tutorSessions: st.tutorSessions.map((s) =>
            s.id === sessionId ? { ...s, messages: [...s.messages, m] } : s
          ),
        }));
      },

      addHomeworkSolution: (sol) => {
        const s: HomeworkSolution = { ...sol, id: uid(), createdAt: Date.now() };
        set((st) => ({ homeworkSolutions: [s, ...st.homeworkSolutions] }));
        return s;
      },

      addCalendarEvent: (event) => {
        const e: CalendarEvent = { ...event, id: uid() };
        set((st) => ({ calendarEvents: [...st.calendarEvents, e] }));
        return e;
      },
      updateCalendarEvent: (id, updates) =>
        set((st) => ({ calendarEvents: st.calendarEvents.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),
      deleteCalendarEvent: (id) => set((st) => ({ calendarEvents: st.calendarEvents.filter((e) => e.id !== id) })),

      addStudySession: (session) => {
        const s: StudySession = { ...session, id: uid() };
        set((st) => ({ studySessions: [...st.studySessions, s] }));
        return s;
      },
    }),
    { name: "studyverse-storage" }
  )
);
