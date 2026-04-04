// 퀴즈 문제 타입
export interface MultipleChoiceQuestion {
  id: number
  type: 'multiple_choice'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  choices: [string, string, string, string]
  answer: string
  explanation: string
  quizId?: string  // buildQuestions에서 런타임에 태깅
}

export interface ShortAnswerQuestion {
  id: number
  type: 'short_answer'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  answer: string | string[]  // 복수 정답 허용 (배열)
  explanation: string
  quizId?: string  // buildQuestions에서 런타임에 태깅
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

// 실전 모의고사 메타데이터
export interface MockExam {
  id: string
  title: string
  description: string
  file: string
  questionCount: number
}

// 퀴즈 설정
export interface QuizSettings {
  questionCount: number | 'all'
  difficulty: 'easy' | 'medium' | 'hard' | 'all'
  shuffle: boolean
}

// 채점 결과
export interface ScoredAnswer {
  answer: string
  isCorrect: boolean
}

// 퀴즈 스토어 상태
export interface QuizStore {
  selectedCategories: string[]
  questionCount: number | 'all'
  difficulty: 'easy' | 'medium' | 'hard' | 'all'
  shuffle: boolean
  questions: Question[]
  currentIndex: number
  selectedAnswers: Record<number, string>        // 선택/입력한 답변 (채점 전 임시)
  scoredAnswers: Record<number, ScoredAnswer>    // 채점 완료된 답변
  checkedIds: number[]                           // 정답 확인 완료된 문제 id
  skippedIds: number[]                           // 건너뛴 문제 id
  startedAt: string | null
  mockExamId: string | null                      // 모의고사 ID (null = 카테고리 퀴즈 모드)
  mockExamTitle: string | null                   // 모의고사 타이틀 표시용
  quizSessionId: string | null                   // DB 세션 ID (문제별 즉시 저장용)

  setCategories: (ids: string[]) => void
  setSettings: (settings: Partial<QuizSettings>) => void
  startQuiz: (questions: Question[]) => void
  startMockExam: (exam: MockExam, questions: Question[]) => void  // 모의고사 시작 (설정 없이)
  selectAnswer: (questionId: number, answer: string) => void  // 답변 선택만 (채점 X)
  checkAnswer: (questionId: number) => void                   // 정답 확인 (채점 실행)
  checkAllAnswers: () => void                                  // 모의고사 종료 시 일괄 채점
  clearAnswer: (questionId: number) => void                   // 채점 초기화 (수정 시)
  skipQuestion: (questionId: number) => void
  goToQuestion: (index: number) => void
  resetQuiz: () => void
  setQuizSessionId: (id: string | null) => void              // DB 세션 ID 설정
}

// 오답노트
export interface WrongNote {
  id: number
  quizId: string
  addedAt: string
}

// DB 관련 타입
export interface SaveQuizSessionPayload {
  userId: string
  categories: string[]
  selectedTypes: string[]
  totalQuestions: number
  correctCount: number
  scorePercent: number
  startedAt: string
  settings: { difficulty: string; shuffle: boolean }
  answers: SaveAnswerPayload[]
  pretest?: boolean
}

export interface SaveAnswerPayload {
  questionId: number
  quizId: string
  questionType: string
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
