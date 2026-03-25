import { useEffect } from 'react'

const DEFAULT_TITLE = 'AI Quiz - 시험 직전 10분, 핵심 개념 완벽 마스터'
const DEFAULT_DESC =
  'AI 핵심 이론부터 실전 문제까지! 시험 대비 최적화 AI 퀴즈 플랫폼입니다. 짧은 시간 안에 고효율 학습을 경험하세요.'

export function useMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    return () => {
      document.title = DEFAULT_TITLE
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute('content', DEFAULT_DESC)
    }
  }, [title, description])
}
