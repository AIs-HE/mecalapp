import supabaseAdmin from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const { data, error } = await supabaseAdmin.from('clients').select('id, name').order('name')
        if (error) throw error
        res.status(200).json({ clients: data || [] })
    } catch (err) {
        console.error('API /api/clients GET error', err)
        res.status(500).json({ error: err.message || String(err) })
    }
}
