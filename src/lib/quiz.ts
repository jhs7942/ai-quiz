import type { Question, QuizCategory } from '../types'

// 카테고리 목록 fetch
export async function fetchCategories(): Promise<QuizCategory[]> {
  const res = await fetch('/quizzes/index.json')
  if (!res.ok) throw new Error('카테고리 목록 로드 실패')
  return res.json()
}

// 퀴즈 JSON fetch + 카테고리 id 태깅
export async function fetchQuiz(categoryId: string, file: string): Promise<Question[]> {
  const res = await fetch(`/quizzes/${file}`)
  if (!res.ok) throw new Error(`퀴즈 파일 로드 실패: ${file}`)
  const questions: Question[] = await res.json()
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
  for (const cat of categories) {
    const questions = await fetchQuiz(cat.id, cat.file)
    allQuestions.push(...questions)
  }

  const filtered =
    difficulty === 'all' ? allQuestions : allQuestions.filter((q) => q.difficulty === difficulty)

  if (count === 'all') {
    return shuffle ? [...filtered].sort(() => Math.random() - 0.5) : filtered
  }

  // 유형별 균등 배분: 전체 비율에 맞게 객관식/주관식 문제 수 배분
  const mcqs = filtered.filter((q) => q.type === 'multiple_choice')
  const saqs = filtered.filter((q) => q.type === 'short_answer')
  const total = filtered.length

  if (total === 0) return []

  // 비율 계산 (반올림 후 합산이 count를 초과하지 않도록 보정)
  const mcCount = Math.round((mcqs.length / total) * count)
  const saCount = count - mcCount

  const pickFrom = <T>(arr: T[], n: number, doShuffle: boolean): T[] => {
    const source = doShuffle ? [...arr].sort(() => Math.random() - 0.5) : arr
    return source.slice(0, Math.min(n, source.length))
  }

  const sampled = [
    ...pickFrom(mcqs, mcCount, shuffle),
    ...pickFrom(saqs, saCount, shuffle),
  ]

  return shuffle ? sampled.sort(() => Math.random() - 0.5) : sampled
}
