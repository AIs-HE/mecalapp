import React, { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function CircuitDimensionMainPage() {
    const router = useRouter()

    useEffect(() => {
        document.body.classList.add('no-footer-reserve')
        return () => { document.body.classList.remove('no-footer-reserve') }
    }, [])

    return (
        <div className="relative" style={{ minHeight: '100vh', paddingBottom: 0 }}>
            {/* Decorative background clump (kept from previous implementation) */}
            <div className="bg-clump absolute inset-0 -z-10" aria-hidden>
                <div className="rect-a animate-in" />
                <div className="rect-b animate-in" />
                <div className="rect-c animate-in" />
                <div className="rect-d animate-in" />
                <div className="rect-e animate-in" />
                <div className="rect-f animate-in" />
                <div className="rect-g animate-in" />
                <div className="rect-h animate-in" />
            </div>

            {/* Dark Blue Header Container (first container) */}
            <header
                className="text-white bg-slate-800 py-1 px-4"
                style={{ background: 'var(--color-main, #85B726)' }}
                role="banner"
            >
                <div className="w-full flex justify-between items-center">
                    {/* Left: App title (white badge) */}
                    <div className="flex items-center space-x-4">
                        <div className="bg-white text-gray-900 px-3 py-1 rounded">
                            <h1 className="text-lg font-bold leading-none">MeCalApp</h1>
                        </div>
                        <span className="text-xs leading-none text-white/90">CDM - Circuit Dimension memory</span>
                    </div>

                    {/* Right: user info + actions (flush right) */}
                    <div className="flex items-center space-x-3 text-sm">
                        <div className="text-sm text-white/90 text-right leading-none">
                            <div className="font-medium leading-none">Guest User</div>
                            <div className="text-xs text-white/70 leading-none">Visitor</div>
                        </div>

                        <button
                            aria-label="Back to Config"
                            onClick={() => router.push('#config')}
                            className="px-3 py-1 rounded"
                            style={{ background: 'var(--color-main, #85B726)', color: 'white' }}
                        >
                            Back to Config
                        </button>

                        <button
                            aria-label="Back to Projects"
                            onClick={() => router.push('/projects')}
                            className="px-3 py-1 rounded"
                            style={{ background: 'rgba(0,0,0,0.12)', color: 'white' }}
                        >
                            Back to Projects
                        </button>
                    </div>
                </div>
            </header>

            {/* Placeholder for subsequent containers (will be implemented container-by-container) */}
            <main className="max-w-screen-xl mx-auto p-6 bg-transparent" style={{ paddingBottom: '120px', background: 'transparent' }}>
                <section className="text-gray-700">
                    <p className="mb-4">Secondary containers will be added here, one container at a time.</p>
                    <p className="text-sm text-gray-500">Current step: dark-blue header container implemented.</p>
                </section>
            </main>

            {/* Draft Controls - fixed white bottom bar */}
            <div className="footer-bar fixed left-0 right-0 bottom-0 z-50" aria-hidden={false}>
                <div className="app-footer mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                        <div>
                            <div className="text-sm font-medium">New changes without saving</div>
                            <div className="meta text-xs">Last modified: --/--/-- --:--:--</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="btn btn-sm" onClick={() => { /* placeholder: onPushToDatabase */ }}>
                            Guardar en DB
                        </button>

                        <button className="btn btn-sm" onClick={() => { /* placeholder: onLoadFromDatabase */ }}>
                            Cargar desde DB
                        </button>

                        <button className="btn btn-sm" onClick={() => { /* placeholder: onExport */ }}>
                            Exportar a Word
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}