import { createClient } from '@supabase/supabase-js'

// [학습] import.meta.env — Vite 가 제공하는 환경변수 객체 (Webpack 의 process.env 대체).
//        prefix 'VITE_' 가 붙은 변수만 클라이언트 번들에 노출된다 (보안 정책). VITE_ 가 아닌 변수는 빌드 시 자동 차단.
//        .env 또는 .env.local 에 정의하고 vite 가 빌드 시 치환한다 (런타임 process.env 처럼 동적이지 않음 — 빌드 타임 상수).
// [학습] as string — 타입 단언. import.meta.env 는 string | undefined 를 반환할 수 있는데, 여기서는 "반드시 있다" 고 컴파일러에 약속한다.
//        없으면 supabase 클라이언트 초기화는 되지만 호출 시 런타임 에러. 이 파일은 db.ts 에서 try/catch 로 silent-fail 패턴으로 감싼다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// [학습] 클라이언트는 모듈 최상단에서 단 한 번만 생성한다 — import 한 모든 파일이 같은 인스턴스를 공유.
//        함수 안에서 매번 createClient() 하면 connection pool 이 낭비된다. 이 패턴이 "싱글톤 모듈"이다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
