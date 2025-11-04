import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'

export default function AssignMemoryModal({ open = false, memory = null, onClose = () => { }, onAssigned = () => { } }) {
    const [profiles, setProfiles] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!open) return
        async function load() {
            setLoading(true)
            try {
                const res = await fetch('/api/profiles')
                const j = await res.json()
                if (res.ok) {
                    setProfiles(j.profiles || [])
                    if ((j.profiles || []).length > 0) setSelectedUser((j.profiles || [])[0].id)
                } else {
                    console.error('Failed to load profiles', j)
                }
            } catch (err) {
                console.error('Failed to load profiles', err)
            }
            setLoading(false)
        }
        load()
    }, [open])

    async function handleAssign(e) {
        e.preventDefault()
        if (!memory || !memory.id) return alert('Missing memory')
        if (!selectedUser) return alert('Choose a user')
        setSaving(true)
        try {
            // try to get current user id to set assigned_by (best-effort)
            let assigned_by = null
            try {
                const sess = await supabase.auth.getSession()
                assigned_by = sess?.data?.session?.user?.id || null
            } catch (e) { /* ignore */ }

            const res = await fetch('/api/memory_assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memory_id: memory.id, user_id: selectedUser, assigned_by })
            })
            const j = await res.json()
            if (!res.ok) throw new Error(j.error || 'Failed to assign')
            onAssigned && onAssigned(j.assignment)
            onClose()
        } catch (err) {
            console.error('Assign error', err)
            alert(err.message || String(err))
        }
        setSaving(false)
    }

    if (!open) return null

    return (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
            <div className="projects-panel" style={{ width: 'min(520px,96%)', maxHeight: '85vh', overflow: 'hidden', padding: 16, backgroundColor: 'rgba(243,244,246,1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Assign memory</h3>
                    <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: '0', fontSize: 20 }}>✕</button>
                </div>

                <form onSubmit={handleAssign}>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', marginBottom: 6 }}>Memory</label>
                        <div style={{ fontWeight: 600 }}>{memory?.name || memory?.type || memory?.memory_type || 'Unnamed'}</div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', marginBottom: 6 }}>Assign to</label>
                        {loading ? (
                            <div>Loading users…</div>
                        ) : (
                            <select value={selectedUser || ''} onChange={e => setSelectedUser(e.target.value)} style={{ width: '100%', padding: '8px 10px' }}>
                                {(profiles || []).map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name} {p.role ? `(${p.role})` : ''}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn">Cancel</button>
                        <button type="submit" disabled={saving} className="btn btn-primary">Assign</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
