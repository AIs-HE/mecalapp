import supabaseAdmin from '../../../../lib/supabaseAdmin'

export default async function handler(req, res) {
    // Defensive check: ensure server admin client is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error('API /api/project_memories/[id]/metadata: missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
        return res.status(500).json({ error: 'Server misconfiguration: missing Supabase admin credentials.' })
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const { id } = req.query || {}
        if (!id) return res.status(400).json({ error: 'memory id required' })

        const { data, error } = await supabaseAdmin.from('project_memories').select('id, updated_at').eq('id', id).maybeSingle()
        if (error) {
            console.error('Supabase error fetching memory metadata', error)
            return res.status(500).json({ error: error.message || String(error) })
        }

        if (!data) return res.status(404).json({ error: 'memory not found' })

        return res.status(200).json({ updated_at: data.updated_at })
    } catch (err) {
        console.error('API /api/project_memories/[id]/metadata error', err)
        res.status(500).json({ error: String(err) })
    }
}
