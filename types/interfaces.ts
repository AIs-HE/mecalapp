export interface UserInfo {
    id: string | number
    full_name?: string
    email?: string
    role?: string
}

export interface ProjectInfo {
    id?: string | number
    name?: string
    cost_center?: string
    costCenter?: string
    projectName?: string
    client_id?: string | number
    client?: string
    version?: number
    companyLogo?: string
    lastModified?: string
    memories_count?: number
    memoriesCount?: number
    [k: string]: any
}

export interface MemoryInfo {
    id: string | number
    name?: string
    version?: string | number
    type?: string
    memory_type?: string
    project_id?: string | number
    projectId?: string | number
    created_at?: string
    updated_at?: string
    status?: string
    created_by?: string | number
    [k: string]: any
}

export interface CalcInputs {
    voltage?: number
    current?: number
    length?: number
    conductor?: string
}

export default interface TypesBundle {
    UserInfo: UserInfo
    ProjectInfo: ProjectInfo
    MemoryInfo: MemoryInfo
    CalcInputs: CalcInputs
}
