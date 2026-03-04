"use client"

import { haikuNodes } from "@/lib/nodes"
import { motion } from "framer-motion"
import Link from "next/link"

const radius = 220
const center = 300

export default function CircularNavigation() {
  const total = haikuNodes.length

  return (
    <div className="flex items-center justify-center h-screen">
      <svg width={600} height={600} className="overflow-visible">

        {/* center logo */}
        <circle cx={center} cy={center} r={40} className="fill-primary" />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dy=".3em"
          className="fill-white font-bold"
        >
          haiku
        </text>

        {haikuNodes.map((node, index) => {
          const angle = (index / total) * Math.PI * 2

          const x = center + radius * Math.cos(angle)
          const y = center + radius * Math.sin(angle)

          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/scene/${node.slug}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={30}
                  className="fill-secondary hover:fill-accent cursor-pointer"
                />

                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dy=".3em"
                  className="text-xs fill-white pointer-events-none"
                >
                  {node.title}
                </text>
              </Link>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}