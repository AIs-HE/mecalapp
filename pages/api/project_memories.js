import supabaseAdmin from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
    console.debug('/api/project_memories', req.method, req.query, req.body)
    if (req.method === 'POST') {
        try {
            const { project_id, memory_type, version = null } = req.body
            if (!project_id || !memory_type) return res.status(400).json({ error: 'project_id and memory_type are required' })

            // DB columns (based on CSV/backend_ref) are: memory_type, version, status, created_by, timestamps
            // Avoid inserting `title` because the DB may not have that column. Insert a minimal payload.
            const payload = {
                project_id,
                memory_type: memory_type,
                version,
                status: 'open'
            }

            const { data, error } = await supabaseAdmin.from('project_memories').insert(payload).select().single()
            if (error) throw error
            // normalize type casing for client consistency
            const out = { ...data }
            // some DBs use `memory_type` column; prefer that and expose `type` and `memory_type` normalized
            const rawType = out.memory_type || out.type || ''
            out.type = String(rawType).toLowerCase().trim()
            out.memory_type = out.type
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
            const { project_id } = req.query
            if (!project_id) return res.status(400).json({ error: 'project_id query param required' })
            console.debug('Fetching project_memories for project_id=', project_id)
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
            // delete by the actual DB column `memory_type`
            const { error } = await supabaseAdmin.from('project_memories').delete().eq('project_id', project_id).eq('memory_type', memory_type)
            if (error) throw error
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
