import supabaseAdmin from '../../lib/supabaseAdmin'

export default async function handler(req, res) {
    // Defensive check: ensure server admin client is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error('API /api/clients: missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
        return res.status(500).json({ error: 'Server misconfiguration: missing Supabase admin credentials. Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local' })
    }
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
