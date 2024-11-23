import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import VercelBackground from '@/components/ui/vercel-bg'
import { formatDistanceToNow } from 'date-fns'

const prisma = new PrismaClient()

async function getLeaderboardData() {
    const stats = await prisma.vercelStats.findMany({
        orderBy: {
            totalDeployments: 'desc'
        },
        take: 100
    })
    return stats
}

export default async function LeaderboardPage() {
    const stats = await getLeaderboardData()

    return (
        <VercelBackground>
            <main className="flex min-h-screen flex-col items-center p-4">
                <div className="w-full max-w-5xl">
                    <div className="mb-8 flex flex-col items-center justify-between sm:flex-row">
                        <h1
                            className="mb-8 text-4xl font-extrabold text-white"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                            Leaderboard
                        </h1>
                        <Link
                            href="/"
                            className="rounded-full bg-white/10 px-4 py-2 text-white transition-all hover:bg-white/20 hover:no-underline sm:mt-0"
                        >
                            Generate Your Receipt →
                        </Link>
                    </div>

                    <Card className="border border-white/20 bg-black/40 backdrop-blur-xl">
                        <div className="p-4 sm:p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10 text-left text-sm text-gray-300">
                                            <th className="pb-4 font-medium">Rank</th>
                                            <th className="pb-4 font-medium">Username</th>
                                            <th className="pb-4 font-medium">Projects</th>
                                            <th className="pb-4 font-medium">Deployments</th>
                                            <th className="hidden pb-4 font-medium sm:table-cell">Teams</th>
                                            <th className="hidden pb-4 font-medium sm:table-cell">
                                                Most Active Project
                                            </th>
                                            <th className="hidden pb-4 font-medium sm:table-cell">Last Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.map((stat, index) => (
                                            <tr
                                                key={stat.id}
                                                className={`text-sm text-white transition-colors ${index % 2 === 0 ? 'bg-white/[0.02]' : ''} hover:bg-white/[0.08]`}
                                            >
                                                <td className="py-3">
                                                    <span
                                                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${index < 3 ? 'bg-white/20' : 'text-gray-400'} `}
                                                    >
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td className="py-3 font-medium">{stat.username}</td>
                                                <td className="py-3">{stat.totalProjects}</td>
                                                <td className="py-3 font-medium">{stat.totalDeployments}</td>
                                                <td className="hidden py-3 sm:table-cell">{stat.totalTeams}</td>
                                                <td className="hidden max-w-[200px] truncate py-3 sm:table-cell">
                                                    {stat.mostActiveProject}
                                                </td>
                                                <td className="hidden py-3 text-gray-400 sm:table-cell">
                                                    {formatDistanceToNow(new Date(stat.updatedAt))} ago
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </VercelBackground>
    )
}
