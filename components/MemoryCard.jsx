import React, { useState, useRef, useEffect } from 'react'

export default function MemoryCard({ memory, isAdmin, onDelete = () => { } }) {
    const { name, version, created_at, updated_at } = memory || {}
    const [open, setOpen] = useState(false)
    const btnRef = useRef(null)
    const menuRef = useRef(null)

    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        function onDocClick(e) {
            if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        function onEsc(e) { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', onDocClick)
        document.addEventListener('touchstart', onDocClick)
        document.addEventListener('keydown', onEsc)
        return () => {
            document.removeEventListener('mousedown', onDocClick)
            document.removeEventListener('touchstart', onDocClick)
            document.removeEventListener('keydown', onEsc)
        }
    }, [])

    async function handleDelete(e) {
        e.stopPropagation()
        // Prevent duplicate invocations (sometimes UI events may fire twice)
        console.debug('MemoryCard.handleDelete START', { deleting, memory })
        if (deleting) {
            console.debug('MemoryCard.handleDelete: already deleting, returning early')
            return
        }
        setDeleting(true)
        setOpen(false)
        try {
            console.debug('MemoryCard.handleDelete: showing confirm')
            const confirmed = confirm('Delete this memory? This cannot be undone.')
            console.debug('MemoryCard.handleDelete: confirm returned', { confirmed })
            if (!confirmed) {
                console.debug('MemoryCard.handleDelete: user cancelled')
                setDeleting(false)
                return
            }

            const payload = {
                project_id: memory?.project_id || memory?.projectId || null,
                memory_type: (memory?.type || memory?.memory_type || '')
            }
            if (!payload.project_id || !payload.memory_type) throw new Error('Missing project_id or memory_type')
            console.debug('MemoryCard.handleDelete: calling API', { payload })
            const res = await fetch('/api/project_memories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            const j = await res.json()
            console.debug('MemoryCard.handleDelete: api response', { ok: res.ok, body: j })
            if (!res.ok) throw new Error(j.error || 'Failed to delete memory')
            onDelete && onDelete(memory)
        } catch (err) {
            console.error(err)
            alert(err.message || String(err))
        } finally {
            setDeleting(false)
            console.debug('MemoryCard.handleDelete FINALLY: deleting reset')
        }
    }

    return (
        <div className="bg-white rounded-lg p-3 shadow-sm memory-card" style={{ borderLeft: '4px solid var(--color-main)' }}>
            <div className="flex justify-between">
                <div>
                    <div className="text-sm font-bold">{name || 'Untitled memory'}</div>
                    <div className="text-xs text-gray-500">v{version || '—'}</div>
                </div>
                {isAdmin && (
                    <div style={{ position: 'relative' }}>
                        <button ref={btnRef} aria-haspopup="true" aria-expanded={open} aria-label="More" className="bg-transparent border-0 cursor-pointer" onClick={e => { e.stopPropagation(); setOpen(o => !o) }}>⋯</button>
                        {open && (
                            <div ref={menuRef} role="menu" aria-label="Memory actions" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', boxShadow: '0 10px 30px rgba(2,6,23,0.12)', borderRadius: 8, minWidth: 180 }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 6 }}>
                                    <button role="menuitem" onClick={handleDelete} className="w-full text-left px-4 py-2" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#dc2626' }} onMouseDown={e => e.preventDefault()}>
                                        <span style={{ width: 20, textAlign: 'center' }}>🗑</span>
                                        <span style={{ fontSize: '0.875rem', color: '#dc2626' }}>Delete memory</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="mt-2 text-sm text-gray-700">
                <div>Created: {created_at ? new Date(created_at).toLocaleDateString() : '—'}</div>
                <div>Updated: {updated_at ? new Date(updated_at).toLocaleDateString() : '—'}</div>
            </div>
        </div>
    )
}
