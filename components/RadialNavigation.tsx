"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { haikuNodes } from "@/lib/nodes"

type Props = {
  size?: number
  radius?: number
  centerLabel?: string
  className?: string
}

export default function RadialNavigation({
  size = 720,
  radius = 260,
  centerLabel = "haikú",
  className,
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const reduceMotion = useReducedMotion()

  const [tilt, setTilt] = React.useState({ rx: 0, ry: 0 })

  const activeSlug = React.useMemo(() => {
    const match = pathname?.match(/\/scene\/([^/]+)/)
    return match?.[1] ?? null
  }, [pathname])

  const total = haikuNodes.length
  const c = size / 2

  const [hoveredSlug, setHoveredSlug] = React.useState<string | null>(null)
  const focusedSlug = hoveredSlug ?? activeSlug

  const nodesWithXY = React.useMemo(() => {
    return haikuNodes.map((node, i) => {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2
      const x = c + radius * Math.cos(angle)
      const y = c + radius * Math.sin(angle)
      return { ...node, x, y, angle }
    })
  }, [c, radius, total])

  const focusedNode = React.useMemo(() => {
    if (!focusedSlug) return null
    return nodesWithXY.find((n) => n.slug === focusedSlug) ?? null
  }, [focusedSlug, nodesWithXY])

  const ringStroke = "rgba(0,0,0,0.12)"
  const spokeStroke = "rgba(0,0,0,0.10)"
  const softStroke = "rgba(0,0,0,0.18)"

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion) return

    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5

    setTilt({
      rx: -py * 8,
      ry: px * 10,
    })
  }

  function onLeave() {
    if (reduceMotion) return
    setTilt({ rx: 0, ry: 0 })
  }

  function goTo(slug: string) {
    router.push(`/scene/${slug}`)
  }

  return (
    <div className={className}>
      <div className="relative mx-auto w-full max-w-[900px]">
        {/* Tooltip / microcopy */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 w-[min(520px,90vw)] -translate-x-1/2 -translate-y-1/2 text-center">
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
            className="mx-auto rounded-2xl bg-base-100/70 px-6 py-5 shadow-sm backdrop-blur"
          >
            <div className="text-sm opacity-70">Circular narrative system</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              {focusedNode ? focusedNode.title : "Explore"}
            </div>
            <div className="mt-2 text-sm leading-relaxed opacity-80">
              {focusedNode
                ? focusedNode.description
                : "Move across nodes to preview each scene. Click to enter."}
            </div>
          </motion.div>
        </div>

        {/* Stage wrapper (fake 3D) */}
        <motion.div
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          animate={reduceMotion ? { rotateX: 0, rotateY: 0 } : { rotateX: tilt.rx, rotateY: tilt.ry }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          style={{
            perspective: 1200,
            transformStyle: "preserve-3d",
            transformOrigin: "50% 50%",
            willChange: "transform",
          }}
          className="mx-auto w-full"
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="mx-auto block h-auto w-full"
            role="img"
            aria-label="Haiku radial navigation"
          >
            {/* Outer ring */}
            <circle cx={c} cy={c} r={radius} fill="none" stroke={ringStroke} strokeWidth={1.5} />

            {/* Inner ring */}
            <circle cx={c} cy={c} r={radius * 0.55} fill="none" stroke={spokeStroke} strokeWidth={1} />

            {/* Spokes */}
            {nodesWithXY.map((n) => (
              <line
                key={`spoke-${n.slug}`}
                x1={c}
                y1={c}
                x2={n.x}
                y2={n.y}
                stroke={spokeStroke}
                strokeWidth={1}
              />
            ))}

            {/* Center */}
            <motion.g
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
            >
              <circle cx={c} cy={c} r={56} className="fill-primary" opacity={0.95} />
              <circle cx={c} cy={c} r={62} fill="none" stroke={softStroke} strokeWidth={1} />
              <text
                x={c}
                y={c}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-primary-content"
                style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.2 }}
              >
                {centerLabel}
              </text>
              <text
                x={c}
                y={c + 22}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-primary-content"
                style={{ fontSize: 11, opacity: 0.85 }}
              >
                narrative compass
              </text>
            </motion.g>

            {/* Nodes */}
            {nodesWithXY.map((n, i) => {
              const isActive = activeSlug === n.slug
              const isFocused = focusedSlug === n.slug

              const nodeR = isFocused ? 34 : 30
              const strokeW = isFocused ? 2 : 1

              return (
                <motion.g
                  key={n.slug}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.55,
                    delay: reduceMotion ? 0 : i * 0.06,
                    ease: "easeOut",
                  }}
                  onMouseEnter={() => setHoveredSlug(n.slug)}
                  onMouseLeave={() => setHoveredSlug(null)}
                >
                  {/* Active glow */}
                  {isActive && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={nodeR + 10}
                      fill="none"
                      className="stroke-accent"
                      opacity={0.35}
                      strokeWidth={6}
                    />
                  )}

                  {/* Click target */}
                  <g
                    role="link"
                    tabIndex={0}
                    aria-label={`Open scene: ${n.title}`}
                    onClick={() => goTo(n.slug)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        goTo(n.slug)
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Node body with shared layout id */}
                    <motion.circle
                      layoutId={`node-${n.slug}`}
                      cx={n.x}
                      cy={n.y}
                      r={nodeR}
                      className={isActive ? "fill-secondary" : "fill-base-100"}
                      stroke={isFocused ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.18)"}
                      strokeWidth={strokeW}
                    />

                    {/* Label */}
                    <text
                      x={n.x}
                      y={n.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={[
                        "pointer-events-none select-none",
                        isActive ? "fill-secondary-content" : "fill-base-content",
                      ].join(" ")}
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: 0.2,
                        opacity: isFocused ? 0.95 : 0.85,
                      }}
                    >
                      {n.title.length > 14 ? "Transform" : n.title}
                    </text>
                  </g>
                </motion.g>
              )
            })}
          </svg>
        </motion.div>

        {/* Hint row */}
        <div className="mt-4 flex items-center justify-center gap-3 text-xs opacity-70">
          <span className="badge badge-ghost">hover</span>
          <span>preview</span>
          <span className="opacity-40">·</span>
          <span className="badge badge-ghost">click</span>
          <span>enter scene</span>
        </div>
      </div>
    </div>
  )
}