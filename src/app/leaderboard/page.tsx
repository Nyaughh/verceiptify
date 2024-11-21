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
                <div className="w-full max-w-4xl">
                    <div className="mb-8 flex items-center justify-between">
                        <h1 className="text-4xl font-extrabold text-white">Verceipts Leaderboard</h1>
                        <Link href="/" className="text-white hover:underline">
                            Generate Your Receipt
                        </Link>
                    </div>

                    <Card className="bg-white/10 backdrop-blur">
                        <div className="p-6">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-gray-300">
                                        <th className="pb-4">Rank</th>
                                        <th className="pb-4">Username</th>
                                        <th className="pb-4">Projects</th>
                                        <th className="pb-4">Deployments</th>
                                        <th className="pb-4">Teams</th>
                                        <th className="pb-4">Most Active Project</th>
                                        <th className="pb-4">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.map((stat, index) => (
                                        <tr key={stat.id} className="text-white">
                                            <td className="py-2">{index + 1}</td>
                                            <td className="py-2">{stat.username}</td>
                                            <td className="py-2">{stat.totalProjects}</td>
                                            <td className="py-2">{stat.totalDeployments}</td>
                                            <td className="py-2">{stat.totalTeams}</td>
                                            <td className="max-w-xs truncate py-2">{stat.mostActiveProject}</td>
                                            <td className="py-2 text-sm text-gray-400">
                                                {formatDistanceToNow(stat.updatedAt, { addSuffix: true })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </main>
        </VercelBackground>
    )
}
