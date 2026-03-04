"use client"

import { motion } from "framer-motion"

export default function SceneBadge({
  slug,
  title,
}: {
  slug: string
  title: string
}) {
  return (
    <motion.div
      layoutId={`node-${slug}`}
      className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-secondary-content shadow-sm"
    >
      <span className="text-xs font-semibold uppercase tracking-wider">
        Scene
      </span>
      <span className="text-sm font-semibold">{title}</span>
    </motion.div>
  )
}