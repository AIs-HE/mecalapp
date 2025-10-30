import React from 'react'

export default function Header({ title = 'MeCalApp', user, role, onSignOut }) {
    const isAdmin = role === 'admin' || role === 'director'

    return (
        <header className="flex items-center px-7 py-4 bg-white/90 border-b border-black/5 backdrop-blur-sm backdrop-saturate-125">
            <div className="left-title flex items-center flex-none">
                {/* Larger app title */}
                <div className="font-extrabold text-4xl tracking-tight text-primary" style={{ lineHeight: 1 }}>{title}</div>
            </div>

            <nav className="nav-center flex-1 flex justify-center items-center gap-4" aria-label="Main navigation">
                <button aria-current="page" className="bg-transparent font-semibold px-3 py-1 rounded">Projects</button>
                {isAdmin && <button className="bg-transparent font-semibold px-3 py-1 rounded">Summary</button>}
                <button className="bg-transparent font-semibold px-3 py-1 rounded">Help</button>
            </nav>

            <div className="flex items-center header-user gap-4 flex-none">
                {user ? (
                    <>
                        <div className="text-right user-info">
                            <div className="text-sm font-semibold user-email">{user.email}</div>
                            <div className="text-xs text-gray-500 user-role">{role || 'user'}</div>
                        </div>
                        <div>
                            <button onClick={onSignOut} className="bg-primary text-white px-4 py-2 rounded-lg font-bold shadow-sm">Sign out</button>
                        </div>
                    </>
                ) : (
                    <div className="text-gray-500">Not signed in</div>
                )}
            </div>
        </header>
    )
}
