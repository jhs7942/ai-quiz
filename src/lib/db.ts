import { supabase } from './supabase'
import type { SaveQuizSessionPayload, SaveFeedbackPayload } from '../types'

// [학습] 이 파일은 Supabase 와 통신하는 모든 함수를 모아두는 "DB 레이어".
//        설계 원칙: ① 분석/로깅 함수는 DB 오류를 silent fail (앱 흐름 차단 X)
//                   ② 사용자 명시 액션(saveFeedback)은 에러를 위로 던져 UI 가 알림 처리
//                   ③ 함수마다 표현 단위(payload) 를 받아 호출처가 supabase 호출 형태를 몰라도 되게 함

// 사용자 upsert — sessionId 기반 익명 식별
export async function upsertUser(sessionId: string, userAgent: string): Promise<string> {
  // [학습] try/catch + 빈 catch — DB 오류 시 앱이 멈추지 않도록 silent fail. 분석 데이터는 잃어도 퀴즈 풀기는 계속된다.
  try {
    // [학습] supabase 메서드 체이닝 — .from(테이블).select(컬럼).eq(필드, 값).maybeSingle()
    //        SQL 의 SELECT id, visit_count FROM users WHERE session_id = ? LIMIT 1 과 동일.
    //        .maybeSingle() 은 "0개 또는 1개 행" 허용 → 0개면 data: null. .single() 은 0개면 에러.
    const { data: existing } = await supabase
      .from('users')
      .select('id, visit_count')
      .eq('session_id', sessionId)
      .maybeSingle()

    // [학습] "있으면 update, 없으면 insert" 패턴(=upsert). Supabase 에 .upsert() 메서드도 있지만,
    //        여기서는 visit_count 증가가 필요해서 select → 분기 방식으로 직접 구현했다.
    if (existing) {
      await supabase
        .from('users')
        .update({ last_visit_at: new Date().toISOString(), visit_count: existing.visit_count + 1 })
        .eq('id', existing.id)
      return existing.id
    }

    // [학습] insert 후 .select('id').single() — 삽입한 행의 id 를 즉시 반환받는 패턴.
    //        single() 은 정확히 1개 행을 기대 — insert 결과는 무조건 1행이라 single() 이 안전.
    const { data, error } = await supabase
      .from('users')
      .insert({ session_id: sessionId, user_agent: userAgent })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  } catch {
    // [학습] DB 실패 시 sessionId 자체를 user_id 로 사용하는 fallback.
    //        후속 함수(logAccess, saveQuizSession 등)도 string user_id 만 필요로 하므로 동작에 영향 없다.
    return sessionId // DB 오류 시 sessionId 자체를 fallback으로 반환
  }
}

// 접속 로그 기록
// [학습] Promise<void> — "결과값 없이 비동기 완료만 알리는" 함수. 호출처는 await 만 걸고 결과는 안 본다.
export async function logAccess(userId: string, pagePath: string, userAgent: string): Promise<void> {
  // [학습] DB 컬럼은 보통 snake_case(user_id), TS 측 변수는 camelCase(userId). 객체 리터럴에서 매핑한다.
  //        이름이 같으면 { userId } 처럼 쇼트핸드 가능하지만, 다르면 { user_id: userId } 로 명시.
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
// [학습] payload 패턴 — 함수 인자가 5개 이상이면 객체 하나로 묶는다. 호출처가 키 이름으로 명시할 수 있고 순서 실수도 사라진다.
//        타입은 types/index.ts 의 SaveQuizSessionPayload 에 정의 — DB 레이어와 호출처가 같은 타입을 공유.
export async function saveQuizSession(payload: SaveQuizSessionPayload): Promise<void> {
  try {
    // [학습] 두 단계 insert — 부모(quiz_sessions) → 자식(quiz_answers) 순서. 1:N 관계 데이터 저장의 정석.
    //        부모의 id 를 받은 뒤 자식 insert 의 외래키(quiz_session_id)에 채운다.
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
        // [학습] payload.pretest ?? false — nullish coalescing. payload.pretest 가 undefined/null 이면 false, 아니면 그 값.
        //        || false 와 다르다 — || 는 0/'' 같은 falsy 도 false 로 친다. ?? 는 null/undefined 만 검사.
        pretest: payload.pretest ?? false,
      })
      .select('id')
      .single()

    // [학습] error 와 !session 둘 다 검사 — 안전 가드. error 만 검사하면 data 가 비어도 통과해서 다음 줄에서 폭발.
    if (error || !session) return

    // [학습] payload.answers 가 빈 배열이면 insert 자체를 생략 — 불필요한 DB 호출 방지.
    if (payload.answers.length > 0) {
      // [학습] insert 에 배열을 넘기면 bulk insert. 한 번의 round-trip 으로 N 개 행 삽입 → for 문으로 하나씩 insert 하지 않는다.
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
// [학습] 이 함수는 try/catch 가 없다 — 사용자가 직접 누른 "신고" 버튼이라, 실패하면 UI 에 알려야 한다 (silent fail X).
//        호출처에서 try/catch 로 잡고 토스트로 사용자에게 보여준다 (FeedbackModal 등).
export async function saveFeedback(payload: SaveFeedbackPayload): Promise<void> {
  const { error } = await supabase.from('feedbacks').insert({
    user_id: payload.userId,
    quiz_id: payload.quizId,
    question_id: payload.questionId,
    report_type: payload.reportType,
    description: payload.description,
    // [학습] payload.suggestedAnswer ?? null — optional 필드의 빈값을 명시적으로 null 로 변환.
    //        DB 컬럼이 nullable 이라면 undefined 를 넘기지 말고 null 을 넘기는 게 안전 (Supabase 가 undefined 를 누락 처리할 수도).
    suggested_answer: payload.suggestedAnswer ?? null,
  })
  if (error) throw error
}
