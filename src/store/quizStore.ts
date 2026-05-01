import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { MockExam, Question, QuizSettings, QuizStore } from '../types'
import { useWrongNoteStore } from './wrongNoteStore'

// [학습] gradeAnswer를 store 밖에 export한 이유 — store action 안에서뿐 아니라
// QuizPage에서 "DB 저장 시 채점 결과를 함께 보내야" 할 때도 같은 로직을 호출하기 위함.
// 채점 규칙이 두 곳에 흩어져 있으면 한쪽만 고쳤을 때 일치가 깨진다.
export function gradeAnswer(question: Question, userAnswer: string): boolean {
  if (question.type === 'multiple_choice') {
    return userAnswer === question.answer
  }
  // [학습] 주관식 채점 규칙: 공백·대소문자를 모두 무시하고("hello world" === "HelloWorld"),
  // "대한민국(韓國)" 형식이면 괄호 밖/안 둘 다 정답으로 인정한다.
  // answer가 string일 수도, string[]일 수도 있어 Array.isArray로 분기 — 데이터 스키마가 두 형태를 허용함.
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

// [학습] create<QuizStore>()(persist(...)) 의 빈 ()()는 오타가 아니라 Zustand의 "curry" 패턴.
// TS 제네릭(<QuizStore>)을 명시적으로 주면서도 미들웨어(persist)의 타입 추론을 살리기 위해 두 번 호출한다.
// persist 미들웨어로 감싸면 store 상태가 자동으로 storage에 직렬화되어, 새로고침해도 진행상태가 유지된다.
export const useQuizStore = create<QuizStore>()(
  persist(
    // [학습] (set, get) => ({...}) — set은 상태 변경 함수, get은 "현재 상태 읽기" 함수.
    // action 내부에서 다른 상태값을 참고해 결정해야 할 때 get()을 쓴다 (예: checkAnswer가 questions를 참조).
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

      // [학습] set((state) => ({...})) — "함수형 업데이트". state 인자는 호출 시점의 최신 상태.
      // set({...})로 객체를 직접 넘기면 클로저가 캡처한 옛 상태에 의존할 수 있어, 연속 호출 시 race가 발생할 수 있다.
      // 이전 상태를 참조해 다음 상태를 만들어야 할 때는 항상 함수형 형태를 쓴다.
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
      // [학습] { [questionId]: _s, ...restScored } — 객체에서 "특정 키만 빼고 나머지"를 얻는 패턴.
      //   _s 는 "사용하지 않을 변수"라는 관례(언더스코어 prefix). 불변성(immutability)을 지키며
      //   키 1개만 제거하는 가장 짧은 표현이다.
      //   참고: 이 프로젝트의 ESLint는 _ prefix 예외 설정(argsIgnorePattern: '^_')이 없어서
      //   "_s is assigned a value but never used" 경고가 그대로 떨어진다 — 학습용으로 그냥 둔다.
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
          // [학습] useWrongNoteStore.getState() — React 컴포넌트 안이 아닌 "다른 store의 action 안에서"
          // 또 다른 store에 접근하는 패턴. 훅처럼 useWrongNoteStore() 호출하면 React 외부에선 에러난다.
          // getState()는 hook이 아닌 일반 함수라 어디서든 안전하게 호출 가능.
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
      // [학습] persist 옵션. name은 storage의 key, storage는 어디에 저장할지를 정한다.
      // sessionStorage를 쓴 이유 — 탭을 닫으면 진행상태가 초기화되기를 원하기 때문.
      // localStorage였다면 "영원히 남는 진행상태" 때문에 사용자가 새 퀴즈를 시작해도 이전 상태가 살아있는 버그가 생긴다.
      name: 'ai-quiz-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
