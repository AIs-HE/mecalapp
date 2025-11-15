export interface UserInfo {
    id: string | number
    full_name?: string
    email?: string
}

export interface ProjectInfo {
    id: string | number
    name: string
    description?: string
}

export interface MemoryInfo {
    id: string | number
    name?: string
    version?: string | number
    type?: string
    memory_type?: string
    project_id?: string | number
    created_at?: string
    updated_at?: string
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
