import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../../lib/supabaseClient'
import { UserInfo, ProjectInfo, MemoryInfo } from '../../types/interfaces'

type Payload = {
    user: Partial<UserInfo> | null
    profile: Partial<UserInfo> | null
    memory: Partial<MemoryInfo> | null
    project: Partial<ProjectInfo & Record<string, any>> | null
    requested_at: string
}

export default function CalcTypePage(): JSX.Element {
    const router = useRouter()
    const { type } = router.query as { type?: string }
    const [loading, setLoading] = useState<boolean>(true)
    const [payload, setPayload] = useState<Payload | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!router.isReady) return
        let mounted = true
            ; (async () => {
                setLoading(true)
                try {
                    const q = router.query || {}
                    const memoryId = (q.memory_id || q.memoryId || null) as string | null
                    const projectId = (q.project_id || q.projectId || null) as string | null

                    const { data: sessionData } = await supabase.auth.getSession()
                    const session = sessionData?.session || null
                    const user = session?.user || null

                    let profile: any = null
                    if (user) {
                        try {
                            const { data: profData, error: profErr } = await supabase.from('profiles').select('id,full_name,role').eq('id', user.id).single()
                            if (!profErr) profile = profData
                        } catch (e) { /* ignore */ }
                    }

                    let memory: any = null
                    if (memoryId) {
                        try {
                            const { data: m, error: merr } = await supabase.from('project_memories').select('id,project_id,memory_type,version,status,created_by,created_at,updated_at').eq('id', memoryId).single()
                            if (!merr) memory = { ...m, type: (m.type || m.memory_type || '').toString().toLowerCase() }
                        } catch (e) { /* ignore */ }
                    }

                    if (!memory && projectId) {
                        try {
                            const res = await fetch(`/api/project_memories?project_id=${encodeURIComponent(projectId)}`)
                            const j = await res.json()
                            if (res.ok && Array.isArray(j.memories)) {
                                const found = j.memories.find((m: any) => (m.id === memoryId) || (String((m.type || m.memory_type || '')).toLowerCase() === String(type).toLowerCase()))
                                if (found) memory = found
                            }
                        } catch (e) { /* ignore */ }
                    }

                    let project: any = null
                    const pid = projectId || (memory && memory.project_id) || null
                    if (pid) {
                        try {
                            const res = await fetch(`/api/projects?id=${encodeURIComponent(pid)}`)
                            const j = await res.json()
                            if (res.ok) project = j.project || null
                        } catch (e) { /* ignore */ }
                    }

                    const out: Payload = {
                        user: user ? { id: user.id, email: user.email } : null,
                        profile: profile ? { id: profile.id, full_name: profile.full_name, role: profile.role } : null,
                        memory: memory || (type ? { type, note: 'No memory found - this is a dummy calculation page.' } : null),
                        project: project ? { id: project.id, name: project.name, cost_center: project.cost_center || null } : null,
                        requested_at: new Date().toISOString()
                    }

                    if (mounted) setPayload(out)
                } catch (err: any) {
                    console.error('Calc page load error', err)
                    if (mounted) setError(String(err))
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [router.isReady, router.query, type])

    if (loading) return <div style={{ padding: 20 }}>Loading calculation page…</div>
    if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>

    return (
        <div style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>Calculation: {type || 'unknown'}</h2>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#111827', color: '#d1d5db', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
                {JSON.stringify(payload, null, 2)}
            </pre>
            <div style={{ marginTop: 12, color: '#6b7280' }}>This is a dummy calculation page that shows the base context expected by calculation modules (current user/profile, memory, and project).</div>
        </div>
    )
}
