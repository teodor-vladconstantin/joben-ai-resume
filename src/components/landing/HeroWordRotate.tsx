"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export interface HeroWordRotateProps {
  words: string[]
  intervalMs?: number
}

export function HeroWordRotate({ words, intervalMs = 2400 }: HeroWordRotateProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % words.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [words.length, intervalMs])

  return (
    <span className="relative inline-grid align-baseline text-(--accent)">
      {words.map((word) => (
        <span
          key={word}
          className="invisible col-start-1 row-start-1 inline-block"
          aria-hidden="true"
        >
          {word}
        </span>
      ))}
      <AnimatePresence>
        <motion.span
          key={words[index]}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="col-start-1 row-start-1 inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
