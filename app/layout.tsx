import type { Metadata } from "next";
import "./globals.css";
import MotionProvider from "@/components/MotionProvider"

export const metadata: Metadata = {
  title: "Estudio haiku",
  description: "App generated for Estudio haiku",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  )
}
