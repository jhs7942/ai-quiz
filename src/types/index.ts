// [학습] 도메인 타입을 한 파일에 모아두면 "이 앱이 다루는 데이터의 모양" 을 한 눈에 본다.
//        파일이 커지면 도메인별로 쪼갠다 (예: types/quiz.ts, types/db.ts). 지금은 한 파일이 충분.

// 퀴즈 문제 타입
// [학습] interface vs type — 객체 모양은 보통 interface(병합·확장 용이), 유니온/튜플/원시 별칭은 type 으로 쓰는 게 관행.
export interface MultipleChoiceQuestion {
  id: number
  // [학습] type: 'multiple_choice' 처럼 **리터럴 문자열**을 필드 타입으로 쓰면, 이 필드가 "discriminator(판별자)" 역할을 한다.
  //        아래 Question 유니온에서 q.type 만 보고도 TS 가 어느 인터페이스인지 좁힌다 (narrowing).
  type: 'multiple_choice'
  // [학습] 'easy' | 'medium' | 'hard' 같은 **리터럴 유니온**은 enum 대안. 직렬화·비교가 간단하고 번들에 추가 코드가 안 들어간다.
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  // [학습] 튜플 타입 [string, string, string, string] — "정확히 4개의 문자열" 을 강제. string[] 보다 정밀.
  choices: [string, string, string, string]
  answer: string
  explanation: string
  // [학습] quizId?: string — ? 는 optional(없을 수도 있음). 빌드 단계에서 런타임에 채워지므로 원본 JSON 에는 없을 수 있다.
  quizId?: string  // buildQuestions에서 런타임에 태깅
}

export interface ShortAnswerQuestion {
  id: number
  type: 'short_answer'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  // [학습] string | string[] — 단일 정답 또는 복수 정답을 모두 허용하기 위한 유니온.
  //        이 때문에 채점 로직(quizStore.gradeAnswer)이 Array.isArray 분기를 가진다 — 타입과 코드가 짝을 이룬다.
  answer: string | string[]  // 복수 정답 허용 (배열)
  explanation: string
  quizId?: string  // buildQuestions에서 런타임에 태깅
}

// [학습] discriminated union (구분된 유니온) — 두 인터페이스를 type 필드로 묶는다.
//        함수에서 if (q.type === 'multiple_choice') 로 좁히면 그 블록 안에서 q 가 자동으로 MultipleChoiceQuestion 으로 추론된다.
//        타입가드를 따로 안 짜도 되는 TS 의 강력한 패턴.
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
// [학습] number | 'all' — "숫자 또는 'all' 문자열". 'all' 같은 sentinel(센티넬) 값을 타입에 박으면 매직스트링 오타를 컴파일러가 잡는다.
//        ('al' 같은 오타는 즉시 에러)
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
// [학습] 이 인터페이스는 quizStore.ts 의 create<QuizStore>() 에 제네릭으로 들어간다.
//        "스토어가 가져야 할 상태(state) + 함수(action)" 를 모두 한 인터페이스에 적는 것이 Zustand 의 컨벤션.
//        상태와 액션이 같은 객체에 살기 때문에 파일이 늘어도 store.ts 한 곳에서만 보면 된다.
export interface QuizStore {
  selectedCategories: string[]
  questionCount: number | 'all'
  difficulty: 'easy' | 'medium' | 'hard' | 'all'
  shuffle: boolean
  questions: Question[]
  currentIndex: number
  // [학습] Record<K, V> — { [key: K]: V } 의 더 짧은 표기. K 가 number 라도 JS 객체 key 는 자동 string 변환되지만,
  //        TS 차원에서 "id(number)로 답변을 조회한다" 는 의도를 표시하는 효과가 있다.
  selectedAnswers: Record<number, string>        // 선택/입력한 답변 (채점 전 임시)
  scoredAnswers: Record<number, ScoredAnswer>    // 채점 완료된 답변
  checkedIds: number[]                           // 정답 확인 완료된 문제 id
  skippedIds: number[]                           // 건너뛴 문제 id
  // [학습] string | null — "값이 있을 수도, 없을 수도". optional(?:)과 다르다.
  //        ?: 는 "키 자체가 없어도 됨", | null 은 "키는 항상 있고 값이 null 일 수 있음".
  //        store 상태처럼 항상 존재해야 하는 자리에는 | null 이 더 정확하다.
  startedAt: string | null
  mockExamId: string | null                      // 모의고사 ID (null = 카테고리 퀴즈 모드)
  mockExamTitle: string | null                   // 모의고사 타이틀 표시용
  quizSessionId: string | null                   // DB 세션 ID (문제별 즉시 저장용)

  // [학습] 함수 시그니처도 인터페이스 멤버로 적는다. (ids: string[]) => void 는 "string 배열 받아 반환 없음".
  //        구현은 store 파일에서, 시그니처는 여기서 — 사용자(QuizPage 등)가 store 형태를 빠르게 파악할 수 있다.
  setCategories: (ids: string[]) => void
  // [학습] Partial<QuizSettings> — QuizSettings 의 모든 필드를 optional 로 만든 변환 타입(매핑드 타입).
  //        "일부 필드만 갱신" 을 표현할 때 자주 쓴다. 직접 같은 인터페이스를 다시 쓰지 않게 도와주는 유틸리티 타입.
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
