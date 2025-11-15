import { useEffect, useState } from 'react'
import COLORS from '../lib/theme'
import cache from '../lib/cache'
import { ProjectInfo } from '../types/interfaces'

type Props = {
    open?: boolean
    project?: ProjectInfo | null
    onClose?: () => void
    onCreated?: (p: any) => void
    onUpdated?: (p: any) => void
}

export default function NewProjectModal({ open = false, project = null, onClose = () => { }, onCreated = () => { }, onUpdated = () => { } }: Props) {
    const [clients, setClients] = useState([])
    const [loadingClients, setLoadingClients] = useState(false)
    const [name, setName] = useState('')
    const [costCenter, setCostCenter] = useState('')
    const [clientId, setClientId] = useState('')
    const [selectedMemories, setSelectedMemories] = useState({})
    const [saving, setSaving] = useState(false)
    const [debugFetchedMemories, setDebugFetchedMemories] = useState(null)
    const [debugExistingMap, setDebugExistingMap] = useState(null)
    const [syncStatus, setSyncStatus] = useState('idle') // idle | pending | syncing | error
    const [syncError, setSyncError] = useState(null)
    const memoryTypes = ['circuit', 'protection', 'ducts', 'installation', 'testing']

    useEffect(() => {
        if (!open) return
        async function loadClients() {
            setLoadingClients(true)
            try {
                const res = await fetch('/api/clients')
                const json = await res.json()
                if (res.ok) {
                    setClients(json.clients || [])
                    if ((json.clients || []).length > 0) setClientId((json.clients || [])[0].id)
                }
            } catch (err) { }
            setLoadingClients(false)
        }
        loadClients()
        // if editing, prefill fields and load existing memories
        if (project) {
            // fetch latest project details from server to ensure cost_center and other fields are present
            (async () => {
                try {
                    const rProj = await fetch(`/api/projects?id=${project.id}`)
                    if (rProj.ok) {
                        const jProj = await rProj.json()
                        const srv = jProj.project || project
                        setName(srv.name || project.name || '')
                        setCostCenter(srv.cost_center || project.cost_center || '')
                        if (srv.client_id) setClientId(srv.client_id)
                    } else {
                        // fallback to provided project object
                        setName(project.name || '')
                        setCostCenter(project.cost_center || '')
                        if (project.client_id) setClientId(project.client_id)
                    }
                } catch (e) {
                    console.error('Failed to fetch project details', e)
                    setName(project.name || '')
                    setCostCenter(project.cost_center || '')
                    if (project.client_id) setClientId(project.client_id)
                }

                // fetch project memories
                try {
                    const r = await fetch(`/api/project_memories?project_id=${project.id}`)
                    const j = await r.json()
                    console.debug('NewProjectModal: fetched project_memories', { ok: r.ok, body: j })
                    setDebugFetchedMemories(j.memories || null)
                    if (r.ok) {
                        // normalize types to lowercase to match memoryTypes
                        const existing = (j.memories || []).reduce((acc, m) => {
                            const t = (m?.type || m?.memory_type || '')
                            if (t) acc[String(t).toLowerCase().trim()] = true
                            return acc
                        }, {})
                        setSelectedMemories(existing)
                        setDebugExistingMap(existing)
                    }
                } catch (e) { console.error(e) }
            })()
        } else {
            // reset when opening in create mode
            setName('')
            setCostCenter('')
            setSelectedMemories({})
        }
    }, [open, project?.id])

    function toggleMemory(type) {
        // update local UI
        setSelectedMemories(s => {
            const prev = s || {}
            const next = { ...prev, [type]: !prev[type] }

            // persist to cache when we have a project id
            if (project && project.id) {
                // build a light array representation
                const arr = Object.keys(next).filter(k => next[k]).map(t => ({ type: t }))
                try { cache.setProjectMemories(project.id, arr) } catch (e) { console.error(e) }

                // enqueue op for sync
                const was = !!prev[type]
                const now = !!next[type]
                if (!was && now) {
                    cache.enqueueOp({ type: 'create_memory', payload: { project_id: project.id, memory_type: type } })
                } else if (was && !now) {
                    cache.enqueueOp({ type: 'delete_memory', payload: { project_id: project.id, memory_type: type } })
                }
                setSyncStatus('pending')
                // kick off background sync
                startSync()
            }

            return next
        })
    }

    async function startSync() {
        try {
            setSyncError(null)
            setSyncStatus('syncing')
            const res = await cache.syncQueue({ onProgress: (p) => { /* could update per-item UI */ } })
            if (res.ok) {
                if (res.remaining && res.remaining.length > 0) {
                    setSyncStatus('pending')
                    setSyncError(`Failed to sync ${res.remaining.length} ops`)
                } else {
                    setSyncStatus('idle')
                    setSyncError(null)
                }
            } else {
                setSyncStatus('error')
                setSyncError(res.error || res.reason || 'unknown')
            }
            return res
        } catch (e) {
            console.error('startSync error', e)
            setSyncStatus('error')
            setSyncError(String(e))
            return { ok: false, error: String(e) }
        }
    }

    async function handleCreate(e) {
        e.preventDefault()
        if (!name || !clientId) return alert('Please provide project name and client')
        setSaving(true)
        try {
            let projectResult = null
            if (project && project.id) {
                // update existing project
                const res = await fetch('/api/projects', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: project.id, name, client_id: clientId, cost_center: costCenter })
                })
                const json = await res.json()
                if (!res.ok) throw new Error(json.error || 'Failed to update project')
                projectResult = json.project

                // sync memories: fetch current from server
                const r0 = await fetch(`/api/project_memories?project_id=${project.id}`)
                const j0 = await r0.json()
                console.debug('NewProjectModal: sync fetch project_memories', { ok: r0.ok, body: j0 })
                const existing = (j0.memories || []).reduce((acc, m) => {
                    const t = (m?.type || m?.memory_type || '')
                    if (t) acc[String(t).toLowerCase().trim()] = true
                    return acc
                }, {})
                setDebugFetchedMemories(j0.memories || null)
                setDebugExistingMap(existing)
                // for each memory type decide create or delete -> enqueue ops and persist locally
                for (const type of memoryTypes) {
                    const should = !!selectedMemories[type]
                    const isExisting = !!existing[type]
                    if (should && !isExisting) {
                        cache.enqueueOp({ type: 'create_memory', payload: { project_id: project.id, memory_type: type } })
                    } else if (!should && isExisting) {
                        cache.enqueueOp({ type: 'delete_memory', payload: { project_id: project.id, memory_type: type } })
                    }
                }
                // persist a lightweight local representation too
                try {
                    const arr = Object.keys(selectedMemories || {}).filter(k => selectedMemories[k]).map(t => ({ type: t }))
                    cache.setProjectMemories(project.id, arr)
                } catch (e) { console.error(e) }
                setSyncStatus('pending')
                startSync()

                onUpdated && onUpdated(projectResult)
                onClose()
            } else {
                // create project
                const res = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, client_id: clientId, cost_center: costCenter })
                })
                const json = await res.json()
                if (!res.ok) throw new Error(json.error || 'Failed to create project')
                const newProject = json.project

                // create selected memory types
                const selected = Object.keys(selectedMemories).filter(k => selectedMemories[k])
                for (const type of selected) {
                    // enqueue create ops for newly created project so they are persisted locally and synced
                    cache.enqueueOp({ type: 'create_memory', payload: { project_id: newProject.id, memory_type: type } })
                }
                try { cache.setProjectMemories(newProject.id, selected.map(t => ({ type: t }))) } catch (e) { console.error(e) }
                setSyncStatus('pending')
                // wait for background sync to complete so server-side counts reflect the new memories
                const syncRes = await startSync()
                if (!syncRes.ok || (syncRes.remaining && syncRes.remaining.length > 0)) {
                    // if sync failed, surface a warning but still proceed (user chose wait-for-sync)
                    const msg = syncRes.error || (syncRes.remaining ? `Failed to sync ${syncRes.remaining.length} ops` : 'Unknown sync error')
                    setSyncStatus('error')
                    setSyncError(msg)
                    // optionally alert the user
                    alert('Warning: some memory operations failed to sync. The project was created but memory counts may be incomplete.')
                }

                // now inform parent (dashboard) that project was created; dashboard will reload projects from server
                onCreated && onCreated(newProject)
                // reset
                setName('')
                setCostCenter('')
                setSelectedMemories({})
                onClose()
            }
        } catch (err) {
            console.error(err)
            alert(err.message || String(err))
        }
        setSaving(false)
    }

    if (!open) return null

    return (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div className="projects-panel" style={{ width: 'min(880px,96%)', maxHeight: '85vh', overflow: 'hidden', padding: 16, backgroundColor: 'rgba(243,244,246,1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{project ? 'Edit Project' : 'New project'}</h3>
                    <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: '0', fontSize: 20 }}>✕</button>
                </div>

                <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
                    <div>
                        <label className="label">Project name</label>
                        <input className="w-full px-3 py-2 mt-2 rounded-md border border-gray-200" value={name} onChange={e => setName(e.target.value)} required />

                        <div style={{ marginBottom: 8, fontSize: 13, marginTop: 8 }}>
                            Sync status: <strong style={{ textTransform: 'capitalize' }}>{syncStatus}</strong>
                            {syncError ? <span style={{ color: '#dc2626', marginLeft: 8 }}>Error: {syncError}</span> : null}
                        </div>

                        <label className="label mt-3">Cost center (HE-XXXX)</label>
                        <input className="w-full px-3 py-2 mt-2 rounded-md border border-gray-200" placeholder="HE-0001" value={costCenter} onChange={e => setCostCenter(e.target.value)} />

                        <label className="label mt-3">Client</label>
                        {loadingClients ? (
                            <div className="meta">Loading clients…</div>
                        ) : (
                            <select className="w-full px-3 py-2 mt-2 rounded-md border border-gray-200" value={clientId} onChange={e => setClientId(e.target.value)}>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        )}

                        <div style={{ marginTop: 10 }}>
                            <button type="submit" className="btn bg-primary text-white px-4 py-2 rounded-md" disabled={saving}>{project ? (saving ? 'Editing…' : 'Edit Project') : (saving ? 'Creating…' : 'Create project')}</button>
                            <button type="button" onClick={onClose} style={{ marginLeft: 8 }} className="btn">Cancel</button>
                        </div>
                    </div>

                    <div style={{ borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: 12 }}>
                        <h4 style={{ marginTop: 0 }}>Available memory types</h4>
                        <div style={{ maxHeight: '236px', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {memoryTypes.map(t => (
                                    <div key={t} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: '#fff', boxShadow: '0 4px 12px rgba(16,24,40,0.03)', minHeight: 72 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{t}</div>
                                            <div className="meta">Add a {t} memory to this project</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => toggleMemory(t)}
                                                aria-pressed={!!selectedMemories[t]}
                                                className="btn px-4 py-2 rounded-md"
                                                style={{
                                                    backgroundColor: selectedMemories[t] ? '#d1d5db' : COLORS.primary,
                                                    color: selectedMemories[t] ? '#1f2937' : '#ffffff',
                                                    border: 'none'
                                                }}
                                            >
                                                {selectedMemories[t] ? 'Unselect' : 'Select'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="meta" style={{ marginTop: 10 }}>Tip: click Select to mark memories to be created. When you press "Create project" those selected memories will be added to the new project.</div>
                        {/* Debug panel removed - no longer needed */}
                    </div>
                </form>
            </div>
        </div>
    )
}
