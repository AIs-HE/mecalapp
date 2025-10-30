import supabaseAdmin from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // fetch projects and include nested project_memories (ids) so we can compute counts server-side
            const { data, error } = await supabaseAdmin.from('projects').select('id, name, status, created_at, client_id, project_memories(id)')
            if (error) throw error

            // map to a lighter shape and add memories_count
            const projects = (data || []).map(p => ({
                id: p.id,
                name: p.name,
                status: p.status,
                created_at: p.created_at,
                client_id: p.client_id,
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
            const { name, client_id, status = 'active' } = req.body
            if (!name || !client_id) return res.status(400).json({ error: 'name and client_id are required' })

            const { data, error } = await supabaseAdmin.from('projects').insert({ name, client_id, status }).select().single()
            if (error) throw error
            // include memories_count for consistency (new project has zero memories)
            const project = { ...data, memories_count: 0 }
            res.status(201).json({ project })
        } catch (err) {
            console.error('API /api/projects POST error', err)
            res.status(500).json({ error: err.message || String(err) })
        }
        return
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
}
