import React, { useEffect, useState } from 'react'

export interface ProjectInfo {
    costCenter?: string
    projectName?: string
    client?: string
    version?: number
    companyLogo?: string
    lastModified?: string
}

export default function ProjectInfoPanel({ projectInfo, projectId, memoryId }: { projectInfo?: ProjectInfo, projectId?: string, memoryId?: string }) {
    const [collapsed, setCollapsed] = useState(false)
    const [localProject, setLocalProject] = useState<ProjectInfo | undefined>(projectInfo)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // if explicit projectInfo is provided by parent, prefer it
        if (projectInfo) {
            setLocalProject(projectInfo)
            return
        }

        // fetch project info when projectId provided
        async function loadProject() {
            if (!projectId) return
            setLoading(true)
            try {
                const res = await fetch(`/api/projects?id=${encodeURIComponent(projectId)}`)
                if (!res.ok) throw new Error('Failed to fetch project')
                const json = await res.json()
                const proj = json.project || null
                let clientName = ''
                if (proj && proj.client_id) {
                    // fetch clients list and try to find matching name
                    try {
                        const cRes = await fetch('/api/clients')
                        if (cRes.ok) {
                            const cJson = await cRes.json()
                            const match = (cJson.clients || []).find((c: any) => c.id === proj.client_id)
                            clientName = match ? match.name : proj.client_id
                        } else {
                            clientName = proj.client_id
                        }
                    } catch (e) {
                        clientName = proj.client_id
                    }
                }

                // If memoryId provided, try to fetch the memory to read its version
                let version: string | number | undefined
                if (memoryId) {
                    try {
                        const mRes = await fetch(`/api/project_memories?project_id=${encodeURIComponent(projectId)}`)
                        if (mRes.ok) {
                            const mJson = await mRes.json()
                            const mem = (mJson.memories || []).find((m: any) => m.id === memoryId)
                            if (mem) version = mem.version
                        }
                    } catch (e) { /* ignore */ }
                }

                const mapped: ProjectInfo = {
                    costCenter: proj?.cost_center || proj?.costCenter || undefined,
                    projectName: proj?.name || proj?.projectName || undefined,
                    client: clientName || undefined,
                    version: version ?? undefined,
                }
                setLocalProject(mapped)
            } catch (e) {
                console.debug('ProjectInfoPanel: failed to load project', e)
            } finally {
                setLoading(false)
            }
        }

        loadProject()
    }, [projectId, memoryId, projectInfo])

    return (
        <aside className={`bg-gray-300 text-black rounded-lg shadow-md p-4 w-full h-full flex flex-col`}>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className="font-semibold">Project Info</div>
                </div>
                <button aria-label="Toggle project panel" onClick={() => setCollapsed(!collapsed)} className="text-white/90 text-sm">{collapsed ? '▸' : '▾'}</button>
            </div>

            {!collapsed && (
                <div className="flex-1 overflow-auto">
                    {/* Read-only description list for project metadata (display-only) */}
                    <dl className="space-y-3">
                        <div>
                            <dt className="text-xs text-gray-600">Cost Center</dt>
                            <dd className="font-medium">{localProject?.costCenter || projectInfo?.costCenter || '007d4474-94f9-4444-91bd-4c1ac0108922'}</dd>
                        </div>

                        <div>
                            <dt className="text-xs text-gray-600">Project Name</dt>
                            <dd className="font-medium">{localProject?.projectName || projectInfo?.projectName || 'Project'}</dd>
                        </div>

                        <div>
                            <dt className="text-xs text-gray-600">Client</dt>
                            <dd className="font-medium">{localProject?.client || projectInfo?.client || 'Client'}</dd>
                        </div>

                        <div>
                            <dt className="text-xs text-gray-600">Version</dt>
                            <dd className="inline-flex items-center gap-2">
                                <span className="font-medium">V{localProject?.version ?? projectInfo?.version ?? '—'}</span>
                                <span className="w-2 h-2 rounded-full bg-yellow-300 ring-2 ring-yellow-400" aria-hidden="true" />
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs text-gray-600">Company</dt>
                            <dd className="font-medium">{localProject?.companyLogo ? localProject.companyLogo : projectInfo?.companyLogo ? projectInfo.companyLogo : 'Logo placeholder'}</dd>
                        </div>
                    </dl>

                    <div className="mt-4 p-2 border border-white/10 rounded text-xs">
                        <div className="font-medium mb-1">AI Assistant (placeholder)</div>
                        <div className="text-gray-700 text-xs">Future integration area — notes, hints and quick actions.</div>
                    </div>
                </div>
            )}

            {/* Collapse control removed — panel has its own header toggle */}
        </aside>
    )
}
