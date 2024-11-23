'use server'

import { headers } from 'next/headers'
import type { VercelData } from './types'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fetchProjects(userToken: string) {
    const results: any[] = []
    let url = 'https://api.vercel.com/v10/projects'

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

    // Get deployments for each project
    const projectsWithDeployments = await Promise.all(
        results.map(async (project) => {
            const { deployments, failedCount } = await getDeployments(userToken, project.id)
            return {
                ...project,
                latestDeployments: deployments,
                failedDeploymentsCount: failedCount
            }
        })
    )

    return projectsWithDeployments
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

interface VercelDeployment {
    aliasAssigned: {
        aliasError: { buildingAt: number } | null
        checksConclusion: 'succeeded' | 'failed' | 'skipped' | 'canceled'
        checksState: 'registered' | 'running' | 'completed'
        connectBuildsEnabled: boolean
        connectConfigurationId: string
    } | null
    created: number
    createdAt: number
    creator: object
    customEnvironment: object
    deleted?: number
    expiration?: number
    inspectorUrl: string | null
    isRollbackCandidate: boolean | null
    meta: object
    name: string
    passiveConnectConfigurationId: string
    projectSettings: object
    proposedExpiration?: number
    ready?: number
    readyState: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED' | 'DELETED'
    readySubstate: 'STAGED' | 'PROMOTED'
    softDeletedByRetention?: boolean
    source: 'api-trigger-git-deploy' | 'cli' | 'clone/repo' | 'git' | 'import' | 'import/repo' | 'redeploy'
    state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED' | 'DELETED'
    target: 'production' | 'staging' | null
    type: 'LAMBDAS'
    uid: string
    undeleted?: number
    url: string
}
export async function getDeployments(
    userToken: string,
    appId: string
): Promise<{ deployments: VercelDeployment[]; failedCount: number }> {
    let allDeployments: VercelDeployment[] = []
    let next = true
    let failedCount = 0

    while (next) {
        const response = await fetch(
            `https://api.vercel.com/v6/deployments?projectId=${appId}&limit=100&until=${next}`,
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                },
                method: 'GET'
            }
        )
        if (!response.ok) {
            throw new Error('Failed to fetch deployments')
        }

        const data = await response.json()
        allDeployments = [...allDeployments, ...data.deployments]

        // Count failed deployments
        failedCount += data.deployments.filter(
            (deployment: VercelDeployment) => deployment.readyState === 'ERROR'
        ).length
        
        next = data.pagination?.next || null;
        
    }

    return { deployments: allDeployments, failedCount }
}
