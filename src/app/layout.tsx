import '@/styles/globals.css'

import { Inter } from 'next/font/google'

import { TRPCReactProvider } from '@/trpc/react'
import { ClerkProvider } from '@clerk/nextjs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'T3 Starter',
    description: 'T3 Starter',
    icons: [{ rel: 'icon', url: '/favicon.ico' }]
}

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-sans'
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable}`}>
            <body>
                <ClerkProvider>
                    <TRPCReactProvider>
                            <TooltipProvider>
                                <Toaster />
                                {children}
                            </TooltipProvider>
                    </TRPCReactProvider>
                </ClerkProvider>
            </body>
        </html>
    )
}
