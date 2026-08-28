import type { Question, QuizCategory } from '../types'

// [학습] 이 파일은 "원본 JSON → 화면에 풀 문제 배열" 까지의 데이터 파이프라인을 담당한다.
//        단계: ① fetch + 태깅 (fetchQuiz) → ② 병합·필터·샘플링·셔플 (buildQuestions).
//        store(quizStore.startQuiz) 가 결과 배열을 그대로 questions 에 넣는다.

// 카테고리 목록 fetch
export async function fetchCategories(): Promise<QuizCategory[]> {
  const res = await fetch('/quizzes/index.json')
  // [학습] fetch 는 네트워크 자체가 실패해야만 reject — 404/500 도 res 객체로 돌아온다. res.ok 검사가 필수.
  if (!res.ok) throw new Error('카테고리 목록 로드 실패')
  return res.json()
}

// 퀴즈 JSON fetch + 카테고리 id 태깅
export async function fetchQuiz(categoryId: string, file: string): Promise<Question[]> {
  const res = await fetch(`/quizzes/${file}`)
  if (!res.ok) throw new Error(`퀴즈 파일 로드 실패: ${file}`)
  const questions: Question[] = await res.json()
  // [학습] map + spread — 원본 JSON 을 변경하지 않고 quizId 를 런타임 태깅. 결과 채점 시 "어느 카테고리 문제였는지" 추적용.
  return questions.map((q) => ({ ...q, quizId: categoryId }))
}

// 여러 카테고리에서 문제 병합, 난이도 필터, 유형별 균등 배분, 셔플
export async function buildQuestions(
  categories: QuizCategory[],
  difficulty: 'easy' | 'medium' | 'hard' | 'all',
  count: number | 'all',
  shuffle: boolean
): Promise<Question[]> {
  const allQuestions: Question[] = []
  // [학습] for-of + await — 카테고리를 **하나씩 직렬로** 가져온다. 빠르게 하려면 Promise.all([...].map(fetchQuiz)) 로 병렬화 가능.
  //        지금은 카테고리가 많아야 5~6개 + 캐시도 잘 먹어서 직렬도 충분. 다만 학습 포인트로 알아둘 것.
  for (const cat of categories) {
    const questions = await fetchQuiz(cat.id, cat.file)
    // [학습] push(...questions) — 스프레드로 펼쳐서 평탄하게 추가. concat 대신 push 를 쓰면 새 배열이 생기지 않아 메모리 효율 좋다.
    allQuestions.push(...questions)
  }

  // [학습] 난이도 필터 — 'all' 이면 그대로, 그 외엔 filter. 삼항 연산자로 분기를 한 줄에 표현.
  const filtered =
    difficulty === 'all' ? allQuestions : allQuestions.filter((q) => q.difficulty === difficulty)

  // [학습] count === 'all' 분기 — sentinel 값으로 "전체" 의도를 표현 (types/index.ts 의 number | 'all' 와 짝).
  //        [...filtered].sort(...)  — 스프레드로 새 배열 만든 뒤 정렬. 원본 mutation 방지.
  //        sort(() => Math.random() - 0.5) — Fisher-Yates 가 아닌 비공식 셔플. 균등하지 않다는 약점이 있지만 학습용 앱에선 충분.
  if (count === 'all') {
    return shuffle ? [...filtered].sort(() => Math.random() - 0.5) : filtered
  }

  // 유형별 균등 배분: 전체 비율에 맞게 객관식/주관식 문제 수 배분
  // [학습] discriminated union 활용 — q.type === 'multiple_choice' 만 검사하면 TS 가 그 블록 안에서 타입을 좁힌다.
  const mcqs = filtered.filter((q) => q.type === 'multiple_choice')
  const saqs = filtered.filter((q) => q.type === 'short_answer')
  const total = filtered.length

  // [학습] 빈 배열 가드 — 0 으로 나누거나 의미 없는 결과를 막는 early return.
  if (total === 0) return []

  // 비율 계산 (반올림 후 합산이 count를 초과하지 않도록 보정)
  // [학습] mcCount 만 반올림하고 saCount 는 count - mcCount 로 계산 — 두 값을 더하면 정확히 count 가 된다 (반올림 누적 오차 방지).
  const mcCount = Math.round((mcqs.length / total) * count)
  const saCount = count - mcCount

  // [학습] 제네릭 화살표 함수 <T> — 호출 측의 타입(Question)을 그대로 보존한다. any 를 안 쓰고 재사용 가능한 헬퍼를 만든 예.
  //        함수 안에 인라인으로 정의 — 외부에서 안 쓰니 굳이 export 하지 않는다.
  const pickFrom = <T>(arr: T[], n: number, doShuffle: boolean): T[] => {
    const source = doShuffle ? [...arr].sort(() => Math.random() - 0.5) : arr
    // [학습] Math.min(n, source.length) — n 이 배열보다 크면 배열 길이만큼만 자르도록 안전 클램프.
    return source.slice(0, Math.min(n, source.length))
  }

  const sampled = [
    ...pickFrom(mcqs, mcCount, shuffle),
    ...pickFrom(saqs, saCount, shuffle),
  ]

  // [학습] 마지막 셔플 — 객관식이 앞쪽, 주관식이 뒤쪽으로 몰리지 않게 한 번 더 섞는다.
  return shuffle ? sampled.sort(() => Math.random() - 0.5) : sampled
}
