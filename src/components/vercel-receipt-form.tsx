'use client'

import { useEffect, useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Printer, Info, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toPng } from 'html-to-image'
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip'
import { fetchVercelData, saveVercelStats } from '@/app/actions'
import type { VercelData } from '@/app/types'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

export function VercelReceiptForm() {
    const [userToken, setUserToken] = useState<string>('')
    const [vercelData, setVercelData] = useState<VercelData | null>(null)
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const receiptRef = useRef<HTMLDivElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [transactionId, setTransactionId] = useState<string>('')
    const [saveStats, setSaveStats] = useState(false)

    useEffect(() => {
        if (userToken) {
            setTransactionId(`TRX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`)
        }
    }, [userToken])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userToken) {
            setError('API token is required')
            return
        }
        setLoading(true)
        setError(null)

        try {
            const data = await fetchVercelData(userToken)
            setVercelData(data)

            if (saveStats) {
                await saveVercelStats({
                    email: data.user.email,
                    username: data.user.username,
                    totalProjects: data.projects.length,
                    totalDeployments: data.projects.reduce((acc, project) => acc + project.latestDeployments.length, 0),
                    totalTeams: data.teams.length,
                    mostActiveProject:
                        data.projects.reduce((prev, current) =>
                            (prev?.latestDeployments.length ?? 0) > (current?.latestDeployments.length ?? 0)
                                ? prev
                                : current
                        )?.name || 'N/A'
                })
            }

            setLoading(false)
            setSubmitted(true)
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred')
            setLoading(false)
        }
    }

    const downloadReceiptAsImage = () => {
        if (receiptRef.current === null) return

        toPng(receiptRef.current)
            .then((dataUrl) => {
                const link = document.createElement('a')
                link.download = 'vercel-receipt.png'
                link.href = dataUrl
                link.click()
            })
            .catch((error) => {
                console.error('Error generating image:', error)
            })
    }

    const handleLogoClick = () => {
        setSubmitted(false)
    }

    // Calculate statistics
    const totalDeployments =
        vercelData?.projects.reduce((acc, project) => acc + project.latestDeployments.length, 0) ?? 0
    const averageDeployments = vercelData?.projects.length
        ? (totalDeployments / vercelData.projects.length).toFixed(2)
        : '0'
    const mostActiveProject = vercelData?.projects.length
        ? vercelData.projects.reduce((prev, current) =>
              (prev?.latestDeployments.length ?? 0) > (current?.latestDeployments.length ?? 0) ? prev : current
          )
        : null

    return (
        <div className="flex w-full max-w-[380px] flex-col items-center space-y-4">
            {!submitted && (
                <>
                    <h1 className="mb-8 text-4xl font-extrabold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Verceipts
                    </h1>
                    <Link href="/leaderboard" className="mb-4 text-sm text-gray-400 hover:text-white hover:underline">
                        View Leaderboard →
                    </Link>
                </>
            )}

            <div className="flex w-full items-center space-x-2">
                <form onSubmit={handleSubmit} className="flex w-full flex-col space-y-4">
                    <div className="flex space-x-2">
                        <Input
                            type="text"
                            placeholder="Enter your Vercel API Token"
                            value={userToken}
                            onChange={(e) => setUserToken(e.target.value)}
                            className="flex-grow rounded-md border border-gray-800 bg-gray-900 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                            type="submit"
                            className="flex h-10 w-24 items-center justify-center rounded-md bg-white px-4 py-2 font-medium text-black transition-colors duration-200 hover:bg-gray-200"
                        >
                            {loading ? <Loader className="animate-spin" size={16} /> : 'Submit'}
                        </Button>

                        {submitted && !loading && (
                            <Button
                                onClick={downloadReceiptAsImage}
                                className="h-10 w-24 rounded-md bg-white px-4 py-2 font-medium text-black transition-colors duration-200 hover:bg-gray-200"
                            >
                                Download
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="saveStats"
                            checked={saveStats}
                            onCheckedChange={(checked) => setSaveStats(!!checked)}
                            className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                        />
                        <label htmlFor="saveStats" className="cursor-pointer text-sm text-gray-300">
                            Save my stats to be shown on the public leaderboard
                        </label>
                    </div>
                </form>

                <div className="flex items-center">
                    <TooltipProvider>
                        <Tooltip
                            content={
                                <span>
                                    Get your API token from{' '}
                                    <a
                                        href="https://vercel.com/account/settings/tokens"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 underline"
                                    >
                                        Vercel
                                    </a>
                                    . Set scope to full account, and expiration to 1 day.
                                </span>
                            }
                        >
                            <Info className="cursor-pointer text-gray-500" size={20} />
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {error && <p className="mt-2 text-red-500">{error}</p>}

            {submitted && (
                <>
                    <h1
                        className="absolute left-4 top-4 cursor-pointer text-2xl font-extrabold text-white"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                        onClick={handleLogoClick}
                    >
                        Verceipts
                    </h1>

                    <ScrollArea className="mt-8 h-[500px] w-full max-w-[380px]">
                        {loading ? (
                            <p className="text-center text-white">Loading...</p>
                        ) : (
                            <div ref={receiptRef}>
                                <Card className="border-none bg-white font-mono text-[11px] leading-tight shadow-lg">
                                    <div className="space-y-4 p-6">
                                        <div className="space-y-1 text-center">
                                            <h1 className="text-xl font-bold tracking-tight">VERCEL RECEIPT</h1>
                                            <p>Generated for: {vercelData?.user.name}</p>
                                            <p>Email: {vercelData?.user.email}</p>
                                            <p>Username: {vercelData?.user.username}</p>
                                        </div>

                                        <div className="space-y-1 border-b border-t border-dashed border-gray-300 py-2">
                                            <p>Date: {new Date().toLocaleDateString()}</p>
                                            <p>Time: {new Date().toLocaleTimeString()}</p>
                                            <p>Transaction ID: {transactionId}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between font-bold">
                                                <span>Project</span>
                                                <span>Deployments</span>
                                            </div>

                                            {vercelData?.projects.map((project) => (
                                                <div key={project.id} className="flex justify-between">
                                                    <span className="w-1/2 truncate">{project.name}</span>
                                                    <span className="w-1/3 text-right">
                                                        {project.latestDeployments.length}
                                                    </span>
                                                </div>
                                            ))}

                                            <div className="flex justify-between border-t border-dashed border-gray-300 pt-2 font-bold">
                                                <span>Total Projects Owned</span>
                                                <span>{vercelData?.projects.length}</span>
                                            </div>

                                            <div className="flex justify-between font-bold">
                                                <span>Total Deployments</span>
                                                <span>{totalDeployments}</span>
                                            </div>

                                            <div className="flex justify-between font-bold">
                                                <span>Average Deployments/Project</span>
                                                <span>{averageDeployments}</span>
                                            </div>

                                            <div className="flex justify-between font-bold">
                                                <span>Most Active Project</span>
                                                <span>{mostActiveProject?.name || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h2 className="font-bold">Teams</h2>
                                            {vercelData?.teams.map((team) => (
                                                <div key={team.id} className="flex justify-between">
                                                    <span className="w-1/2 truncate">{team.name}</span>
                                                </div>
                                            ))}

                                            <div className="flex justify-between font-bold">
                                                <span>Total Teams</span>
                                                <span>{vercelData?.teams.length}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-center">
                                            <img src="/barcode.png" alt="Barcode" className="w-30 h-30" />
                                        </div>

                                        <div className="space-y-1 text-center">
                                            <p className="font-bold">Thank you for using Vercel!</p>
                                            <a
                                                href="https://verceipts.vercel.app/"
                                                className="text-[10px] text-blue-500 underline"
                                            >
                                                verceipts.vercel.app
                                            </a>
                                        </div>

                                        <div className="flex items-center justify-center gap-2 text-gray-500">
                                            <Printer size={14} />
                                            <span className="text-[10px]">Printed on recycled paper</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </ScrollArea>
                </>
            )}
        </div>
    )
}
