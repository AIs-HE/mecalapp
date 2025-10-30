import supabaseAdmin from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabaseAdmin.from('projects').select('id, name, status, created_at, client_id')
            if (error) throw error
            res.status(200).json({ projects: data })
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
            res.status(201).json({ project: data })
        } catch (err) {
            console.error('API /api/projects POST error', err)
            res.status(500).json({ error: err.message || String(err) })
        }
        return
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
}
