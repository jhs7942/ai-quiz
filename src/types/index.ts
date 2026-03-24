// 퀴즈 문제 타입
export interface MultipleChoiceQuestion {
  id: number
  type: 'multiple_choice'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  choices: [string, string, string, string]
  answer: string
  explanation: string
}

export interface ShortAnswerQuestion {
  id: number
  type: 'short_answer'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  answer: string
  explanation: string
}

export type Question = MultipleChoiceQuestion | ShortAnswerQuestion

// 카테고리 메타데이터
export interface QuizCategory {
  id: string
  title: string
  description: string
  icon: string
  file: string
  questionCount: number
}

// 퀴즈 설정
export interface QuizSettings {
  questionCount: number | 'all'
  difficulty: 'easy' | 'medium' | 'hard' | 'all'
  shuffle: boolean
}

// 퀴즈 스토어 상태
export interface QuizStore {
  selectedCategories: string[]
  questionCount: number | 'all'
  difficulty: 'easy' | 'medium' | 'hard' | 'all'
  shuffle: boolean
  questions: Question[]
  currentIndex: number
  answers: Record<number, string>
  answeredIds: number[]
  skippedIds: number[]
  startedAt: string | null

  setCategories: (ids: string[]) => void
  setSettings: (settings: Partial<QuizSettings>) => void
  startQuiz: (questions: Question[]) => void
  submitAnswer: (questionId: number, answer: string) => void
  skipQuestion: (questionId: number) => void
  goToQuestion: (index: number) => void
  resetQuiz: () => void
}

// DB 관련 타입
export interface UpsertUserPayload {
  sessionId: string
  userAgent: string
}

export interface SaveQuizSessionPayload {
  userId: string
  categories: string[]
  totalQuestions: number
  correctCount: number
  scorePercent: number
  startedAt: string
  settings: { difficulty: string; shuffle: boolean }
  answers: SaveAnswerPayload[]
}

export interface SaveAnswerPayload {
  questionId: number
  quizId: string
  userAnswer: string
  isCorrect: boolean
}

export interface SaveFeedbackPayload {
  userId: string
  quizId: string
  questionId: number
  reportType: string
  description: string
  suggestedAnswer?: string
}
