import supabaseAdmin from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // fetch projects and include nested project_memories (ids) so we can compute counts server-side
            const { data, error } = await supabaseAdmin.from('projects').select('id, name, cost_center, status, created_at, client_id, project_memories(id)')
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
            const { name, client_id, cost_center = null, status = 'active' } = req.body
            if (!name || !client_id) return res.status(400).json({ error: 'name and client_id are required' })

            const insertPayload = { name, client_id, status }
            if (cost_center) insertPayload.cost_center = cost_center

            const { data, error } = await supabaseAdmin.from('projects').insert(insertPayload).select().single()
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

    if (req.method === 'PUT') {
        try {
            const { id, name, client_id, cost_center = null, status } = req.body
            if (!id) return res.status(400).json({ error: 'id is required' })
            const updatePayload = {}
            if (name) updatePayload.name = name
            if (client_id) updatePayload.client_id = client_id
            if (typeof cost_center !== 'undefined') updatePayload.cost_center = cost_center
            if (status) updatePayload.status = status

            const { data, error } = await supabaseAdmin.from('projects').update(updatePayload).eq('id', id).select().single()
            if (error) throw error
            // compute memories_count
            const { data: mems } = await supabaseAdmin.from('project_memories').select('id').eq('project_id', id)
            const project = { ...data, memories_count: Array.isArray(mems) ? mems.length : 0 }
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
            // delete project and cascade should remove related memories if DB set ON DELETE CASCADE; we'll attempt to delete memories first to be safe
            await supabaseAdmin.from('project_memories').delete().eq('project_id', id)
            const { error } = await supabaseAdmin.from('projects').delete().eq('id', id)
            if (error) throw error
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
