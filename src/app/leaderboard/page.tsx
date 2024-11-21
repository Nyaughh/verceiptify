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
                    <div className="mb-8 flex flex-col items-center justify-between sm:flex-row">
                        <h1 className="text-2xl font-extrabold text-white sm:text-4xl">Verceipts Leaderboard</h1>
                        <Link href="/" className="mt-4 text-white hover:underline sm:mt-0">
                            Generate Your Receipt
                        </Link>
                    </div>

                    <Card className="border border-white/100 bg-white/10 backdrop-blur">
                        <div className="p-4 sm:p-6">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-gray-300">
                                        <th className="pb-2 sm:pb-4">Rank</th>
                                        <th className="pb-2 sm:pb-4">Username</th>
                                        <th className="hidden pb-2 sm:table-cell sm:pb-4">Projects</th>
                                        <th className="hidden pb-2 sm:table-cell sm:pb-4">Deployments</th>
                                        <th className="hidden pb-2 sm:table-cell sm:pb-4">Teams</th>
                                        <th className="hidden pb-2 sm:table-cell sm:pb-4">Most Active Project</th>
                                        <th className="hidden pb-2 sm:table-cell sm:pb-4">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.map((stat, index) => (
                                        <tr key={stat.id} className="text-white">
                                            <td className="py-2">{index + 1}</td>
                                            <td className="py-2">{stat.username}</td>
                                            <td className="hidden py-2 sm:table-cell">{stat.totalProjects}</td>
                                            <td className="hidden py-2 sm:table-cell">{stat.totalDeployments}</td>
                                            <td className="hidden py-2 sm:table-cell">{stat.totalTeams}</td>
                                            <td className="hidden py-2 sm:table-cell">{stat.mostActiveProject}</td>
                                            <td className="hidden py-2 sm:table-cell">
                                                {formatDistanceToNow(new Date(stat.updatedAt))} ago
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
