// [학습] import type { ... } — 타입만 import 한다는 명시. 런타임 코드 0바이트 (트리쉐이킹 보장).
//        값 import 와 섞이면 번들에 코드가 들어가 사이즈가 늘 수 있어, 타입 전용은 분리하는 게 모범.
import type { MockExam, Question } from '../types'

// 모의고사 목록 fetch
// [학습] 반환 타입을 Promise<MockExam[]> 로 명시 — async 함수의 결과는 항상 Promise 로 감싼다.
//        외부에서 await fetchMockExams() 하면 MockExam[] 가 들어오고, .then(...) 도 가능.
export async function fetchMockExams(): Promise<MockExam[]> {
  // [학습] /quizzes/...  처럼 슬래시로 시작하는 경로는 public/ 디렉토리 기준. Vite 가 이를 빌드 시 dist/ 로 복사하고 그대로 서빙한다.
  const res = await fetch('/quizzes/mock-exams/index.json')
  // [학습] fetch 는 4xx/5xx 에서도 reject 되지 않는다 — res.ok(=200~299)를 직접 검사해야 한다. 흔한 함정.
  if (!res.ok) throw new Error('모의고사 목록 로드 실패')
  return res.json()
}

// 모의고사 문제 fetch + 모의고사 id 태깅
export async function fetchMockExamQuestions(exam: MockExam): Promise<Question[]> {
  const res = await fetch(`/quizzes/mock-exams/${exam.file}`)
  if (!res.ok) throw new Error(`모의고사 파일 로드 실패: ${exam.file}`)
  const questions: Question[] = await res.json()
  // [학습] map((q) => ({ ...q, quizId: exam.id })) — 원본 객체를 변경하지 않고 새 객체를 반환(불변).
  //        스프레드(...q)로 모든 필드 복사 + quizId 추가. JSON 원본에 quizId 가 없어도 런타임에 태깅된다 (types.ts 의 quizId?: 와 짝).
  return questions.map((q) => ({ ...q, quizId: exam.id }))
}
