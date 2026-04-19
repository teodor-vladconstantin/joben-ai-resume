"use client"
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts'

function bellCurveValue(x: number, mean: number, std: number): number {
  return Math.exp(-0.5 * ((x - mean) / std) ** 2)
}

function buildDistribution() {
  const mean = 62
  const std = 16
  const points = []
  for (let score = 0; score <= 100; score += 2) {
    points.push({
      score,
      frequency: Math.round(bellCurveValue(score, mean, std) * 1000) / 10,
    })
  }
  return points
}

const data = buildDistribution()

type Props = {
  userScore: number
}

export function BenchmarkChart({ userScore }: Props) {
  const percentile = Math.round(
    (data.filter((d) => d.score <= userScore).length / data.length) * 100
  )

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -32 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0A9548" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0A9548" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="score"
            tick={{ fill: '#ffffff50', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => (v % 20 === 0 ? String(v) : '')}
          />
          <YAxis hide />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as { score: number; frequency: number }
              return (
                <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70">
                  Score {d.score}: {d.frequency}% of resumes
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="frequency"
            stroke="#0A9548"
            strokeWidth={2}
            fill="url(#scoreGrad)"
            dot={false}
            activeDot={false}
          />
          <ReferenceLine
            x={userScore}
            stroke="#16DB65"
            strokeWidth={2}
            strokeDasharray="4 2"
            label={{
              value: `You: ${userScore}`,
              position: userScore > 70 ? 'insideTopLeft' : 'insideTopRight',
              fill: '#16DB65',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-xs text-white/50 mt-3">
        Your score of <span className="text-white font-medium">{userScore}</span> is higher than approximately{' '}
        <span className="text-[#16DB65] font-medium">{percentile}%</span> of resumes in our system.
      </p>
    </div>
  )
}
