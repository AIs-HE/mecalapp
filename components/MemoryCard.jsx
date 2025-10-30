import React from 'react'

export default function MemoryCard({ memory, isAdmin }) {
    const { name, version, created_at, updated_at } = memory || {}

    return (
        <div className="bg-white rounded-lg p-3 shadow-sm memory-card" style={{ borderLeft: '4px solid var(--color-main)' }}>
            <div className="flex justify-between">
                <div>
                    <div className="text-sm font-bold">{name || 'Untitled memory'}</div>
                    <div className="text-xs text-gray-500">v{version || '—'}</div>
                </div>
                {isAdmin && <button aria-label="More" className="bg-transparent border-0 cursor-pointer">⋯</button>}
            </div>
            <div className="mt-2 text-sm text-gray-700">
                <div>Created: {created_at ? new Date(created_at).toLocaleDateString() : '—'}</div>
                <div>Updated: {updated_at ? new Date(updated_at).toLocaleDateString() : '—'}</div>
            </div>
        </div>
    )
}
