import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Sports-Stream | Live Streaming Sports Gratuit",
  description:
    "Regardez tous vos matchs de sport en direct gratuitement. Football, Basketball, Tennis, UFC et plus encore sur Sports-Stream by WaveWatch.",
  keywords: ["sports", "streaming", "live", "football", "basketball", "match", "gratuit"],
  authors: [{ name: "WaveWatch" }],
  openGraph: {
    title: "Sports-Stream | Live Streaming Sports",
    description: "Regardez tous vos matchs de sport en direct gratuitement",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sports-Stream | Live Sports",
    description: "Matchs en direct gratuits",
  },
  icons: {
    icon: "https://i.imgur.com/zdFYbFp.png",
    apple: "https://i.imgur.com/zdFYbFp.png",
  },
  manifest: "/manifest.json",
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0c",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://streami.su" />
        <link rel="dns-prefetch" href="https://streami.su" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
