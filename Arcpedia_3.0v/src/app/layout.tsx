import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"
import { StudentProvider } from "@/context/student-context";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: 'Arcpedia',
  description: 'Your Personal AI-Powered Academic Assistant',
};

import { Inter, Outfit } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={cn('h-full font-sans antialiased bg-background', inter.variable, outfit.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <StudentProvider>
            {children}
            <Toaster />
            <Analytics />
          </StudentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
