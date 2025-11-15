// SPDX: typed
import React, { useState, useRef, useEffect } from 'react'
import { ProjectInfo } from '../types/interfaces'

function formatProjectId(id: string | number | undefined) {
    if (!id) return 'HE-0000'
    const last = String(id).replace(/-/g, '').slice(-4).toUpperCase()
    return `HE-${last}`
}

type Props = {
    project: ProjectInfo & Record<string, any>
    onClick?: (p: any) => void
    isAdmin?: boolean
    onEdit?: (p: any) => void
    onDelete?: (p: any) => void
}

export default function ProjectCard({ project, onClick, isAdmin, onEdit = () => { }, onDelete = () => { } }: Props) {
    const { name, id, created_at, updated_at } = project || {}
    const displayId = formatProjectId(id)
    const displayCostCenter = project?.cost_center || null
    const memoriesCount = project?.memories_count ?? project?.memoriesCount ?? 0

    return (
        <div
            onClick={() => onClick && onClick(project)}
            role="button"
            tabIndex={0}
            className="bg-white rounded-xl p-5 shadow-md cursor-pointer transition-transform duration-150 hover:-translate-y-1 border-l-4 flex flex-col justify-between relative overflow-hidden project-card"
            style={{ borderLeftColor: 'var(--color-main)', height: '13rem', minHeight: '13rem' }}
        >
            <div className="relative" style={{ zIndex: 10, paddingRight: 44 }}>
                <div className="text-lg font-extrabold text-gray-900">{name}</div>
                <div className="text-xs text-gray-500 mt-1">{displayCostCenter ? displayCostCenter : displayId}</div>
            </div>

            {/* evenly spread three items with 1px external gap/margin */}
            <div className="flex items-stretch" style={{ gap: 0, marginTop: 8 }}>
                <div
                    style={{
                        flex: '1 1 0',
                        minWidth: 0,
                        margin: '0 1px', /* external padding between items */
                        color: 'var(--color-main)',
                        backgroundColor: 'rgba(133,183,38,0.08)',
                        borderRadius: 12,
                        padding: '6px 10px',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                    }}
                >
                    <div>{memoriesCount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-main)', marginTop: 2 }}>memories</div>
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
                <ProjectMenu
                    onEdit={() => onEdit(project)}
                    onDelete={() => onDelete(project)}
                />
            )}
        </div>
    )
}

function ProjectMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    const [open, setOpen] = useState(false)
    const btnRef = useRef<HTMLButtonElement | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        function onDocClick(e: Event) {
            const target = e.target as Node | null
            if (menuRef.current && target && !menuRef.current.contains(target) && btnRef.current && !btnRef.current.contains(target as any)) {
                setOpen(false)
            }
        }
        function onEsc(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDocClick)
        document.addEventListener('touchstart', onDocClick)
        document.addEventListener('keydown', onEsc)
        return () => {
            document.removeEventListener('mousedown', onDocClick)
            document.removeEventListener('touchstart', onDocClick)
            document.removeEventListener('keydown', onEsc)
        }
    }, [])

    return (
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
                <div ref={menuRef} role="menu" aria-label="Project actions" style={{ marginTop: 8, background: '#fff', boxShadow: '0 10px 30px rgba(2,6,23,0.12)', borderRadius: 10, minWidth: 200 }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 6 }}>
                        <button
                            role="menuitem"
                            onClick={() => { setOpen(false); onEdit(); }}
                            className="w-full text-left px-4 py-2"
                            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                            onMouseDown={e => e.preventDefault()}
                        >
                            <span style={{ width: 22, textAlign: 'center', fontSize: 16 }}>✎</span>
                            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Edit project</span>
                        </button>

                        <button
                            role="menuitem"
                            onClick={() => { setOpen(false); onDelete(); }}
                            className="w-full text-left px-4 py-2"
                            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#dc2626' }}
                            onMouseDown={e => e.preventDefault()}
                        >
                            <span style={{ width: 22, textAlign: 'center', fontSize: 16 }}>🗑</span>
                            <span style={{ fontSize: '0.875rem', color: '#dc2626' }}>Delete project</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
