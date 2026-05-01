// [학습] 이 파일은 quizStore 와 별도의 두 번째 Zustand 스토어. "오답노트" 라는 책임이 분리되어 있어 별도 파일로 둔다.
//        한 앱이 여러 스토어를 가지는 건 정상 — 도메인이 다르면 분리, 같이 쓰는 액션이 많으면 합친다.
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WrongNote } from '../types'

// [학습] 인터페이스를 파일 내부에 두는 이유 — 외부에서 store 타입을 직접 쓸 일이 없어서 export 하지 않았다.
//        외부에 노출하고 싶으면 types/index.ts 로 옮기고 export.
interface WrongNoteStore {
  wrongNotes: WrongNote[]
  addWrongNote: (id: number, quizId: string) => void
  removeWrongNote: (id: number) => void
  clearWrongNotes: () => void
}

// [학습] create<WrongNoteStore>()(persist(...)) — quizStore 와 완전히 동일한 curry 패턴.
//        제네릭은 한 번만 명시(create<T>()), 그 후로는 모든 함수가 자동 추론된다.
export const useWrongNoteStore = create<WrongNoteStore>()(
  persist(
    (set, get) => ({
      wrongNotes: [],

      addWrongNote: (id, quizId) => {
        // [학습] 중복 방지 패턴 — 추가 전에 some() 으로 동일 항목 존재 검사. 같은 문제를 두 번 틀려도 노트엔 한 번만.
        //        get() 으로 현재 상태 스냅샷을 읽는 것에 주의 — get() 은 React 외부에서도 동작.
        const already = get().wrongNotes.some((n) => n.id === id && n.quizId === quizId)
        // [학습] early return 으로 중복 시 set 호출 자체를 생략 → 불필요한 리렌더 방지.
        if (already) return
        // [학습] set((state) => ({...})) — 함수형 업데이트. state 인자로 최신 값을 받기 때문에 동시 호출에도 안전.
        //        스프레드(...state.wrongNotes)로 새 배열 생성 → Zustand 가 변경을 감지 (mutation 직접 X).
        set((state) => ({
          wrongNotes: [...state.wrongNotes, { id, quizId, addedAt: new Date().toISOString() }],
        }))
      },

      removeWrongNote: (id) =>
        // [학습] filter 는 새 배열 반환 (원본 mutation X). 불변성 유지가 Zustand 변경 감지의 핵심.
        set((state) => ({
          wrongNotes: state.wrongNotes.filter((n) => n.id !== id),
        })),

      // [학습] 단순한 set — 인자가 함수가 아니라 객체. "기존 상태와 무관하게 통째로 교체" 시 이 형태가 더 짧다.
      clearWrongNotes: () => set({ wrongNotes: [] }),
    }),
    {
      // [학습] storage key 는 quizStore('ai-quiz-store')와 다르다 — 같은 키를 쓰면 충돌해 데이터가 덮어써진다.
      name: 'ai-quiz-wrong-notes',
      // [학습] localStorage 사용 — quizStore 는 sessionStorage(탭 닫으면 사라짐) 와 의도적으로 다르다.
      //        오답노트는 "장기 학습 데이터" 라 브라우저를 닫아도 유지되어야 하니 localStorage. 스토리지 선택은 데이터 수명 정책의 표현.
      storage: createJSONStorage(() => localStorage),
    }
  )
)
