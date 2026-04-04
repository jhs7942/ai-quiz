import { supabase } from './supabase'
import type { SaveQuizSessionPayload, SaveFeedbackPayload } from '../types'

// 사용자 upsert — sessionId 기반 익명 식별
export async function upsertUser(sessionId: string, userAgent: string): Promise<string> {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id, visit_count')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('users')
        .update({ last_visit_at: new Date().toISOString(), visit_count: existing.visit_count + 1 })
        .eq('id', existing.id)
      return existing.id
    }

    const { data, error } = await supabase
      .from('users')
      .insert({ session_id: sessionId, user_agent: userAgent })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  } catch {
    return sessionId // DB 오류 시 sessionId 자체를 fallback으로 반환
  }
}

// 접속 로그 기록
export async function logAccess(userId: string, pagePath: string, userAgent: string): Promise<void> {
  try {
    await supabase.from('access_logs').insert({
      user_id: userId,
      page_path: pagePath,
      user_agent: userAgent,
    })
  } catch {
    // 조용히 무시
  }
}

// draft 세션 생성 (퀴즈 시작 시, score 0)
export async function createDraftSession(payload: {
  userId: string
  categories: string[]
  selectedTypes: string[]
  totalQuestions: number
  startedAt: string
  settings: { difficulty: string; shuffle: boolean }
  pretest: boolean
}): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: payload.userId,
        categories: payload.categories,
        selected_types: payload.selectedTypes,
        total_questions: payload.totalQuestions,
        correct_count: 0,
        score_percent: 0,
        started_at: payload.startedAt,
        settings: payload.settings,
        pretest: payload.pretest,
      })
      .select('id')
      .single()

    if (error || !data) return null
    return data.id
  } catch {
    return null
  }
}

// 단일 답안 저장
export async function saveQuizAnswer(
  sessionId: string,
  answer: {
    questionId: number
    quizId: string
    questionType: string
    userAnswer: string
    isCorrect: boolean
  },
  pretest: boolean
): Promise<void> {
  try {
    await supabase.from('quiz_answers').insert({
      quiz_session_id: sessionId,
      question_id: answer.questionId,
      quiz_id: answer.quizId,
      question_type: answer.questionType,
      user_answer: answer.userAnswer,
      is_correct: answer.isCorrect,
      pretest,
    })
  } catch {
    // 조용히 무시
  }
}

// 최종 점수 업데이트
export async function updateSessionResult(
  sessionId: string,
  correctCount: number,
  scorePercent: number
): Promise<void> {
  try {
    await supabase
      .from('quiz_sessions')
      .update({ correct_count: correctCount, score_percent: scorePercent })
      .eq('id', sessionId)
  } catch {
    // 조용히 무시
  }
}

// 퀴즈 풀이 세션 저장
export async function saveQuizSession(payload: SaveQuizSessionPayload): Promise<void> {
  try {
    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: payload.userId,
        categories: payload.categories,
        selected_types: payload.selectedTypes,
        total_questions: payload.totalQuestions,
        correct_count: payload.correctCount,
        score_percent: payload.scorePercent,
        started_at: payload.startedAt,
        settings: payload.settings,
        pretest: payload.pretest ?? false,
      })
      .select('id')
      .single()

    if (error || !session) return

    if (payload.answers.length > 0) {
      await supabase.from('quiz_answers').insert(
        payload.answers.map((a) => ({
          quiz_session_id: session.id,
          question_id: a.questionId,
          quiz_id: a.quizId,
          question_type: a.questionType,
          user_answer: a.userAnswer,
          is_correct: a.isCorrect,
          pretest: payload.pretest ?? false,
        }))
      )
    }
  } catch {
    // 퀴즈 풀기는 DB 오류와 무관하게 동작
  }
}

// 문제 오류 신고 저장
export async function saveFeedback(payload: SaveFeedbackPayload): Promise<void> {
  const { error } = await supabase.from('feedbacks').insert({
    user_id: payload.userId,
    quiz_id: payload.quizId,
    question_id: payload.questionId,
    report_type: payload.reportType,
    description: payload.description,
    suggested_answer: payload.suggestedAnswer ?? null,
  })
  if (error) throw error
}
