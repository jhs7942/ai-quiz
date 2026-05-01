import { useEffect } from 'react'

// [학습] declare global { interface Window { ... } } — 전역 Window 인터페이스 확장.
//        adsbygoogle 은 외부 스크립트(index.html 의 <script src=adsbygoogle.js>)가 window 에 주입한다.
//        TS 는 모르므로 직접 타입을 선언해줘야 window.adsbygoogle 사용 시 컴파일 에러를 피할 수 있다.
declare global {
  interface Window {
    adsbygoogle: object[]
  }
}

interface Props {
  adSlot: string
  adFormat?: string
  adLayoutKey?: string
}

export default function GoogleAdSense({ adSlot, adFormat = 'auto', adLayoutKey }: Props) {
  // [학습] (window.adsbygoogle = window.adsbygoogle || []).push({}) — AdSense 의 표준 init 호출.
  //        외부 스크립트 로드 전엔 undefined → 빈 배열 할당, push 하면 스크립트가 그 큐를 소비.
  //        try/catch — 외부 스크립트가 차단(애드블록)되면 push 가 throw. silent 처리 가능하지만 학습 단계라 console.error 만.
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.error('AdSense 오류:', e)
    }
  }, [adSlot])

  return (
    // [학습] {...(condition ? { key: value } : {})} — 조건부 spread. adLayoutKey 가 있을 때만 data-ad-layout-key 속성을 붙임.
    //        false 면 빈 객체를 spread → 아무 속성도 안 붙음. JSX 에 conditional attribute 를 깔끔히 추가하는 패턴.
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client="ca-pub-9907319302562189"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      {...(adLayoutKey ? { 'data-ad-layout-key': adLayoutKey } : {})}
      data-full-width-responsive="true"
    />
  )
}
