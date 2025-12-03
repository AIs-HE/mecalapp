import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getDraft, setDraft, updateLastSavedToDb } from '../../lib/cache'
import ProjectInfoPanel from '../../components/ProjectInfoPanel'
import CircuitTabs from '../../components/CircuitTabs'
import { getAuth } from '../../lib/auth'

export default function CircuitDimensionMainPage() {
    const router = useRouter()
    const { query, isReady } = router

    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState('idle')
    const [draftArray, setDraftArray] = useState<any[] | null>(null)
    const [draftLastModified, setDraftLastModified] = useState<string | null>(null)
    const [lastSavedToDbAt, setLastSavedToDbAt] = useState<string | null>(null)
    const [dataSource, setDataSource] = useState<'local' | 'db' | 'none'>('none')
    const [showConfigModal, setShowConfigModal] = useState(false)
    // Modal form state (defaults per spec)
    const [nonEseBool, setNonEseBool] = useState(false)
    const [dcBool, setDcBool] = useState(false)
    const [tranBool, setTranBool] = useState(false)
    const [genBool, setGenBool] = useState(false)
    const [niFactor, setNiFactor] = useState<number>(1.25)
    const [deltaV, setDeltaV] = useState<number>(5)
    const [percLoss, setPercLoss] = useState<number>(3.88)

    // Auth display (reads from localStorage; fallback to guest)
    const [authName, setAuthName] = useState<string>('Guest User')
    const [authRole, setAuthRole] = useState<string>('Visitor')

    const memoryId = (query?.memory_id as string) || null
    const projectId = (query?.project_id as string) || null

    const safeFetch = useCallback(async (url: string, opts?: RequestInit) => {
        try {
            const res = await fetch(url, opts)
            if (!res.ok) return { ok: false, status: res.status }
            const j = await res.json()
            return { ok: true, body: j }
        } catch (e) {
            return { ok: false, error: String(e) }
        }
    }, [])

    async function loadMemory(forceDb = false) {
        if (!memoryId) return
        setLoading(true)
        setStatus('loading')

        // read local draft
        const local = getDraft(memoryId)

        // try lightweight metadata fetch from server
        let meta = null
        const metaTry = await safeFetch(`/api/project_memories/${memoryId}/metadata`)
        if (metaTry.ok) meta = metaTry.body
        else {
            // fallback: try query-style endpoint
            const fallback = await safeFetch(`/api/project_memories?memory_id=${encodeURIComponent(memoryId)}`)
            if (fallback.ok && fallback.body && fallback.body.updated_at !== undefined) meta = { updated_at: fallback.body.updated_at }
        }

        const dbUpdatedAt = meta?.updated_at || null

        // Decide which source
        if (forceDb && dbUpdatedAt) {
            // fetch full DB
            const dataRes = await safeFetch(`/api/project_memories/${memoryId}/data`)
            if (dataRes.ok) {
                // If DB row exists but db_array is null -> require initial configuration
                if (dataRes.body && dataRes.body.db_array === null) {
                    setShowConfigModal(true)
                    setDataSource('none')
                    setLoading(false)
                    setStatus('empty')
                    return
                }
                setDraftArray(dataRes.body.db_array || [])
                setDraftLastModified(dataRes.body.updated_at || dbUpdatedAt)
                setLastSavedToDbAt(dataRes.body.updated_at || dbUpdatedAt)
                setDataSource('db')
                setDraft(memoryId, dataRes.body.db_array || [])
            } else {
                // fallback to local if available
                if (local && local.draftArray) {
                    setDraftArray(local.draftArray)
                    setDraftLastModified(local.draftLastModified)
                    setLastSavedToDbAt(local.lastSavedToDbAt)
                    setDataSource('local')
                } else {
                    setDraftArray([])
                    setDataSource('none')
                }
            }
            setLoading(false); setStatus('loaded'); return
        }

        // No local draft and no metadata timestamp: probe DB once to see if row exists (and whether db_array is null)
        if (!local && !dbUpdatedAt) {
            const probe = await safeFetch(`/api/project_memories/${memoryId}/data`)
            if (probe.ok) {
                // If DB row exists but db_array is null -> require initial configuration
                if (probe.body && probe.body.db_array === null) {
                    setShowConfigModal(true)
                    setDataSource('none')
                    setLoading(false)
                    setStatus('empty')
                    return
                }

                // DB has data -> load it
                setDraftArray(probe.body.db_array || [])
                setDraftLastModified(probe.body.updated_at || null)
                setLastSavedToDbAt(probe.body.updated_at || null)
                setDataSource('db')
                updateLastSavedToDb(memoryId, probe.body.updated_at || null)
                setLoading(false)
                setStatus('loaded')
                return
            }

            // no DB row or failed probe -> empty state
            setDraftArray([])
            setDataSource('none')
            setLoading(false)
            setStatus('empty')
            return
        }

        // If DB exists and is newer than local -> fetch full DB
        if (dbUpdatedAt && (!local || new Date(dbUpdatedAt) > new Date(local.draftLastModified || 0))) {
            const dataRes = await safeFetch(`/api/project_memories/${memoryId}/data`)
            if (dataRes.ok) {
                // If DB row exists but db_array is null -> require initial configuration
                if (dataRes.body && dataRes.body.db_array === null) {
                    setShowConfigModal(true)
                    setDataSource('none')
                    setLoading(false)
                    setStatus('empty')
                    return
                }
                setDraftArray(dataRes.body.db_array || [])
                setDraftLastModified(dataRes.body.updated_at || dbUpdatedAt)
                setLastSavedToDbAt(dataRes.body.updated_at || dbUpdatedAt)
                setDataSource('db')
                // cache lastSavedToDbAt
                updateLastSavedToDb(memoryId, dataRes.body.updated_at || dbUpdatedAt)
            } else {
                // fallback to local
                if (local && local.draftArray) {
                    setDraftArray(local.draftArray)
                    setDraftLastModified(local.draftLastModified)
                    setLastSavedToDbAt(local.lastSavedToDbAt)
                    setDataSource('local')
                } else {
                    setDraftArray([])
                    setDataSource('none')
                }
            }
        } else if (local && local.draftArray) {
            // prefer local
            setDraftArray(local.draftArray)
            setDraftLastModified(local.draftLastModified)
            setLastSavedToDbAt(local.lastSavedToDbAt)
            setDataSource('local')
        } else {
            // fallback to DB
            const dataRes = await safeFetch(`/api/project_memories/${memoryId}/data`)
            if (dataRes.ok) {
                // If DB row exists but db_array is null -> require initial configuration
                if (dataRes.body && dataRes.body.db_array === null) {
                    setShowConfigModal(true)
                    setDataSource('none')
                    setLoading(false)
                    setStatus('empty')
                    return
                }
                setDraftArray(dataRes.body.db_array || [])
                setDraftLastModified(dataRes.body.updated_at || dbUpdatedAt)
                setLastSavedToDbAt(dataRes.body.updated_at || dbUpdatedAt)
                setDataSource('db')
                updateLastSavedToDb(memoryId, dataRes.body.updated_at || dbUpdatedAt)
            } else {
                setDraftArray([])
                setDataSource('none')
            }
        }

        setLoading(false)
        setStatus('loaded')
    }

    async function saveDraftToDb() {
        if (!memoryId) return
        setStatus('saving')
        try {
            const payload = { db_array: draftArray || [] }
            const res = await fetch(`/api/project_memories/${memoryId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            if (!res.ok) {
                const txt = await res.text()
                throw new Error(txt || 'save failed')
            }
            const body = await res.json()
            const updatedAt = body.updated_at || new Date().toISOString()
            updateLastSavedToDb(memoryId, updatedAt)
            setLastSavedToDbAt(updatedAt)
            setStatus('saved')
            // reflect persisted source
            setDataSource('db')
            return { ok: true, updated_at: updatedAt }
        } catch (e) {
            console.error('saveDraftToDb error', e)
            setStatus('error')
            return { ok: false, error: String(e) }
        }
    }

    useEffect(() => {
        document.body.classList.add('no-footer-reserve')
        return () => { document.body.classList.remove('no-footer-reserve') }
    }, [])

    // Initialize auth display from centralized helper (if available)
    useEffect(() => {
        try {
            const a = getAuth()
            if (a.name) setAuthName(a.name)
            if (a.role) setAuthRole(a.role)
        } catch (e) {
            // ignore
        }
    }, [])

    useEffect(() => {
        if (!isReady) return
        // load memory when router ready
        loadMemory()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, memoryId])

    function onSaveConfig(configObj?: any) {
        if (!memoryId) return
        // If a config object is provided, use it; otherwise build from modal state
        const cfg = configObj || {
            NonEseBool: nonEseBool,
            DCBool: dcBool,
            TranBool: tranBool,
            GenBool: genBool,
            niFactor,
            deltaV,
            percLoss,
        }

        // Persist config to localStorage for quick access
        try {
            localStorage.setItem(`circuit_config:${memoryId}`, JSON.stringify(cfg))
        } catch (e) {
            console.warn('Failed to save config to localStorage', e)
        }

        // Initialise an empty draft array and record modified timestamp locally
        const now = new Date().toISOString()
        setDraft(memoryId, [])
        setDraftArray([])
        setDraftLastModified(now)
        setLastSavedToDbAt(null)
        setDataSource('local')
        setShowConfigModal(false)
        setStatus('saved')
    }

    function onCancelConfig() {
        setShowConfigModal(false)
        // leave page in empty state so the user can choose actions
        setDraftArray([])
        setDataSource('none')
        setStatus('empty')
    }

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

            {/* App header — visually matched to the reference: translucent, fixed, centered nav */}
            <header className="fixed top-0 left-0 w-full z-50 bg-white/60 backdrop-blur-md border-b border-gray-100 h-[64px]" role="banner">
                <div className="relative w-full px-6 h-full flex items-center">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex-none">
                            <div className="text-lg font-extrabold tracking-tight font-sans">MeCalApp - Circuit Dimmension Memory</div>
                        </div>

                        <div className="flex-none">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-right font-sans">
                                    <div className="font-medium text-gray-800">{authName}</div>
                                    <div className="text-xs text-gray-500">{authRole}</div>
                                </div>
                                <button type="button" aria-label="Back to Config" onClick={() => setShowConfigModal(true)} className="btn btn-sm bg-[var(--color-main,#85B726)] text-white font-semibold">Back to Config</button>
                                <button type="button" aria-label="Back to Projects" onClick={() => router.push('/projects')} className="btn btn-sm" style={{ background: 'rgba(0,0,0,0.06)', color: '#111827' }}>Back to Projects</button>
                            </div>
                        </div>
                    </div>

                    {/* centered nav removed for this header */}
                </div>
            </header>

            {/* Extremely simple modal: minimal wrappers, grid-only, tiny paddings */}
            {showConfigModal && (
                <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/25">
                    <section className="circuit-modal bg-white rounded-md shadow-sm w-[40vw] p-2 h-[70vh] inline-grid overflow-auto min-h-0 z-[10000]">
                        <header className="grid grid-cols-12 items-center gap-1">
                            <h2 className="col-span-10 text-sm font-medium" style={{ color: 'var(--color-main, #085f18)' }}>Circuit Dimension</h2>
                            <button aria-label="Close" onClick={() => onCancelConfig()} className="col-span-2 justify-self-end text-gray-500">✕</button>
                        </header>

                        <form onSubmit={(e) => { e.preventDefault(); onSaveConfig() }} className="mt-1">
                            <div className="grid gap-y-2 items-start min-h-0">
                                {/* Toggle rows: left = label+explanation (inner padded), right = control (inner padded) */}
                                <div className="grid grid-cols-[1fr_auto] items-center min-h-0">
                                    <div className="px-3 py-2">
                                        <label id="label-nonEse" className="text-sm font-medium">Includes Non Ese panel?</label>
                                        <div className="text-xs text-gray-500">Select if site includes non-ESE panels (affects protection strategy).</div>
                                    </div>
                                    <div className="px-3 py-2">
                                        <button type="button" name="nonEse" role="switch" aria-checked={nonEseBool} aria-labelledby="label-nonEse" onClick={() => setNonEseBool(!nonEseBool)} className={`${nonEseBool ? 'bg-[var(--color-main,#85B726)]' : 'bg-gray-200'} inline-block h-5 w-9 rounded-full relative`}>
                                            <span className={`${nonEseBool ? 'translate-x-4' : 'translate-x-0'} block h-4 w-4 bg-white rounded-full transform transition-transform`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[1fr_auto] items-center min-h-0">
                                    <div className="px-3 py-2">
                                        <label id="label-dc" className="text-sm font-medium">Includes DC loads?</label>
                                        <div className="text-xs text-gray-500">Toggle if DC loads (batteries, DC circuits) are present.</div>
                                    </div>
                                    <div className="px-3 py-2">
                                        <button type="button" name="dcLoads" role="switch" aria-checked={dcBool} aria-labelledby="label-dc" onClick={() => setDcBool(!dcBool)} className={`${dcBool ? 'bg-[var(--color-main,#85B726)]' : 'bg-gray-200'} inline-block h-5 w-9 rounded-full relative`}>
                                            <span className={`${dcBool ? 'translate-x-4' : 'translate-x-0'} block h-4 w-4 bg-white rounded-full transform transition-transform`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[1fr_auto] items-center min-h-0">
                                    <div className="px-3 py-2">
                                        <label id="label-tran" className="text-sm font-medium">Includes Transfer Panel?</label>
                                        <div className="text-xs text-gray-500">Enable if automatic/manual transfer panels are included.</div>
                                    </div>
                                    <div className="px-3 py-2">
                                        <button type="button" name="transfer" role="switch" aria-checked={tranBool} aria-labelledby="label-tran" onClick={() => setTranBool(!tranBool)} className={`${tranBool ? 'bg-[var(--color-main,#85B726)]' : 'bg-gray-200'} inline-block h-5 w-9 rounded-full relative`}>
                                            <span className={`${tranBool ? 'translate-x-4' : 'translate-x-0'} block h-4 w-4 bg-white rounded-full transform transition-transform`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[1fr_auto] items-center min-h-0">
                                    <div className="px-3 py-2">
                                        <label id="label-gen" className="text-sm font-medium">Includes Generator Set?</label>
                                        <div className="text-xs text-gray-500">Set if the site has a generator for backup power.</div>
                                    </div>
                                    <div className="px-3 py-2">
                                        <button type="button" name="generator" role="switch" aria-checked={genBool} aria-labelledby="label-gen" onClick={() => setGenBool(!genBool)} className={`${genBool ? 'bg-[var(--color-main,#85B726)]' : 'bg-gray-200'} inline-block h-5 w-9 rounded-full relative`}>
                                            <span className={`${genBool ? 'translate-x-4' : 'translate-x-0'} block h-4 w-4 bg-white rounded-full transform transition-transform`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Numeric inputs with labels and helper text */}
                                <div className="grid grid-cols-3 gap-2 pt-1 items-start min-h-0">
                                    <div className="px-1">
                                        <label htmlFor="niFactor" className="text-xs font-medium">Ni Factor</label>
                                        <input id="niFactor" name="niFactor" type="number" step="0.01" className="w-full border rounded px-2 py-1 text-sm" value={niFactor} onChange={(e) => setNiFactor(Number(e.target.value))} placeholder="1.25" aria-label="Ni Factor" />
                                        <div className="text-xs text-gray-500">Safety or sizing multiplier.</div>
                                    </div>
                                    <div className="px-1">
                                        <label htmlFor="deltaV" className="text-xs font-medium">% ΔV</label>
                                        <input id="deltaV" name="deltaV" type="number" step="0.01" className="w-full border rounded px-2 py-1 text-sm" value={deltaV} onChange={(e) => setDeltaV(Number(e.target.value))} placeholder="% ΔV" aria-label="Voltage variation percentage" />
                                        <div className="text-xs text-gray-500">Acceptable voltage variation.</div>
                                    </div>
                                    <div className="px-1">
                                        <label htmlFor="percLoss" className="text-xs font-medium">% Losses</label>
                                        <input id="percLoss" name="percLoss" type="number" step="0.01" className="w-full border rounded px-2 py-1 text-sm" value={percLoss} onChange={(e) => setPercLoss(Number(e.target.value))} placeholder="% Losses" aria-label="Percentage losses" />
                                        <div className="text-xs text-gray-500">Estimated distribution losses.</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-3 items-start min-h-0">
                                    <button type="button" className="text-sm border rounded px-2 py-1 justify-self-end" onClick={() => onCancelConfig()}>Cancel</button>
                                    <button type="submit" className="text-sm bg-[var(--color-main,#85B726)] text-white rounded px-3 py-1 justify-self-end">Go to memory</button>
                                </div>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {/* Placeholder for subsequent containers (will be implemented container-by-container) */}
            <main className="w-full p-6 bg-transparent" style={{ paddingTop: '64px', paddingBottom: '80px', height: 'calc(100vh - 64px - 80px)', boxSizing: 'border-box', background: 'transparent' }}>
                {/* Secondary layout: left (main) and right (project info). Both columns fill available vertical space and scroll when content overflows. */}
                <section className="text-gray-700 h-full">
                    <div className="grid grid-cols-12 gap-4 w-full h-full">
                        {/* Main content column (tabs, common inputs, equipment gallery) */}
                        <div className="col-span-9 h-full flex flex-col">
                            <div className="flex-1 overflow-auto pr-2 hide-scrollbar">
                                <div className="mb-4">
                                    <CircuitTabs memoryId={memoryId || undefined} nonEseBool={nonEseBool} dcBool={dcBool} tranBool={tranBool} genBool={genBool} />
                                </div>

                                {/* equipment placeholder moved into the active tab container (CircuitTabs) */}
                            </div>
                        </div>

                        {/* Right project info column (emerald) */}
                        <div className="col-span-3 h-full">
                            <div className="h-full overflow-auto pl-2">
                                <ProjectInfoPanel projectId={projectId || undefined} memoryId={memoryId || undefined} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Debug panel removed — no longer needed in production view */}
            </main>

            {/* Draft Controls - fixed white bottom bar */}
            <div className="footer-bar fixed left-0 right-0 bottom-0 z-50" aria-hidden={false}>
                <div className="app-footer mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${status === 'saved' ? 'bg-green-500' : status === 'saving' ? 'bg-blue-400 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                        <div>
                            <div className="text-sm font-medium">{status === 'saved' ? 'All changes saved' : status === 'saving' ? 'Saving...' : status === 'empty' ? 'No data' : 'New changes without saving'}</div>
                            <div className="meta text-xs">Last modified: {draftLastModified ? new Date(draftLastModified).toLocaleString() : '--'}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="btn btn-sm" onClick={async () => { await saveDraftToDb() }}>
                            Guardar en DB
                        </button>

                        <button className="btn btn-sm" onClick={async () => { await loadMemory(true) }}>
                            Cargar desde DB
                        </button>

                        <button className="btn btn-sm" onClick={async () => {
                            // Export: simply serialise current draft and trigger download
                            try {
                                const data = draftArray || []
                                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `circuit_draft_${memoryId || 'export'}.json`
                                document.body.appendChild(a)
                                a.click()
                                a.remove()
                                URL.revokeObjectURL(url)
                            } catch (e) { console.error('export error', e) }
                        }}>
                            Exportar a Word
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}