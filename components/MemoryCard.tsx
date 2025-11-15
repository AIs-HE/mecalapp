import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import AssignMemoryModal from './AssignMemoryModal'
import memoryTypes from '../data/memory_types.json'
import { MemoryInfo } from '../types/interfaces'

type Props = {
    memory: MemoryInfo
    isAdmin?: boolean
    onDelete?: (m: MemoryInfo) => void
}

export default function MemoryCard({ memory, isAdmin, onDelete = () => { } }: Props) {
    const { name, version, created_at, updated_at, type, memory_type } = memory || {}
    const displayType = type || memory_type || ''
    const router = useRouter()
    // derive full memory name and help link from local JSON table
    const normalizedType = (displayType || '').toString().toUpperCase()
    const typeMeta = (memoryTypes as Record<string, any>)[normalizedType] || null
    const memoryFullName = typeMeta?.memory_name || name || 'Untitled memory'
    const memoryHelp = typeMeta?.memory_help || null
    const [open, setOpen] = useState(false)
    const btnRef = useRef<HTMLButtonElement | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)

    const [deleting, setDeleting] = useState(false)
    const [showAssign, setShowAssign] = useState(false)
    const [assignedName, setAssignedName] = useState(null)

    useEffect(() => {
        function onDocClick(e: Event) {
            const target = e.target as Node | null
            if (menuRef.current && target && !menuRef.current.contains(target) && btnRef.current && !btnRef.current.contains(target as any)) {
                setOpen(false)
            }
        }
        function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', onDocClick)
        document.addEventListener('touchstart', onDocClick)
        document.addEventListener('keydown', onEsc)
        return () => {
            document.removeEventListener('mousedown', onDocClick)
            document.removeEventListener('touchstart', onDocClick)
            document.removeEventListener('keydown', onEsc)
        }
    }, [])

    useEffect(() => {
        let mounted = true
        async function loadAssignment() {
            if (!memory || !memory.id) return
            try {
                const res = await fetch(`/api/memory_assignments?memory_id=${memory.id}`)
                const j = await res.json()
                if (res.ok) {
                    const a = (j.assignments || [])[0]
                    if (mounted) setAssignedName(a?.user?.full_name || null)
                } else {
                    console.debug('Failed to load assignment', j)
                }
            } catch (e) { console.error('Failed to fetch assignment', e) }
        }
        loadAssignment()
        return () => { mounted = false }
    }, [memory?.id])

    async function handleDelete(e: React.MouseEvent) {
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
        <div
            className="bg-white rounded-xl p-5 shadow-md cursor-pointer transition-transform duration-150 hover:-translate-y-1 border-l-4 flex flex-col justify-between relative overflow-hidden project-card"
            style={{ borderLeftColor: 'var(--color-main)', minHeight: '11rem' }}
            onClick={(e) => {
                // ignore clicks that originate from controls that stopPropagation
                try {
                    const t = String(displayType || '').toLowerCase() || 'unknown'
                    const pid = memory?.project_id || memory?.projectId || ''
                    const mid = memory?.id || ''

                    console.log('MemoryCard navigation debug:', { originalType: displayType, normalizedType: t, memory })

                    // Special routing for circuit dimension memory type (handle various possible naming)
                    if (t === 'circuit' || t === 'circuit-dimension' || t === 'circuit dimension' || t === 'circuitdimension' || t === 'circuit_dimension') {
                        const path = `/calc/circuit-dimension-main?memory_id=${encodeURIComponent(mid)}&project_id=${encodeURIComponent(pid)}`
                        console.log('Redirecting to circuit dimension main:', path)
                        router.push(path)
                    } else {
                        const path = `/calc/${encodeURIComponent(t)}?memory_id=${encodeURIComponent(mid)}&project_id=${encodeURIComponent(pid)}`
                        console.log('Redirecting to standard calc page:', path)
                        router.push(path)
                    }
                } catch (err) {
                    console.debug('Failed to navigate to calc page', err)
                }
            }}
        >
            <div className="relative" style={{ zIndex: 10, paddingRight: 44 }}>
                <div className="text-lg font-extrabold text-gray-900">{memoryFullName}</div>
                <div className="text-xs text-gray-500 mt-1">{displayType ? displayType.toUpperCase() : `v${version || '—'}`}</div>
                {/* Assigned badge */}
                <div style={{ marginTop: 8 }}>
                    <div style={{ color: '#374151', backgroundColor: 'transparent', border: '1px solid rgba(209,213,219,1)', borderRadius: 12, padding: '6px 10px', fontSize: '0.85rem', textAlign: 'center', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>👤</span>
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>{assignedName ? assignedName : 'Not assigned yet'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-stretch" style={{ gap: 0, marginTop: 8 }}>
                <div style={{ flex: '1 1 0', minWidth: 0, margin: '0 1px', color: 'var(--color-main)', backgroundColor: 'rgba(133,183,38,0.08)', borderRadius: 12, padding: '6px 10px', fontSize: '0.85rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <div>{version || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-main)', marginTop: 2 }}>version</div>
                </div>

                <div style={{ flex: '1 1 0', minWidth: 0, margin: '0 1px', padding: '6px 8px', color: 'rgba(55,65,81,0.6)', fontSize: '0.78rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>Created:</div>
                    <div style={{ marginTop: 4, fontSize: '0.75rem' }}>{created_at ? new Date(created_at).toLocaleDateString() : '—'}</div>
                </div>

                <div style={{ flex: '1 1 0', minWidth: 0, margin: '0 1px', padding: '6px 8px', color: 'rgba(55,65,81,0.6)', fontSize: '0.78rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>Updated:</div>
                    <div style={{ marginTop: 4, fontSize: '0.75rem' }}>{updated_at ? new Date(updated_at).toLocaleDateString() : '—'}</div>
                </div>
            </div>

            {isAdmin && (
                <div style={{ position: 'absolute', right: 8, top: 8, zIndex: 20 }}>
                    <button
                        ref={btnRef}
                        aria-haspopup="true"
                        aria-expanded={open}
                        aria-label="More"
                        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
                        className="bg-transparent p-2 cursor-pointer text-gray-400 text-lg"
                        style={{ border: 'none', color: '#9CA3AF' }}
                    >
                        ⋯
                    </button>

                    {open && (
                        <div ref={menuRef} role="menu" aria-label="Memory actions" style={{ marginTop: 8, background: '#fff', boxShadow: '0 10px 30px rgba(2,6,23,0.12)', borderRadius: 10, minWidth: 180 }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 6 }}>
                                <button role="menuitem" onClick={() => { setOpen(false); setShowAssign(true) }} className="w-full text-left px-4 py-2" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer' }} onMouseDown={e => e.preventDefault()}>
                                    <span style={{ width: 22, textAlign: 'center', fontSize: 16 }}>👤</span>
                                    <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Assign memory</span>
                                </button>

                                <button role="menuitem" onClick={handleDelete} className="w-full text-left px-4 py-2" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#dc2626' }} onMouseDown={e => e.preventDefault()}>
                                    <span style={{ width: 22, textAlign: 'center' }}>🗑</span>
                                    <span style={{ fontSize: '0.875rem', color: '#dc2626' }}>Delete memory</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {showAssign && (
                <AssignMemoryModal open={showAssign} memory={memory} onClose={() => setShowAssign(false)} onAssigned={(a) => { setShowAssign(false); setAssignedName(a?.user?.full_name || null); }} />
            )}
        </div>
    )
}
