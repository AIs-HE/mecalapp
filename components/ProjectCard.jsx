import React from 'react'

function formatProjectId(id) {
    if (!id) return 'HE-0000'
    const last = id.replace(/-/g, '').slice(-4).toUpperCase()
    return `HE-${last}`
}

export default function ProjectCard({ project, onClick, isAdmin }) {
    const { name, id, created_at, updated_at } = project || {}
    const displayId = formatProjectId(id)
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
                <div className="text-xs text-gray-500 mt-1">{displayId}</div>
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
                <button
                    aria-label="More"
                    onClick={e => { e.stopPropagation(); /* TODO: open menu */ }}
                    className="bg-transparent p-2 cursor-pointer text-gray-400 text-lg"
                    style={{ border: 'none', position: 'absolute', right: 8, left: 'auto', top: 8, color: '#9CA3AF', zIndex: 10 }}
                >
                    ⋯
                </button>
            )}
        </div>
    )
}
