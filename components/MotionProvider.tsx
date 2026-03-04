"use client"
import { LayoutGroup } from "framer-motion"

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LayoutGroup>{children}</LayoutGroup>
}