import { useEffect } from 'react'

declare global {
  interface Window {
    adsbygoogle: object[]
  }
}

interface Props {
  adSlot: string
  adFormat?: string
}

export default function GoogleAdSense({ adSlot, adFormat = 'auto' }: Props) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.error('AdSense 오류:', e)
    }
  }, [adSlot])

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client="ca-pub-9907319302562189"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  )
}
