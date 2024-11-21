'use server'

import { headers } from 'next/headers'
import type { VercelData } from './types'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fetchProjects(userToken: string) {
    const results: any[] = []
    let url = 'https://api.vercel.com/v9/projects'

    while (true) {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })

        if (!response.ok) {
            throw new Error('Failed to fetch projects')
        }

        const data = await response.json()
        results.push(...data.projects)

        if (data.pagination.next === null) break
        url = `https://api.vercel.com/v9/projects?until=${data.pagination.next}`
    }

    return results
}

export async function fetchVercelData(userToken: string): Promise<VercelData> {
    const [userResponse, projectsData, teamsResponse] = await Promise.all([
        fetch('https://api.vercel.com/v1/user', {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        }),
        fetchProjects(userToken),
        fetch('https://api.vercel.com/v1/teams', {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
    ])

    if (!userResponse.ok) {
        throw new Error('Invalid API token')
    }

    if (!teamsResponse.ok) {
        throw new Error('Failed to fetch teams')
    }

    const userData = await userResponse.json()
    const teamsData = await teamsResponse.json()

    return {
        user: userData.user,
        projects: projectsData,
        teams: teamsData.teams || []
    }
}

export async function saveVercelStats(stats: {
    email: string
    username: string
    totalProjects: number
    totalDeployments: number
    totalTeams: number
    mostActiveProject: string
}) {
    try {
        await prisma.vercelStats.upsert({
            where: {
                email: stats.email
            },
            update: {
                username: stats.username,
                totalProjects: stats.totalProjects,
                totalDeployments: stats.totalDeployments,
                totalTeams: stats.totalTeams,
                mostActiveProject: stats.mostActiveProject
            },
            create: stats
        })
    } catch (error) {
        console.error('Error saving stats:', error)
        throw new Error('Failed to save stats')
    }
}
