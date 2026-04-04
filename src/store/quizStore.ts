import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { MockExam, Question, QuizSettings, QuizStore } from '../types'
import { useWrongNoteStore } from './wrongNoteStore'

export function gradeAnswer(question: Question, userAnswer: string): boolean {
  if (question.type === 'multiple_choice') {
    return userAnswer === question.answer
  }
  const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase()
  const expandAnswer = (s: string): string[] => {
    const variants = [normalize(s)]
    const match = s.match(/^(.+?)\((.+?)\)$/)
    if (match) {
      variants.push(normalize(match[1]))
      variants.push(normalize(match[2]))
    }
    return variants
  }
  const normalized = normalize(userAnswer)
  const ans = question.answer
  const candidates = Array.isArray(ans) ? ans.flatMap(expandAnswer) : expandAnswer(ans)
  return candidates.includes(normalized)
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      selectedCategories: [],
      questionCount: 10,
      difficulty: 'all',
      shuffle: false,
      questions: [],
      currentIndex: 0,
      selectedAnswers: {},
      scoredAnswers: {},
      checkedIds: [],
      skippedIds: [],
      startedAt: null,
      mockExamId: null,
      mockExamTitle: null,
      quizSessionId: null,

      setCategories: (ids) => set({ selectedCategories: ids }),

      setSettings: (settings: Partial<QuizSettings>) =>
        set((state) => ({
          questionCount: settings.questionCount ?? state.questionCount,
          difficulty: settings.difficulty ?? state.difficulty,
          shuffle: settings.shuffle ?? state.shuffle,
        })),

      setQuizSessionId: (id) => set({ quizSessionId: id }),

      startQuiz: (questions: Question[]) =>
        set({
          questions,
          currentIndex: 0,
          selectedAnswers: {},
          scoredAnswers: {},
          checkedIds: [],
          skippedIds: [],
          startedAt: new Date().toISOString(),
          mockExamId: null,
          mockExamTitle: null,
          quizSessionId: null,
        }),

      startMockExam: (exam: MockExam, questions: Question[]) =>
        set({
          questions,
          currentIndex: 0,
          selectedAnswers: {},
          scoredAnswers: {},
          checkedIds: [],
          skippedIds: [],
          startedAt: new Date().toISOString(),
          mockExamId: exam.id,
          mockExamTitle: exam.title,
          quizSessionId: null,
        }),

      // 답변 선택만 (채점 X) — 선택 변경 시 기존 채점 결과 초기화
      selectAnswer: (questionId, answer) =>
        set((state) => {
          const { [questionId]: _s, ...restScored } = state.scoredAnswers
          return {
            selectedAnswers: { ...state.selectedAnswers, [questionId]: answer },
            scoredAnswers: restScored,
            checkedIds: state.checkedIds.filter((id) => id !== questionId),
          }
        }),

      // 정답 확인 (채점 실행)
      checkAnswer: (questionId) => {
        const { questions, selectedAnswers } = get()
        const question = questions.find((q) => q.id === questionId)
        const userAnswer = selectedAnswers[questionId]
        if (!question || !userAnswer) return

        const isCorrect = gradeAnswer(question, userAnswer)

        if (!isCorrect) {
          useWrongNoteStore.getState().addWrongNote(questionId, question.quizId ?? '')
        }

        set((state) => ({
          scoredAnswers: {
            ...state.scoredAnswers,
            [questionId]: { answer: userAnswer, isCorrect },
          },
          checkedIds: state.checkedIds.includes(questionId)
            ? state.checkedIds
            : [...state.checkedIds, questionId],
          skippedIds: state.skippedIds.filter((id) => id !== questionId),
        }))
      },

      // 채점 초기화 (이전 문제로 돌아가 답변 수정 시)
      clearAnswer: (questionId) =>
        set((state) => {
          const { [questionId]: _s, ...restScored } = state.scoredAnswers
          return {
            scoredAnswers: restScored,
            checkedIds: state.checkedIds.filter((id) => id !== questionId),
          }
        }),

      // 모의고사 종료 시 전체 일괄 채점
      checkAllAnswers: () => {
        const { questions, selectedAnswers } = get()
        const newScoredAnswers: Record<number, { answer: string; isCorrect: boolean }> = {}
        const newCheckedIds: number[] = []

        for (const question of questions) {
          const userAnswer = selectedAnswers[question.id]
          if (!userAnswer) continue

          const isCorrect = gradeAnswer(question, userAnswer)

          if (!isCorrect) {
            useWrongNoteStore.getState().addWrongNote(question.id, question.quizId ?? '')
          }

          newScoredAnswers[question.id] = { answer: userAnswer, isCorrect }
          newCheckedIds.push(question.id)
        }

        set((state) => ({
          scoredAnswers: { ...state.scoredAnswers, ...newScoredAnswers },
          checkedIds: [...new Set([...state.checkedIds, ...newCheckedIds])],
        }))
      },

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
          selectedAnswers: {},
          scoredAnswers: {},
          checkedIds: [],
          skippedIds: [],
          startedAt: null,
          mockExamId: null,
          mockExamTitle: null,
          quizSessionId: null,
        }),
    }),
    {
      name: 'ai-quiz-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
