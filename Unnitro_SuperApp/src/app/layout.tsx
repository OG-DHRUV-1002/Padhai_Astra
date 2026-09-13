import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SmoothScrollProvider } from "@/components/ui/smooth-scroll-provider"
import { ScrollProgress } from "@/components/ui/scroll-progress"
import { ClientLayoutWrapper } from "@/components/layout/ClientLayoutWrapper"
import { AuthProvider } from "@/lib/auth"
import { SettingsProvider } from "@/lib/settings-context"
import { LocationProvider } from "@/lib/location-context"
import { QueryProvider } from "@/lib/query-provider"
import { StudentProvider } from "@/context/student-context"
import { ExamProvider } from "@/context/exam-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Unnitro SuperApp",
  description: "Unified campus intelligence platform — powered by Unnitro",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <SmoothScrollProvider>
          <ScrollProgress />
          <div className="flex h-screen w-full overflow-hidden">
            <QueryProvider>
          <AuthProvider>
            <SettingsProvider>
              <LocationProvider>
                <StudentProvider>
                  <ExamProvider>
                    <ClientLayoutWrapper>
                      {children}
                    </ClientLayoutWrapper>
                  </ExamProvider>
                </StudentProvider>
              </LocationProvider>
            </SettingsProvider>
          </AuthProvider>
        </QueryProvider>
          </div>
        </SmoothScrollProvider>
      </body>
    </html>
  )
}


