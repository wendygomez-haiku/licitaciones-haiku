"use client";
import { motion } from "framer-motion";

export default function SceneBody({ description }: { description: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="mt-4 text-base leading-relaxed opacity-80"
    >
      {description}
    </motion.p>
  );
}
