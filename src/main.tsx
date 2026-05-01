// [학습] 이 파일이 React 앱의 단일 진입점이다. index.html 의 <div id="root"> 한 곳에만 React 트리를 마운트한다.
//        Vite 가 빌드 시 이 파일을 entry 로 잡는다 (index.html 의 <script type="module" src="/src/main.tsx"> 참조).
import { StrictMode } from 'react'
// [학습] React 18+ 의 새로운 진입 API. 과거 ReactDOM.render() 대신 createRoot() 를 쓴다.
//        Concurrent Features(Suspense, Transitions 등)를 쓰려면 createRoot 가 필수.
import { createRoot } from 'react-dom/client'
// [학습] CSS 를 JS 에서 import 하면 Vite 가 번들에 포함하고 자동 주입한다. 별도 <link> 태그 불필요.
import './index.css'
// [학습] 확장자 .tsx 까지 명시하는 건 Vite 의 권장 스타일. tsconfig 가 허용하면 생략도 가능.
import App from './App.tsx'

// [학습] document.getElementById('root')!  — 끝의 ! 는 TypeScript 의 non-null assertion.
//        "이 값이 절대 null 이 아니다" 를 컴파일러에게 약속하는 표시. index.html 에 <div id="root"> 가 항상 있다는 전제.
//        만약 그 div 가 없으면 런타임 에러. 이런 단언은 "확실한 진입점" 같은 곳에서만 안전하게 쓴다.
createRoot(document.getElementById('root')!).render(
  // [학습] StrictMode 는 개발 모드에서만 동작하는 안전장치.
  //        side effect 가 있는 useEffect / setState 를 일부러 두 번 호출해 부수효과(side effect) 누수를 노출시킨다.
  //        프로덕션 빌드에서는 자동 제거되므로 성능에 영향 없음.
  <StrictMode>
    <App />
  </StrictMode>,
)
