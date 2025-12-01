import React, { useState } from 'react'

export interface ProjectInfo {
    costCenter?: string
    projectName?: string
    client?: string
    version?: number
    companyLogo?: string
    lastModified?: string
}

export default function ProjectInfoPanel({ projectInfo }: { projectInfo?: ProjectInfo }) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside className={`bg-emerald-600 text-white rounded-lg shadow-md p-4 w-72 h-full flex flex-col`}>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className="text-sm font-semibold">Project Info</div>
                    <div className="text-xs opacity-90">Context & metadata</div>
                </div>
                <button aria-label="Toggle project panel" onClick={() => setCollapsed(!collapsed)} className="text-white/90 text-sm">{collapsed ? '▸' : '▾'}</button>
            </div>

            {!collapsed && (
                <div className="flex-1 overflow-auto">
                    <div className="mb-3">
                        <div className="text-xxs text-white/80 text-xs">Cost Center</div>
                        <div className="font-medium">{projectInfo?.costCenter || '—'}</div>
                    </div>

                    <div className="mb-3">
                        <div className="text-xxs text-white/80 text-xs">Project Name</div>
                        <div className="font-medium">{projectInfo?.projectName || '—'}</div>
                    </div>

                    <div className="mb-3">
                        <div className="text-xxs text-white/80 text-xs">Client</div>
                        <div className="font-medium">{projectInfo?.client || '—'}</div>
                    </div>

                    <div className="mb-3">
                        <div className="text-xxs text-white/80 text-xs">Version</div>
                        <div className="inline-flex items-center gap-2">
                            <div className="font-medium">V{projectInfo?.version ?? '—'}</div>
                            <div className="w-2 h-2 rounded-full bg-yellow-300 ring-2 ring-yellow-400" />
                        </div>
                    </div>

                    <div className="mb-3">
                        <div className="text-xxs text-white/80 text-xs">Company</div>
                        <div className="font-medium">{projectInfo?.companyLogo ? projectInfo.companyLogo : 'Logo placeholder'}</div>
                    </div>

                    <div className="mt-4 p-2 border border-white/10 rounded text-xs">
                        <div className="font-medium mb-1">AI Assistant (placeholder)</div>
                        <div className="text-white/80 text-xs">Future integration area — notes, hints and quick actions.</div>
                    </div>
                </div>
            )}

            {/* Collapse control removed — panel has its own header toggle */}
        </aside>
    )
}
