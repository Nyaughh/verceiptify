export interface User {
    uid: string
    email: string
    name: string
    username: string
}

export interface Project {
    id: string
    name: string
    latestDeployments: any[]
    totalDeployments?: number
}

export interface Team {
    id: string
    name: string
}

export interface VercelData {
    user: User
    projects: Project[]
    teams: Team[]
}

export interface DisplayOptions {
    maxProjects?: number
    hideEmail: boolean
}
