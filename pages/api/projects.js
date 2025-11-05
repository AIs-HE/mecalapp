import supabaseAdmin from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
    // Defensive check: ensure server admin client is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error('API /api/projects: missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
        return res.status(500).json({ error: 'Server misconfiguration: missing Supabase admin credentials. Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local' })
    }
    // small helpers used by multiple methods
    async function deriveUserId(req) {
        // Check Authorization header first (bearer token)
        const auth = req.headers?.authorization || req.headers?.Authorization || ''
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
            const token = auth.split(' ')[1]
            try {
                const { data, error } = await supabaseAdmin.auth.getUser(token)
                if (!error && data && data.user && data.user.id) return data.user.id
            } catch (e) { /* ignore */ }
        }
        // Check cookie 'sb-access-token' as a secondary source
        const cookies = req.headers?.cookie || ''
        const match = cookies.match(/sb-access-token=([^;\s]+)/)
        if (match) {
            try {
                const token = decodeURIComponent(match[1])
                const { data, error } = await supabaseAdmin.auth.getUser(token)
                if (!error && data && data.user && data.user.id) return data.user.id
            } catch (e) { /* ignore */ }
        }
        return null
    }

    function genRequestId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    }

    async function insertAudit({ table_name, record_id, action, user_id = null, changes = null, source = null, request_id = null }) {
        try {
            // non-blocking audit insert; use admin client so RLS is bypassed for the insert
            await supabaseAdmin.from('audit_logs').insert([{ table_name, record_id, action, user_id, changes, source, request_id }])
        } catch (e) {
            console.debug('Failed to write audit log', { table_name, record_id, action, err: e?.message || String(e) })
        }
    }

    if (req.method === 'GET') {
        try {
            // support fetching a single project by id for edit-prefill
            const { id } = req.query || {}
            if (id) {
                const { data: single, error: singleErr } = await supabaseAdmin.from('projects').select('id, name, cost_center, status, created_at, client_id').eq('id', id).single()
                if (singleErr) throw singleErr
                // compute memories_count for this project
                const { data: mems } = await supabaseAdmin.from('project_memories').select('id').eq('project_id', id)
                const project = { ...single, memories_count: Array.isArray(mems) ? mems.length : 0 }
                return res.status(200).json({ project })
            }

            // Support optional user-scoped fetch: prefer deriving the user id server-side
            // from an Authorization bearer token or cookie. For backward compatibility
            // we fall back to the `user_id` query param if no token is present, but
            // this is deprecated and will be removed in production.
            async function deriveUserId(req) {
                // Check Authorization header first (bearer token)
                const auth = req.headers?.authorization || req.headers?.Authorization || ''
                if (auth && auth.toLowerCase().startsWith('bearer ')) {
                    const token = auth.split(' ')[1]
                    try {
                        const { data, error } = await supabaseAdmin.auth.getUser(token)
                        if (!error && data && data.user && data.user.id) return data.user.id
                    } catch (e) { /* ignore */ }
                }
                // Check cookie 'sb-access-token' as a secondary source
                const cookies = req.headers?.cookie || ''
                const match = cookies.match(/sb-access-token=([^;\s]+)/)
                if (match) {
                    try {
                        const token = decodeURIComponent(match[1])
                        const { data, error } = await supabaseAdmin.auth.getUser(token)
                        if (!error && data && data.user && data.user.id) return data.user.id
                    } catch (e) { /* ignore */ }
                }
                return null
            }

            const derivedUserId = await deriveUserId(req)
            if (derivedUserId) {
                // fetch assignments for this user to discover memory_ids
                const { data: assigns, error: assignErr } = await supabaseAdmin.from('memory_assignments').select('memory_id').eq('user_id', derivedUserId)
                if (assignErr) throw assignErr
                const memoryIds = (assigns || []).map(a => a.memory_id).filter(Boolean)

                if (memoryIds.length === 0) {
                    return res.status(200).json({ projects: [] })
                }

                // fetch project_ids for these memories
                const { data: mems, error: memsErr } = await supabaseAdmin.from('project_memories').select('project_id').in('id', memoryIds)
                if (memsErr) throw memsErr
                const projectIds = Array.from(new Set((mems || []).map(m => m.project_id).filter(Boolean)))
                if (projectIds.length === 0) return res.status(200).json({ projects: [] })

                // fetch the projects limited to those ids and compute memory counts (for that project)
                const { data: projectsData, error: projErr } = await supabaseAdmin.from('projects').select('id, name, cost_center, status, created_at, client_id, project_memories(id)').in('id', projectIds)
                if (projErr) throw projErr
                const projects = (projectsData || []).map(p => ({
                    id: p.id,
                    name: p.name,
                    status: p.status,
                    created_at: p.created_at,
                    client_id: p.client_id,
                    cost_center: p.cost_center || null,
                    memories_count: Array.isArray(p.project_memories) ? p.project_memories.length : 0
                }))
                return res.status(200).json({ projects })
            }

            // fetch projects and include nested project_memories (ids) so we can compute counts server-side (admin full list)
            const { data, error } = await supabaseAdmin.from('projects').select('id, name, cost_center, status, created_at, client_id, project_memories(id)')
            if (error) throw error

            // map to a lighter shape and add memories_count
            const projects = (data || []).map(p => ({
                id: p.id,
                name: p.name,
                status: p.status,
                created_at: p.created_at,
                client_id: p.client_id,
                // include cost_center so the UI can display the provided HE-XXXX value
                cost_center: p.cost_center || null,
                memories_count: Array.isArray(p.project_memories) ? p.project_memories.length : 0
            }))

            res.status(200).json({ projects })
        } catch (err) {
            console.error('API /api/projects GET error', err)
            res.status(500).json({ error: err.message || String(err) })
        }
        return
    }

    if (req.method === 'POST') {
        try {
            const { name, client_id, cost_center = null, status = 'active' } = req.body
            if (!name || !client_id) return res.status(400).json({ error: 'name and client_id are required' })

            const insertPayload = { name, client_id, status }
            if (cost_center) insertPayload.cost_center = cost_center

            const { data, error } = await supabaseAdmin.from('projects').insert(insertPayload).select().single()
            if (error) throw error
            // include memories_count for consistency (new project has zero memories)
            const project = { ...data, memories_count: 0 }
            // audit: project created
            try {
                const reqId = genRequestId()
                const actor = await deriveUserId(req)
                await insertAudit({ table_name: 'projects', record_id: project.id, action: 'PROJECT_CREATED', user_id: actor, changes: JSON.stringify({ after: project }), source: 'api.projects', request_id: reqId })
            } catch (e) { console.debug('audit write error (projects POST)', e) }
            res.status(201).json({ project })
        } catch (err) {
            console.error('API /api/projects POST error', err)
            res.status(500).json({ error: err.message || String(err) })
        }
        return
    }

    if (req.method === 'PUT') {
        try {
            const { id, name, client_id, cost_center = null, status } = req.body
            if (!id) return res.status(400).json({ error: 'id is required' })
            const updatePayload = {}
            if (name) updatePayload.name = name
            if (client_id) updatePayload.client_id = client_id
            if (typeof cost_center !== 'undefined') updatePayload.cost_center = cost_center
            if (status) updatePayload.status = status

            // capture before state for audit
            const { data: beforeRow } = await supabaseAdmin.from('projects').select().eq('id', id).single()
            const { data, error } = await supabaseAdmin.from('projects').update(updatePayload).eq('id', id).select().single()
            if (error) throw error
            // compute memories_count
            const { data: mems } = await supabaseAdmin.from('project_memories').select('id').eq('project_id', id)
            const project = { ...data, memories_count: Array.isArray(mems) ? mems.length : 0 }
            // audit: project updated
            try {
                const reqId = genRequestId()
                const actor = await deriveUserId(req)
                await insertAudit({ table_name: 'projects', record_id: project.id, action: 'PROJECT_UPDATED', user_id: actor, changes: JSON.stringify({ before: beforeRow, after: project }), source: 'api.projects', request_id: reqId })
            } catch (e) { console.debug('audit write error (projects PUT)', e) }
            res.status(200).json({ project })
        } catch (err) {
            console.error('API /api/projects PUT error', err)
            res.status(500).json({ error: err.message || String(err) })
        }
        return
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.body
            if (!id) return res.status(400).json({ error: 'id is required' })
            // fetch before state for audit
            const { data: beforeProject } = await supabaseAdmin.from('projects').select().eq('id', id).single()
            // delete project and cascade should remove related memories if DB set ON DELETE CASCADE; we'll attempt to delete memories first to be safe
            await supabaseAdmin.from('project_memories').delete().eq('project_id', id)
            const { error } = await supabaseAdmin.from('projects').delete().eq('id', id)
            if (error) throw error
            // audit: project deleted
            try {
                const reqId = genRequestId()
                const actor = await deriveUserId(req)
                await insertAudit({ table_name: 'projects', record_id: id, action: 'PROJECT_DELETED', user_id: actor, changes: JSON.stringify({ before: beforeProject }), source: 'api.projects', request_id: reqId })
            } catch (e) { console.debug('audit write error (projects DELETE)', e) }
            res.status(200).json({ ok: true })
        } catch (err) {
            console.error('API /api/projects DELETE error', err)
            res.status(500).json({ error: err.message || String(err) })
        }
        return
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
}
