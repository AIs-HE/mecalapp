const STORAGE_KEYS = {
    PROJECTS: 'mecalapp_projects',
    MEMORIES_PREFIX: 'mecalapp_memories_',
    OPS_QUEUE: 'mecalapp_ops_queue'
}

function readJSON(key) {
    try {
        const s = localStorage.getItem(key)
        return s ? JSON.parse(s) : null
    } catch (e) {
        console.error('cache.readJSON error', e)
        return null
    }
}

function writeJSON(key, v) {
    try {
        localStorage.setItem(key, JSON.stringify(v))
    } catch (e) {
        console.error('cache.writeJSON error', e)
    }
}

export function getProjects() {
    return readJSON(STORAGE_KEYS.PROJECTS) || null
}

export function setProjects(projects) {
    writeJSON(STORAGE_KEYS.PROJECTS, projects)
}

export function getProjectMemories(projectId) {
    if (!projectId) return null
    return readJSON(STORAGE_KEYS.MEMORIES_PREFIX + projectId) || null
}

export function setProjectMemories(projectId, memories) {
    if (!projectId) return
    writeJSON(STORAGE_KEYS.MEMORIES_PREFIX + projectId, memories)
}

export function enqueueOp(op) {
    // op: { type: 'create_memory'|'delete_memory'|'create_project'|'update_project', payload: {...}, tmpId?: string }
    const q = readJSON(STORAGE_KEYS.OPS_QUEUE) || []
    q.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, created_at: new Date().toISOString(), op })
    writeJSON(STORAGE_KEYS.OPS_QUEUE, q)
    return q
}

export function getQueue() {
    return readJSON(STORAGE_KEYS.OPS_QUEUE) || []
}

export function clearQueue() {
    writeJSON(STORAGE_KEYS.OPS_QUEUE, [])
}

let syncing = false

export async function syncQueue({ onProgress } = {}) {
    if (syncing) return { ok: false, reason: 'already-syncing' }
    syncing = true
    try {
        const q = getQueue()
        const remaining = []
        for (let i = 0; i < q.length; i++) {
            const item = q[i]
            const { op } = item
            try {
                if (op.type === 'create_memory') {
                    const res = await fetch('/api/project_memories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: op.payload.project_id, memory_type: op.payload.memory_type }) })
                    const j = await res.json()
                    if (!res.ok) throw new Error(j.error || 'create_memory failed')
                } else if (op.type === 'delete_memory') {
                    const res = await fetch('/api/project_memories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: op.payload.project_id, memory_type: op.payload.memory_type }) })
                    const j = await res.json()
                    if (!res.ok) throw new Error(j.error || 'delete_memory failed')
                } else if (op.type === 'create_project') {
                    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op.payload) })
                    const j = await res.json()
                    if (!res.ok) throw new Error(j.error || 'create_project failed')
                } else if (op.type === 'update_project') {
                    const res = await fetch('/api/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op.payload) })
                    const j = await res.json()
                    if (!res.ok) throw new Error(j.error || 'update_project failed')
                } else {
                    console.warn('Unknown op type', op.type)
                }
                onProgress && onProgress({ id: item.id, status: 'ok', op })
            } catch (e) {
                console.error('syncQueue op failed', item, e)
                remaining.push(item)
                onProgress && onProgress({ id: item.id, status: 'failed', error: String(e), op })
            }
        }
        writeJSON(STORAGE_KEYS.OPS_QUEUE, remaining)
        syncing = false
        return { ok: true, remaining }
    } catch (err) {
        syncing = false
        console.error('syncQueue error', err)
        return { ok: false, error: String(err) }
    }
}

export function isSyncing() { return syncing }

export default {
    getProjects,
    setProjects,
    getProjectMemories,
    setProjectMemories,
    enqueueOp,
    getQueue,
    clearQueue,
    syncQueue,
    isSyncing
}
