import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WrongNote } from '../types'

interface WrongNoteStore {
  wrongNotes: WrongNote[]
  addWrongNote: (id: number, quizId: string) => void
  removeWrongNote: (id: number) => void
  clearWrongNotes: () => void
}

export const useWrongNoteStore = create<WrongNoteStore>()(
  persist(
    (set, get) => ({
      wrongNotes: [],

      addWrongNote: (id, quizId) => {
        const already = get().wrongNotes.some((n) => n.id === id && n.quizId === quizId)
        if (already) return
        set((state) => ({
          wrongNotes: [...state.wrongNotes, { id, quizId, addedAt: new Date().toISOString() }],
        }))
      },

      removeWrongNote: (id) =>
        set((state) => ({
          wrongNotes: state.wrongNotes.filter((n) => n.id !== id),
        })),

      clearWrongNotes: () => set({ wrongNotes: [] }),
    }),
    {
      name: 'ai-quiz-wrong-notes',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
