import type { Question, QuizCategory } from '../types'

// 카테고리 목록 fetch
export async function fetchCategories(): Promise<QuizCategory[]> {
  const res = await fetch('/quizzes/index.json')
  if (!res.ok) throw new Error('카테고리 목록 로드 실패')
  return res.json()
}

// 퀴즈 JSON fetch
export async function fetchQuiz(file: string): Promise<Question[]> {
  const res = await fetch(`/quizzes/${file}`)
  if (!res.ok) throw new Error(`퀴즈 파일 로드 실패: ${file}`)
  return res.json()
}

// 여러 카테고리에서 문제 병합, 난이도 필터, 수량 제한, 셔플
export async function buildQuestions(
  categories: QuizCategory[],
  difficulty: 'easy' | 'medium' | 'hard' | 'all',
  count: number | 'all',
  shuffle: boolean
): Promise<Question[]> {
  const allQuestions: Question[] = []
  for (const cat of categories) {
    const questions = await fetchQuiz(cat.file)
    allQuestions.push(...questions)
  }

  const filtered =
    difficulty === 'all' ? allQuestions : allQuestions.filter((q) => q.difficulty === difficulty)

  const shuffled = shuffle ? [...filtered].sort(() => Math.random() - 0.5) : filtered

  return count === 'all' ? shuffled : shuffled.slice(0, count)
}
