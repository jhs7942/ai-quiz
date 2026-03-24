import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Question, QuizSettings, QuizStore } from '../types'

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      selectedCategories: [],
      questionCount: 10,
      difficulty: 'all',
      shuffle: false,
      questions: [],
      currentIndex: 0,
      answers: {},
      answeredIds: [],
      skippedIds: [],
      startedAt: null,

      setCategories: (ids) => set({ selectedCategories: ids }),

      setSettings: (settings: Partial<QuizSettings>) =>
        set((state) => ({
          questionCount: settings.questionCount ?? state.questionCount,
          difficulty: settings.difficulty ?? state.difficulty,
          shuffle: settings.shuffle ?? state.shuffle,
        })),

      startQuiz: (questions: Question[]) =>
        set({
          questions,
          currentIndex: 0,
          answers: {},
          answeredIds: [],
          skippedIds: [],
          startedAt: new Date().toISOString(),
        }),

      submitAnswer: (questionId, answer) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: answer },
          answeredIds: state.answeredIds.includes(questionId)
            ? state.answeredIds
            : [...state.answeredIds, questionId],
          skippedIds: state.skippedIds.filter((id) => id !== questionId),
        })),

      skipQuestion: (questionId) =>
        set((state) => ({
          skippedIds: state.skippedIds.includes(questionId)
            ? state.skippedIds
            : [...state.skippedIds, questionId],
          currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
        })),

      goToQuestion: (index) => set({ currentIndex: index }),

      resetQuiz: () =>
        set({
          selectedCategories: [],
          questionCount: 10,
          difficulty: 'all',
          shuffle: false,
          questions: [],
          currentIndex: 0,
          answers: {},
          answeredIds: [],
          skippedIds: [],
          startedAt: null,
        }),
    }),
    {
      name: 'ai-quiz-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
