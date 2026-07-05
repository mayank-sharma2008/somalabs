import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import RegisterSW from "@/components/RegisterSW"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  themeColor: "#000000",
}

export const metadata: Metadata = {
  title: "SomaLabs — Every Phase of AI",
  description: "One Studio. Every AI Model.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SOMA",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <RegisterSW />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}