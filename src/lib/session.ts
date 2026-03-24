const SESSION_KEY = 'ai_quiz_session_id'

// localStorage에서 UUID 읽기, 없으면 생성
export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}
