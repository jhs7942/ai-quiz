import { useState } from 'react'
// [학습] recharts — D3 기반의 React 친화 차트 라이브러리. SVG 직접 작성 대신 컴포넌트로 차트 구성.
//        대안: chart.js, victory, nivo. recharts 는 React 선언형 스타일과 가장 잘 맞아 인기.
import { PieChart, Pie, Cell, Tooltip } from 'recharts'

interface ResultChartProps {
  correct: number
  total: number
}

export default function ResultChart({ correct, total }: ResultChartProps) {
  // [학습] useState lazy initializer + 1회 측정 — 마운트 시점의 다크모드 상태를 읽어 색상을 정한다.
  //        세터가 없는 [isDark] 만 분리 — 토글 동안 차트 색상은 안 바뀐다는 정책. 정확하게 따라가려면 useDarkMode 훅을 쓰면 됨.
  const [isDark] = useState(() => document.documentElement.classList.contains('dark'))
  const wrong = total - correct
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0

  const data = [
    { name: '정답', value: correct },
    { name: '오답', value: wrong },
  ]

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <PieChart width={160} height={160}>
          <Pie
            data={data}
            cx={75}
            cy={75}
            innerRadius={50}
            outerRadius={70}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
          >
            <Cell fill="#0D904F" />
            <Cell fill={isDark ? '#4B5563' : '#E5E7EB'} />
          </Pie>
          <Tooltip />
        </PieChart>
        {/* [학습] absolute inset-0 — 부모(relative) 안에서 4면 모두 0 으로 채워 정확히 겹치게.
            도넛 차트 가운데에 텍스트를 띄우는 흔한 패턴 (도넛 라이브러리에 텍스트 옵션이 없을 때). */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{percent}%</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{correct}/{total}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
        {percent >= 80 ? '🎉 훌륭해요!' : percent >= 60 ? '👍 잘했어요!' : '💪 더 연습해봐요'}
      </p>
    </div>
  )
}
