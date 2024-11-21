import VercelBackground from '@/components/ui/vercel-bg'
import { VercelReceiptForm } from '@/components/vercel-receipt-form'

export default function Home() {
    return (
        <VercelBackground>
            <main className="flex min-h-screen flex-col items-center justify-center p-4">
                <VercelReceiptForm />
            </main>
        </VercelBackground>
    )
}
