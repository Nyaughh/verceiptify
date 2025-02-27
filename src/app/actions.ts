'use server'

import { headers } from 'next/headers'
import type { VercelData } from './types'
import { PrismaClient } from '@prisma/client'
import { Vercel } from '@vercel/sdk'

const prisma = new PrismaClient()

async function fetchProjects(vercelClient: Vercel) {
    const results = []
    let pagination = null

    do {
        const response = await vercelClient.projects.getProjects({
            limit: '100'
        })

        results.push(...response.projects)
        pagination = response.pagination
    } while (pagination?.next)

    // Get deployments for each project
    const projectsWithDeployments = await Promise.all(
        results.map(async (project) => {
            const deploymentsResponse = await vercelClient.deployments.getDeployments({
                projectId: project.id,
                limit: 100 // Adjust limit as needed
            })

            const failedCount = deploymentsResponse.deployments.filter((d) => d.state === 'ERROR').length

            return {
                ...project,
                latestDeployments: deploymentsResponse.deployments,
                failedDeploymentsCount: failedCount
            }
        })
    )

    return projectsWithDeployments
}

export async function fetchVercelData(userToken: string): Promise<VercelData> {
    console.log('Initializing Vercel client with token...')
    const vercelClient = new Vercel({
        bearerToken: userToken
    })

    try {
        console.log('Fetching Vercel data...')
        const [userData, projectsData, teamsData] = await Promise.all([
            vercelClient.user.getAuthUser({}),
            fetchProjects(vercelClient),
            vercelClient.teams.getTeams({})
        ])

        if (!userData?.user) {
            throw new Error('Failed to fetch user data')
        }

        console.log('Successfully fetched Vercel data')
        return {
            user: {
                uid: userData.user.id,
                email: userData.user.email,
                name: userData.user.name || userData.user.username,
                username: userData.user.username
            },
            projects: projectsData,
            teams: (teamsData.teams || []).map((team) => ({
                id: team.id,
                name: team.name || 'Unnamed Team'
            }))
        }
    } catch (error: any) {
        console.error('Error fetching Vercel data:', error)
        if (error?.response?.status === 401) {
            throw new Error('Invalid API token')
        }
        throw new Error(`Failed to fetch Vercel data: ${error?.message || 'Unknown error'}`)
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
