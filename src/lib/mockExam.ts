import type { MockExam, Question } from '../types'

// 모의고사 목록 fetch
export async function fetchMockExams(): Promise<MockExam[]> {
  const res = await fetch('/quizzes/mock-exams/index.json')
  if (!res.ok) throw new Error('모의고사 목록 로드 실패')
  return res.json()
}

// 모의고사 문제 fetch + 모의고사 id 태깅
export async function fetchMockExamQuestions(exam: MockExam): Promise<Question[]> {
  const res = await fetch(`/quizzes/mock-exams/${exam.file}`)
  if (!res.ok) throw new Error(`모의고사 파일 로드 실패: ${exam.file}`)
  const questions: Question[] = await res.json()
  return questions.map((q) => ({ ...q, quizId: exam.id }))
}
