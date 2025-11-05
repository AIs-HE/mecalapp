import supabaseAdmin from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
    // Defensive check: ensure server admin client is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error('API /api/project_memories: missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
        return res.status(500).json({ error: 'Server misconfiguration: missing Supabase admin credentials. Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local' })
    }

    // helpers
    async function deriveUserId(req) {
        const auth = req.headers?.authorization || req.headers?.Authorization || ''
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
            const token = auth.split(' ')[1]
            try {
                const { data, error } = await supabaseAdmin.auth.getUser(token)
                if (!error && data && data.user && data.user.id) return data.user.id
            } catch (e) { /* ignore */ }
        }
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

    function genRequestId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}` }

    async function insertAudit({ table_name, record_id, action, user_id = null, changes = null, source = null, request_id = null }) {
        try {
            await supabaseAdmin.from('audit_logs').insert([{ table_name, record_id, action, user_id, changes, source, request_id }])
        } catch (e) { console.debug('Failed to write audit log', e) }
    }

    console.debug('/api/project_memories', req.method, req.query, req.body)
    if (req.method === 'POST') {
        try {
            // prefer an explicit version; some DBs enforce NOT NULL on `version` so default to '1.0' when absent
            const { project_id, memory_type } = req.body
            let version = req.body.version ?? undefined
            if (!project_id || !memory_type) return res.status(400).json({ error: 'project_id and memory_type are required' })
            if (!version) version = '1.0'

            // DB columns (based on CSV/backend_ref) are: memory_type, version, status, created_by, timestamps
            // Avoid inserting `title` because the DB may not have that column. Insert a minimal payload.
            const payload = {
                project_id,
                memory_type: memory_type,
                version,
                // align with seeded fixtures / DB check-constraint which use 'draft'|'in_progress'|'completed'
                // use 'draft' as a safe initial status for newly created memories
                status: 'draft'
            }

            console.debug('API /api/project_memories POST payload', { payload })

            const { data, error } = await supabaseAdmin.from('project_memories').insert(payload).select().single()
            if (error) throw error
            // normalize type casing for client consistency
            const out = { ...data }
            // some DBs use `memory_type` column; prefer that and expose `type` and `memory_type` normalized
            const rawType = out.memory_type || out.type || ''
            out.type = String(rawType).toLowerCase().trim()
            out.memory_type = out.type
            // audit: memory created
            try {
                const reqId = genRequestId()
                const actor = await deriveUserId(req)
                await insertAudit({ table_name: 'project_memories', record_id: out.id, action: 'MEMORY_CREATED', user_id: actor, changes: JSON.stringify({ after: out }), source: 'api.project_memories', request_id: reqId })
            } catch (e) { console.debug('audit write error (project_memories POST)', e) }
            res.status(201).json({ memory: out })
        } catch (err) {
            console.error('API /api/project_memories POST error', err)
            // Return error details in dev for debugging
            res.status(500).json({ error: err.message || String(err), stack: err.stack })
        }
        return
    }

    if (req.method === 'GET') {
        try {
            const { project_id } = req.query || {}
            if (!project_id) return res.status(400).json({ error: 'project_id query param required' })

            // Prefer deriving the requesting user's id server-side from an Authorization
            // header or auth cookie. Fallback to the deprecated `user_id` query param if present.
            async function deriveUserId(req) {
                const auth = req.headers?.authorization || req.headers?.Authorization || ''
                if (auth && auth.toLowerCase().startsWith('bearer ')) {
                    const token = auth.split(' ')[1]
                    try {
                        const { data, error } = await supabaseAdmin.auth.getUser(token)
                        if (!error && data && data.user && data.user.id) return data.user.id
                    } catch (e) { /* ignore */ }
                }
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
            console.debug('Fetching project_memories for project_id=', project_id, 'derivedUserId=', derivedUserId)

            // If a derivedUserId is present, return only memories assigned to that user for this project
            if (derivedUserId) {
                // fetch assignments for this user for the project
                const { data: assigns, error: assignErr } = await supabaseAdmin.from('memory_assignments').select('memory_id').eq('user_id', derivedUserId)
                if (assignErr) {
                    console.error('Supabase error fetching assignments for user', assignErr)
                    return res.status(500).json({ error: assignErr.message || String(assignErr), details: assignErr })
                }
                const memoryIds = (assigns || []).map(a => a.memory_id).filter(Boolean)
                if (memoryIds.length === 0) return res.status(200).json({ memories: [] })

                // select the columns present in the CSV/schema: memory_type, version, status, timestamps
                const { data, error } = await supabaseAdmin.from('project_memories').select('id,project_id,memory_type,version,status,created_at,updated_at,created_by').in('id', memoryIds).eq('project_id', project_id)
                if (error) {
                    console.error('Supabase error fetching project_memories filtered by user', error)
                    return res.status(500).json({ error: error.message || String(error), details: error })
                }

                // normalize types and add memory_type for compatibility with older clients
                const normalized = (data || []).map(m => {
                    const raw = m.type || m.memory_type || ''
                    const t = String(raw || '').toLowerCase().trim()
                    return { ...m, type: t, memory_type: t }
                })
                return res.status(200).json({ memories: normalized })
            }

            // default: no user filter, return all memories for the project
            // select the columns present in the CSV/schema: memory_type, version, status, timestamps
            const { data, error } = await supabaseAdmin.from('project_memories').select('id,project_id,memory_type,version,status,created_at,updated_at,created_by').eq('project_id', project_id)
            if (error) {
                console.error('Supabase error fetching project_memories', error)
                return res.status(500).json({ error: error.message || String(error), details: error })
            }
            // normalize types and add memory_type for compatibility with older clients
            const normalized = (data || []).map(m => {
                // if the row came back with alias `type`, use it; otherwise fall back to memory_type
                const raw = m.type || m.memory_type || ''
                const t = String(raw || '').toLowerCase().trim()
                return { ...m, type: t, memory_type: t }
            })
            res.status(200).json({ memories: normalized })
        } catch (err) {
            console.error('API /api/project_memories GET error', err)
            res.status(500).json({ error: err.message || String(err), stack: err.stack })
        }
        return
    }

    if (req.method === 'DELETE') {
        try {
            const { project_id, memory_type } = req.body
            if (!project_id || !memory_type) return res.status(400).json({ error: 'project_id and memory_type are required' })
            // fetch before state (the rows we'll delete) for audit
            const { data: beforeRows } = await supabaseAdmin.from('project_memories').select().eq('project_id', project_id).eq('memory_type', memory_type)
            // delete by the actual DB column `memory_type`
            const { error } = await supabaseAdmin.from('project_memories').delete().eq('project_id', project_id).eq('memory_type', memory_type)
            if (error) throw error
            // audit: memory deleted (may be multiple rows in edge cases)
            try {
                const reqId = genRequestId()
                const actor = await deriveUserId(req)
                // insert an audit entry per deleted row for clarity
                if (Array.isArray(beforeRows) && beforeRows.length > 0) {
                    for (const r of beforeRows) {
                        await insertAudit({ table_name: 'project_memories', record_id: r.id, action: 'MEMORY_DELETED', user_id: actor, changes: JSON.stringify({ before: r }), source: 'api.project_memories', request_id: reqId })
                    }
                }
            } catch (e) { console.debug('audit write error (project_memories DELETE)', e) }
            res.status(200).json({ ok: true })
        } catch (err) {
            console.error('API /api/project_memories DELETE error', err)
            res.status(500).json({ error: err.message || String(err), stack: err.stack })
        }
        return
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
}
