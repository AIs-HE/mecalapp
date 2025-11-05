import supabaseAdmin from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
    // Defensive check
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error('API /api/memory_assignments: missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
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

    try {
        if (req.method === 'POST') {
            const { memory_id, user_id } = req.body || {}
            if (!memory_id || !user_id) return res.status(400).json({ error: 'memory_id and user_id are required' })

            // require an authenticated actor to set assigned_by (prevent spoofing)
            const derivedActingUser = await deriveUserId(req)
            if (!derivedActingUser) {
                return res.status(401).json({ error: 'Authorization required to assign memory. Include a Bearer token or sb-access-token cookie.' })
            }
            const assigned_by = derivedActingUser

            const payload = { memory_id, user_id, assigned_by }

            // Ensure a memory has at most one assignment. If an assignment already exists for this memory,
            // update it to point to the new user. Otherwise insert a new assignment.
            let assignment = null
            try {
                // fetch any existing assignments for this memory (there should be at most one, but handle duplicates)
                const { data: existingList, error: listErr } = await supabaseAdmin.from('memory_assignments').select('id, memory_id, user_id, assigned_at, assigned_by').eq('memory_id', memory_id).order('assigned_at', { ascending: false })
                if (listErr) {
                    console.error('API /api/memory_assignments POST check existing error', listErr)
                    return res.status(500).json({ error: listErr.message || String(listErr), details: listErr })
                }

                const existing = (existingList && existingList.length > 0) ? existingList[0] : null
                if (existing && existing.id) {
                    // update the existing (most-recent) row
                    const { data: updated, error: updateErr } = await supabaseAdmin.from('memory_assignments').update({ user_id, assigned_by }).eq('id', existing.id).select('id,memory_id,user_id,assigned_at,assigned_by').single()
                    if (updateErr) {
                        console.error('API /api/memory_assignments POST update error', updateErr)
                        return res.status(500).json({ error: updateErr.message || String(updateErr), details: updateErr })
                    }
                    assignment = updated

                    // If there are duplicate older assignments, remove them to enforce one-assignment-per-memory
                    if (existingList.length > 1) {
                        const duplicateIds = existingList.slice(1).map(r => r.id).filter(Boolean)
                        try {
                            await supabaseAdmin.from('memory_assignments').delete().in('id', duplicateIds)
                        } catch (e) {
                            console.debug('Failed to clean duplicate memory_assignments', e)
                        }
                    }

                } else {
                    // create the assignment
                    const { data: created, error: insertErr } = await supabaseAdmin.from('memory_assignments').insert(payload).select('id,memory_id,user_id,assigned_at,assigned_by').single()
                    if (insertErr) {
                        console.error('API /api/memory_assignments POST insert error', insertErr)
                        return res.status(500).json({ error: insertErr.message || String(insertErr), details: insertErr })
                    }
                    assignment = created

                }
            } catch (e) {
                console.error('API /api/memory_assignments POST unexpected error', e)
                return res.status(500).json({ error: e.message || String(e) })
            }

            // fetch the assigned user's profile (avoid ambiguous embedded relationship names)
            let userProfile = null
            try {
                const { data: p } = await supabaseAdmin.from('profiles').select('full_name').eq('id', user_id).single()
                userProfile = p || null
            } catch (e) {
                console.debug('Could not fetch user profile after assignment', e)
            }

            return res.status(200).json({ assignment: { ...assignment, user: userProfile } })
        }

        if (req.method === 'DELETE') {
            const { id, memory_id, user_id } = req.body || {}
            if (!id && !(memory_id && user_id)) return res.status(400).json({ error: 'id or (memory_id and user_id) required' })

            // capture rows to be deleted for audit
            let fetchQ = supabaseAdmin.from('memory_assignments').select('id,memory_id,user_id,assigned_at,assigned_by')
            if (id) fetchQ = fetchQ.eq('id', id)
            else fetchQ = fetchQ.eq('memory_id', memory_id).eq('user_id', user_id)
            const { data: rowsToDelete, error: fetchErr } = await fetchQ
            if (fetchErr) return res.status(500).json({ error: fetchErr.message || String(fetchErr) })

            let q = supabaseAdmin.from('memory_assignments').delete()
            if (id) q = q.eq('id', id)
            else q = q.eq('memory_id', memory_id).eq('user_id', user_id)

            const { error } = await q
            if (error) throw error

            // note: audit for memory_assignments is performed by the DB trigger (trigger.memory_assignments)
            // to avoid duplicate rows we do not insert API-level audit entries here.

            return res.status(200).json({ ok: true })
        }

        if (req.method === 'GET') {
            // optional query params: memory_id or user_id
            const { memory_id } = req.query || {}
            // derive user id server-side if a caller wants their assignments
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

            const user_id = await deriveUserId(req)
            // fetch assignments
            let q = supabaseAdmin.from('memory_assignments').select('id,memory_id,user_id,assigned_at,assigned_by')
            if (memory_id) q = q.eq('memory_id', memory_id)
            if (user_id) q = q.eq('user_id', user_id)
            const { data, error } = await q
            if (error) throw error

            // fetch profiles for the returned user_ids to attach full_name (avoid ambiguous embed)
            const assignments = data || []
            const userIds = Array.from(new Set(assignments.map(a => a.user_id).filter(Boolean)))
            let profilesMap = {}
            if (userIds.length > 0) {
                try {
                    const { data: profiles } = await supabaseAdmin.from('profiles').select('id,full_name').in('id', userIds)
                    profilesMap = (profiles || []).reduce((m, p) => { m[p.id] = p; return m }, {})
                } catch (e) {
                    console.debug('Could not fetch profiles for assignments', e)
                }
            }

            const enriched = assignments.map(a => ({ ...a, user: profilesMap[a.user_id] || null }))
            return res.status(200).json({ assignments: enriched })
        }
    } catch (err) {
        console.error('API /api/memory_assignments error', err)
        return res.status(500).json({ error: err.message || String(err) })
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
}
