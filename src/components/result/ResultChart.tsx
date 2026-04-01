import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'

interface ResultChartProps {
  correct: number
  total: number
}

export default function ResultChart({ correct, total }: ResultChartProps) {
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
