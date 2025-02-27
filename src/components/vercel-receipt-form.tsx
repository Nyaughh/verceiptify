'use client'

import { useEffect, useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Printer, Info, Loader, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toPng } from 'html-to-image'
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip'
import { fetchVercelData, saveVercelStats } from '@/app/actions'
import type { Project, VercelData } from '@/app/types'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import type { DisplayOptions } from '@/app/types'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Text, Calendar } from 'lucide-react'

// Add this line to declare the environment variable
declare const process: { env: { NEXT_PUBLIC_VERCEL_API_TOKEN?: string } }

export function VercelReceiptForm() {
    const [userToken, setUserToken] = useState<string>(process.env.NEXT_PUBLIC_VERCEL_API_TOKEN || '')
    const [vercelData, setVercelData] = useState<VercelData | null>(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('vercelData')
            return savedData ? JSON.parse(savedData) : null
        }
        return null
    })
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('submitted') === 'true'
        }
        return false
    })
    const receiptRef = useRef<HTMLDivElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [transactionId, setTransactionId] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('transactionId') || ''
        }
        return ''
    })
    const [saveStats, setSaveStats] = useState(false)
    const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
        maxProjects: undefined,
        hideEmail: true,
        hideTeams: false,
        sortBy: 'deployments',
        sortOrder: 'asc'
    })

    useEffect(() => {
        if (userToken && !transactionId) {
            const newTransactionId = `TRX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            setTransactionId(newTransactionId)
            if (typeof window !== 'undefined') {
                localStorage.setItem('transactionId', newTransactionId)
            }
        }
    }, [userToken, transactionId])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('submitted', submitted.toString())
        }
    }, [submitted])

    useEffect(() => {
        if (vercelData && typeof window !== 'undefined') {
            localStorage.setItem('vercelData', JSON.stringify(vercelData))
        }
    }, [vercelData])

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

    // Calculate total failed deployments
    const totalFailedDeployments =
        vercelData?.projects.reduce((acc, project) => acc + (project.failedDeploymentsCount || 0), 0) ?? 0

    // Calculate failed deployment percentage
    const failedDeploymentPercentage =
        totalDeployments > 0 ? ((totalFailedDeployments / totalDeployments) * 100).toFixed(2) : '0.00'

    // Find the project with the most failed deployments
    const projectWithMostFailedDeployments = vercelData?.projects.length
        ? vercelData.projects.reduce((prev, current) =>
              (prev?.failedDeploymentsCount ?? 0) > (current?.failedDeploymentsCount ?? 0) ? prev : current
          )
        : null

    // Calculate the most active day of the week
    const dayCounts = vercelData?.projects.reduce(
        (acc, project) => {
            project.latestDeployments.forEach((deployment) => {
                const createdAtDate = new Date(deployment.createdAt)
                const day = format(createdAtDate, 'EEEE')
                acc[day] = (acc[day] || 0) + 1
            })
            return acc
        },
        {} as Record<string, number>
    )

    const mostActiveDay = dayCounts
        ? Object.entries(dayCounts).reduce((prev, current) => (current[1] > prev[1] ? current : prev))[0]
        : 'N/A'

    const getFilteredProjects = (projects: Project[]) => {
        let sortedProjects = [...projects]

        // Sort projects based on selected criteria
        console.log(displayOptions)
        switch (displayOptions.sortBy) {
            case 'name':
                sortedProjects.sort((a, b) => {
                    return displayOptions.sortOrder === 'asc'
                        ? a.name.localeCompare(b.name)
                        : b.name.localeCompare(a.name)
                })
                break
            case 'deployments':
                sortedProjects.sort((a, b) => {
                    const latestA = new Date(a.latestDeployments[0]?.createdAt || 0).getTime()
                    const latestB = new Date(b.latestDeployments[0]?.createdAt || 0).getTime()
                    return displayOptions.sortOrder === 'asc'
                        ? latestB - latestA // Newer first
                        : latestA - latestB // Older first
                })
                break
            case 'total':
                sortedProjects.sort((a, b) => {
                    return displayOptions.sortOrder === 'asc'
                        ? a.latestDeployments.length - b.latestDeployments.length
                        : b.latestDeployments.length - a.latestDeployments.length
                })
                break
        }

        if (!displayOptions.maxProjects) return sortedProjects

        const visibleProjects = sortedProjects.slice(0, displayOptions.maxProjects)
        const hiddenProjects = sortedProjects.slice(displayOptions.maxProjects)

        if (hiddenProjects.length === 0) return visibleProjects

        const totalHiddenDeployments = hiddenProjects.reduce(
            (acc, proj) => acc + (proj.latestDeployments?.length || 0),
            0
        )
        return [
            ...visibleProjects,
            {
                id: 'hidden-summary',
                name: `...and ${hiddenProjects.length} more projects (${totalHiddenDeployments} total deploys)`,
                latestDeployments: [],
                isSummary: true
            }
        ]
    }

    const clearReceipt = () => {
        setSubmitted(false)
        setVercelData(null)
        setTransactionId('')
        if (typeof window !== 'undefined') {
            localStorage.removeItem('submitted')
            localStorage.removeItem('vercelData')
            localStorage.removeItem('transactionId')
        }
    }

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

            <div className="mt-4 flex w-full items-center space-x-2">
                <form onSubmit={handleSubmit} className="flex w-full flex-grow space-x-2">
                    <div className="relative flex-grow">
                        <Input
                            type="text"
                            placeholder="Enter your Vercel API Token"
                            value={userToken}
                            onChange={(e) => setUserToken(e.target.value)}
                            className="w-full rounded-md border border-gray-800 bg-gray-900 pr-10 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
                    <Button
                        type="submit"
                        className="flex h-10 w-24 items-center justify-center rounded-md bg-white px-4 py-2 font-medium text-black transition-colors duration-200 hover:bg-gray-200"
                    >
                        {loading ? <Loader className="animate-spin" size={16} /> : 'Submit'}
                    </Button>
                </form>

                {submitted && (
                    <Button
                        onClick={downloadReceiptAsImage}
                        className="h-10 w-24 rounded-md bg-white px-4 py-2 font-medium text-black transition-colors duration-200 hover:bg-gray-200"
                    >
                        Download
                    </Button>
                )}
            </div>

            <div className="mt-4 flex w-full flex-col items-start space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="saveStats"
                        checked={saveStats}
                        onCheckedChange={(checked) => setSaveStats(!!checked)}
                        className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <label htmlFor="saveStats" className="cursor-pointer text-sm text-gray-300">
                        Save my stats to be shown on the public{' '}
                        {submitted ? (
                            <Link href="/leaderboard" className="underline">
                                leaderboard
                            </Link>
                        ) : (
                            'leaderboard'
                        )}
                    </label>
                </div>

                {submitted && (
                    <>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hideEmail"
                                checked={displayOptions.hideEmail}
                                onCheckedChange={(checked) =>
                                    setDisplayOptions((prev) => ({ ...prev, hideEmail: checked as boolean }))
                                }
                                className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                            />
                            <label htmlFor="hideEmail" className="cursor-pointer text-sm text-gray-300">
                                Hide email in receipt
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hideTeams"
                                checked={displayOptions.hideTeams}
                                onCheckedChange={(checked) =>
                                    setDisplayOptions((prev) => ({ ...prev, hideTeams: checked as boolean }))
                                }
                                className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                            />
                            <label htmlFor="hideTeams" className="cursor-pointer text-sm text-gray-300">
                                Hide teams section
                            </label>
                        </div>
                        <div className="flex w-full items-center justify-between space-x-4">
                            <div className="relative w-40">
                                <Input
                                    type="text"
                                    id="maxProjects"
                                    placeholder="Max projects"
                                    className="w-full rounded-md border border-gray-800 bg-gray-900 pr-10 text-white placeholder-gray-400"
                                    value={displayOptions.maxProjects || ''}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        if (!value || /^\d+$/.test(value)) {
                                            setDisplayOptions((prev) => ({
                                                ...prev,
                                                maxProjects: value ? parseInt(value) : undefined
                                            }))
                                        }
                                    }}
                                />
                                <div className="absolute inset-y-0 right-0 flex flex-col justify-center pr-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDisplayOptions((prev) => ({
                                                ...prev,
                                                maxProjects: Math.min(
                                                    (prev.maxProjects || 0) + 1,
                                                    vercelData?.projects?.length || 0
                                                )
                                            }))
                                        }
                                        className="text-white hover:text-gray-400"
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDisplayOptions((prev) => ({
                                                ...prev,
                                                maxProjects: Math.max((prev.maxProjects || 0) - 1, 0)
                                            }))
                                        }
                                        className="text-white hover:text-gray-400"
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                </div>
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" className="h-10 px-2 text-gray-400 hover:text-white">
                                        <ArrowUpDown size={16} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-44 bg-gray-900 p-1">
                                    <div className="space-y-1">
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
                                            onClick={() =>
                                                setDisplayOptions((prev) => ({
                                                    ...prev,
                                                    sortBy: 'name',
                                                    sortOrder: 'asc'
                                                }))
                                            }
                                        >
                                            Name A-Z
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
                                            onClick={() =>
                                                setDisplayOptions((prev) => ({
                                                    ...prev,
                                                    sortBy: 'total',
                                                    sortOrder: 'desc'
                                                }))
                                            }
                                        >
                                            Most deployments
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
                                            onClick={() =>
                                                setDisplayOptions((prev) => ({
                                                    ...prev,
                                                    sortBy: 'date',
                                                    sortOrder: 'desc'
                                                }))
                                            }
                                        >
                                            Latest deployments
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Button
                                onClick={clearReceipt}
                                className="h-10 w-24 rounded-md bg-red-500 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-red-600"
                            >
                                Clear
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {error && <p className="mt-2 text-red-500">{error}</p>}

            {submitted && (
                <ScrollArea className="mt-8 h-[500px] w-full max-w-[380px]">
                    {loading ? (
                        <p className="text-center text-white">Loading...</p>
                    ) : (
                        <div ref={receiptRef}>
                            <Card className="rounded-none border-none bg-white font-mono text-[11px] leading-tight shadow-lg">
                                <div className="space-y-4 p-6">
                                    <div className="space-y-1 text-center">
                                        <h1 className="text-xl font-bold tracking-tight">VERCEL RECEIPT</h1>
                                        {vercelData?.user.name && <p>Generated for: {vercelData?.user.name}</p>}
                                        {!displayOptions.hideEmail && <p>Email: {vercelData?.user.email}</p>}
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

                                        {vercelData &&
                                            getFilteredProjects(vercelData.projects).map((project) => (
                                                <div key={project.id} className="flex justify-between">
                                                    <span
                                                        className={'isSummary' in project ? 'w-full' : 'w-1/2 truncate'}
                                                    >
                                                        {project.name}
                                                    </span>
                                                    {!('isSummary' in project) && (
                                                        <span className="w-1/3 text-right">
                                                            {project.latestDeployments.length}
                                                        </span>
                                                    )}
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

                                        <div className="flex justify-between font-bold">
                                            <span>Total Failed Deployments</span>
                                            <span>
                                                {totalFailedDeployments} ({failedDeploymentPercentage}%)
                                            </span>
                                        </div>

                                        <div className="flex justify-between font-bold">
                                            <span>Most Failed Deployments</span>
                                            <span>
                                                {projectWithMostFailedDeployments?.name || 'N/A'} (
                                                {projectWithMostFailedDeployments?.failedDeploymentsCount || 0})
                                            </span>
                                        </div>

                                        <div className="flex justify-between font-bold">
                                            <span>Most Active Day</span>
                                            <span>{mostActiveDay}</span>
                                        </div>
                                    </div>

                                    {!displayOptions.hideTeams && (
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
                                    )}

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
            )}

            {/* Footer Section */}
            <footer className="mt-8 w-full text-center text-sm text-gray-400">
                <p>
                    Share your Verceipts on{' '}
                    <a
                        href="https://x.com/Nyaughh_/status/1860200737537667231"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                    >
                        Twitter
                    </a>
                </p>
                <p>
                    Support my work on{' '}
                    <a
                        href="https://github.com/sponsors/nyaughh"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                    >
                        GitHub
                    </a>
                </p>
            </footer>
        </div>
    )
}
