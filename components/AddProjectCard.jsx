import React from 'react'

export default function AddProjectCard({ onClick }) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick && onClick() }}
            className="bg-white rounded-xl p-5 shadow-sm cursor-pointer transition-transform duration-150 hover:-translate-y-1 border-l-4 border-dashed flex items-center justify-center text-4xl font-extrabold add-project-card"
            style={{ borderLeftColor: 'var(--color-main)', color: 'var(--color-main)', height: '13rem', minHeight: '13rem' }}
        >
            +
        </div>
    )
}
