import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type {
  User, UserPreferences, Subject, Project, Document, Recording, Note,
  FlashcardDeck, Flashcard, Test, TestAttempt, Podcast, Conversation,
  ChatMessage, StudySession, CalendarEvent, StudyGuide,
  LearningStats
} from "../types";

interface AppState {
  user: User | null;
  theme: "light" | "dark" | "system";
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeSubjectId: string | null;
  activeView: string;

  subjects: Subject[];
  projects: Project[];
  documents: Document[];
  recordings: Recording[];
  notes: Note[];
  flashcardDecks: FlashcardDeck[];
  tests: Test[];
  testAttempts: TestAttempt[];
  podcasts: Podcast[];
  conversations: Conversation[];
  studySessions: StudySession[];
  calendarEvents: CalendarEvent[];
  studyGuides: StudyGuide[];

  // Audio player
  audioPlaying: boolean;
  audioCurrentId: string | null;
  audioCurrentTime: number;
  audioPlaybackRate: number;

  // Actions
  setTheme: (t: "light" | "dark" | "system") => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveSubject: (id: string | null) => void;
  setActiveView: (view: string) => void;

  createUser: (name: string, email: string) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;

  addSubject: (name: string, icon: string, color: string, description?: string) => Subject;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  addProject: (subjectId: string, name: string, description?: string) => Project;

  addDocument: (doc: Omit<Document, "id" | "createdAt" | "updatedAt" | "processed">) => Document;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;

  addRecording: (rec: Omit<Recording, "id" | "createdAt" | "bookmarks">) => Recording;
  updateRecording: (id: string, updates: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;

  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt" | "version">) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  addFlashcardDeck: (deck: Omit<FlashcardDeck, "id" | "createdAt" | "updatedAt" | "cards">) => FlashcardDeck;
  updateFlashcardDeck: (id: string, updates: Partial<FlashcardDeck>) => void;
  addFlashcard: (deckId: string, card: Omit<Flashcard, "id" | "difficulty" | "interval" | "nextReview" | "reviews" | "correct" | "streak">) => void;
  reviewFlashcard: (deckId: string, cardId: string, rating: "again" | "hard" | "good" | "easy") => void;
  deleteFlashcardDeck: (id: string) => void;

  addTest: (test: Omit<Test, "id" | "createdAt" | "updatedAt">) => Test;
  updateTest: (id: string, updates: Partial<Test>) => void;
  deleteTest: (id: string) => void;
  addTestAttempt: (attempt: Omit<TestAttempt, "id">) => TestAttempt;

  addPodcast: (podcast: Omit<Podcast, "id" | "createdAt">) => Podcast;
  updatePodcast: (id: string, updates: Partial<Podcast>) => void;

  addConversation: (conv: Omit<Conversation, "id" | "createdAt" | "updatedAt" | "messages" | "pinned" | "archived">) => Conversation;
  addMessage: (convId: string, msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  deleteConversation: (id: string) => void;
  togglePinConversation: (id: string) => void;

  addStudySession: (session: Omit<StudySession, "id">) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, "id">) => CalendarEvent;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  addStudyGuide: (guide: Omit<StudyGuide, "id" | "createdAt">) => StudyGuide;
  deleteStudyGuide: (id: string) => void;

  setAudioPlaying: (playing: boolean) => void;
  setAudioCurrent: (id: string | null) => void;
  setAudioTime: (time: number) => void;
  setAudioRate: (rate: number) => void;

  getLearningStats: () => LearningStats;
  getSubjectStats: (subjectId: string) => {
    documents: number; notes: number; flashcards: number; tests: number; studyTime: number;
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      theme: "system",
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeSubjectId: null,
      activeView: "home",

      subjects: [],
      projects: [],
      documents: [],
      recordings: [],
      notes: [],
      flashcardDecks: [],
      tests: [],
      testAttempts: [],
      podcasts: [],
      conversations: [],
      studySessions: [],
      calendarEvents: [],
      studyGuides: [],

      audioPlaying: false,
      audioCurrentId: null,
      audioCurrentTime: 0,
      audioPlaybackRate: 1,

      setTheme: (theme) => {
        set({ theme });
        const root = document.documentElement;
        root.removeAttribute("data-theme");
        root.classList.remove("dark");
        if (theme === "dark") {
          root.setAttribute("data-theme", "dark");
          root.classList.add("dark");
        } else if (theme === "light") {
          root.setAttribute("data-theme", "light");
        }
      },
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setActiveSubject: (activeSubjectId) => set({ activeSubjectId }),
      setActiveView: (activeView) => set({ activeView }),

      createUser: (name, email) => set({
        user: {
          id: uuid(), name, email, createdAt: Date.now(),
          preferences: {
            theme: "system", accentColor: "#D4782F", fontSize: "medium",
            aiDifficulty: "intermediate", preferredExplanationStyle: "detailed",
            reducedMotion: false, dyslexiaFont: false,
          },
        },
      }),
      updatePreferences: (prefs) => set((s) =>
        s.user ? { user: { ...s.user, preferences: { ...s.user.preferences, ...prefs } } } : s
      ),

      addSubject: (name, icon, color, description) => {
        const subject: Subject = { id: uuid(), name, icon, color, description, createdAt: Date.now(), updatedAt: Date.now() };
        set((s) => ({ subjects: [...s.subjects, subject] }));
        return subject;
      },
      updateSubject: (id, updates) => set((s) => ({
        subjects: s.subjects.map((sub) => sub.id === id ? { ...sub, ...updates, updatedAt: Date.now() } : sub),
      })),
      deleteSubject: (id) => set((s) => ({ subjects: s.subjects.filter((sub) => sub.id !== id) })),

      addProject: (subjectId, name, description) => {
        const project: Project = { id: uuid(), subjectId, name, description, createdAt: Date.now(), updatedAt: Date.now() };
        set((s) => ({ projects: [...s.projects, project] }));
        return project;
      },

      addDocument: (doc) => {
        const document: Document = { ...doc, id: uuid(), createdAt: Date.now(), updatedAt: Date.now(), processed: false };
        set((s) => ({ documents: [...s.documents, document] }));
        return document;
      },
      updateDocument: (id, updates) => set((s) => ({
        documents: s.documents.map((d) => d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d),
      })),
      deleteDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

      addRecording: (rec) => {
        const recording: Recording = { ...rec, id: uuid(), createdAt: Date.now(), bookmarks: [] };
        set((s) => ({ recordings: [...s.recordings, recording] }));
        return recording;
      },
      updateRecording: (id, updates) => set((s) => ({
        recordings: s.recordings.map((r) => r.id === id ? { ...r, ...updates } : r),
      })),
      deleteRecording: (id) => set((s) => ({ recordings: s.recordings.filter((r) => r.id !== id) })),

      addNote: (note) => {
        const n: Note = { ...note, id: uuid(), createdAt: Date.now(), updatedAt: Date.now(), version: 1 };
        set((s) => ({ notes: [...s.notes, n] }));
        return n;
      },
      updateNote: (id, updates) => set((s) => ({
        notes: s.notes.map((n) => n.id === id ? { ...n, ...updates, updatedAt: Date.now(), version: n.version + 1 } : n),
      })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      addFlashcardDeck: (deck) => {
        const d: FlashcardDeck = { ...deck, id: uuid(), createdAt: Date.now(), updatedAt: Date.now(), cards: [] };
        set((s) => ({ flashcardDecks: [...s.flashcardDecks, d] }));
        return d;
      },
      updateFlashcardDeck: (id, updates) => set((s) => ({
        flashcardDecks: s.flashcardDecks.map((d) => d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d),
      })),
      addFlashcard: (deckId, card) => set((s) => ({
        flashcardDecks: s.flashcardDecks.map((d) =>
          d.id === deckId
            ? {
                ...d,
                cards: [
                  ...d.cards,
                  { ...card, id: uuid(), difficulty: 0.3, interval: 0, nextReview: Date.now(), reviews: 0, correct: 0, streak: 0 },
                ],
                updatedAt: Date.now(),
              }
            : d
        ),
      })),
      reviewFlashcard: (deckId, cardId, rating) => set((s) => ({
        flashcardDecks: s.flashcardDecks.map((d) => {
          if (d.id !== deckId) return d;
          return {
            ...d,
            lastStudied: Date.now(),
            cards: d.cards.map((c) => {
              if (c.id !== cardId) return c;
              const multiplier = { again: 0.2, hard: 0.8, good: 1.5, easy: 2.5 }[rating];
              const isCorrect = rating !== "again";
              const newStreak = isCorrect ? c.streak + 1 : 0;
              const newInterval = Math.max(1, Math.round((c.interval || 1) * multiplier));
              const msPerDay = 86_400_000;
              return {
                ...c,
                interval: newInterval,
                nextReview: Date.now() + newInterval * msPerDay,
                lastReview: Date.now(),
                reviews: c.reviews + 1,
                correct: isCorrect ? c.correct + 1 : c.correct,
                streak: newStreak,
                difficulty: Math.max(0, Math.min(1, c.difficulty + (isCorrect ? -0.05 : 0.1))),
              };
            }),
          };
        }),
      })),
      deleteFlashcardDeck: (id) => set((s) => ({
        flashcardDecks: s.flashcardDecks.filter((d) => d.id !== id),
      })),

      addTest: (test) => {
        const t: Test = { ...test, id: uuid(), createdAt: Date.now(), updatedAt: Date.now() };
        set((s) => ({ tests: [...s.tests, t] }));
        return t;
      },
      updateTest: (id, updates) => set((s) => ({
        tests: s.tests.map((t) => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t),
      })),
      deleteTest: (id) => set((s) => ({ tests: s.tests.filter((t) => t.id !== id) })),
      addTestAttempt: (attempt) => {
        const a: TestAttempt = { ...attempt, id: uuid() };
        set((s) => ({ testAttempts: [...s.testAttempts, a] }));
        return a;
      },

      addPodcast: (podcast) => {
        const p: Podcast = { ...podcast, id: uuid(), createdAt: Date.now() };
        set((s) => ({ podcasts: [...s.podcasts, p] }));
        return p;
      },
      updatePodcast: (id, updates) => set((s) => ({
        podcasts: s.podcasts.map((p) => p.id === id ? { ...p, ...updates } : p),
      })),

      addConversation: (conv) => {
        const c: Conversation = { ...conv, id: uuid(), createdAt: Date.now(), updatedAt: Date.now(), messages: [], pinned: false, archived: false };
        set((s) => ({ conversations: [...s.conversations, c] }));
        return c;
      },
      addMessage: (convId, msg) => set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId
            ? { ...c, messages: [...c.messages, { ...msg, id: uuid(), timestamp: Date.now() }], updatedAt: Date.now() }
            : c
        ),
      })),
      deleteConversation: (id) => set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
      })),
      togglePinConversation: (id) => set((s) => ({
        conversations: s.conversations.map((c) => c.id === id ? { ...c, pinned: !c.pinned } : c),
      })),

      addStudySession: (session) => set((s) => ({
        studySessions: [...s.studySessions, { ...session, id: uuid() }],
      })),

      addCalendarEvent: (event) => {
        const e: CalendarEvent = { ...event, id: uuid() };
        set((s) => ({ calendarEvents: [...s.calendarEvents, e] }));
        return e;
      },
      updateCalendarEvent: (id, updates) => set((s) => ({
        calendarEvents: s.calendarEvents.map((e) => e.id === id ? { ...e, ...updates } : e),
      })),
      deleteCalendarEvent: (id) => set((s) => ({
        calendarEvents: s.calendarEvents.filter((e) => e.id !== id),
      })),

      addStudyGuide: (guide) => {
        const g: StudyGuide = { ...guide, id: uuid(), createdAt: Date.now() };
        set((s) => ({ studyGuides: [...s.studyGuides, g] }));
        return g;
      },
      deleteStudyGuide: (id) => set((s) => ({
        studyGuides: s.studyGuides.filter((g) => g.id !== id),
      })),

      setAudioPlaying: (audioPlaying) => set({ audioPlaying }),
      setAudioCurrent: (audioCurrentId) => set({ audioCurrentId }),
      setAudioTime: (audioCurrentTime) => set({ audioCurrentTime }),
      setAudioRate: (audioPlaybackRate) => set({ audioPlaybackRate }),

      getLearningStats: () => {
        const s = get();
        const totalStudyTime = s.studySessions.reduce((sum, ss) => sum + ss.duration, 0);
        const questionsCompleted = s.testAttempts.reduce(
          (sum, a) => sum + a.questionResults.length, 0
        );
        const scores = s.testAttempts.filter((a) => a.graded).map((a) => a.percentage);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const flashcardsReviewed = s.flashcardDecks.reduce(
          (sum, d) => sum + d.cards.reduce((cs, c) => cs + c.reviews, 0), 0
        );

        const now = Date.now();
        const msPerDay = 86_400_000;
        const weeklyConsistency = Array.from({ length: 7 }, (_, i) => {
          const dayStart = now - (6 - i) * msPerDay;
          const dayEnd = dayStart + msPerDay;
          return s.studySessions.filter((ss) => ss.startedAt >= dayStart && ss.startedAt < dayEnd).length > 0 ? 1 : 0;
        });
        const streakDays = (weeklyConsistency as number[]).reduceRight((streak, day) => day ? streak + 1 : 0, 0);

        return {
          totalStudyTime,
          questionsCompleted,
          averageScore,
          flashcardsReviewed,
          topicsMastered: [],
          topicsNeedWork: [],
          weeklyConsistency,
          streakDays,
          lastStudiedAt: s.studySessions.length > 0 ? s.studySessions[s.studySessions.length - 1].startedAt : undefined,
        };
      },

      getSubjectStats: (subjectId) => {
        const s = get();
        return {
          documents: s.documents.filter((d) => d.subjectId === subjectId).length,
          notes: s.notes.filter((n) => n.subjectId === subjectId).length,
          flashcards: s.flashcardDecks.filter((d) => d.subjectId === subjectId).reduce((sum, d) => sum + d.cards.length, 0),
          tests: s.tests.filter((t) => t.subjectId === subjectId).length,
          studyTime: s.studySessions.filter((ss) => ss.subjectId === subjectId).reduce((sum, ss) => sum + ss.duration, 0),
        };
      },
    }),
    {
      name: "lucent-app-v1",
      partialize: (state) => {
        const { audioPlaying, audioCurrentTime, ...rest } = state;
        return rest;
      },
    }
  )
);
