import { useEffect, useRef, useState } from 'react'
import { getSessionId } from '../lib/session'
import { upsertUser, logAccess } from '../lib/db'

export function useSession(pagePath: string) {
  const [userId, setUserId] = useState<string | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const sessionId = getSessionId()
    const userAgent = navigator.userAgent

    upsertUser(sessionId, userAgent).then((id) => {
      setUserId(id)
      logAccess(id, pagePath, userAgent)
    })
  }, [pagePath])

  return { userId }
}
