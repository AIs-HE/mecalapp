import React from 'react'
import { caliberOptions, resistanceFromTable, inductiveReactanceFromTable } from '../lib/calculations'

export type Equipment = {
    id: string
    output?: string
    name?: string
    phases?: 1 | 3
    installedPower?: number
}

export default function EquipmentTableGallery({
    equipments = [],
    onAdd,
    onDelete,
    onUpdate,
    validation,
    commonInputs,
}: {
    equipments?: Equipment[]
    onAdd: () => void
    onDelete: (id: string) => void
    onUpdate: (id: string, changes: Partial<Equipment>) => void
    validation?: { valid: boolean; messages?: string[] }
    commonInputs?: any
}) {
    return (
        <div className="bg-gray-700 text-white p-3 rounded-b-lg">
            <div className="flex items-center justify-between mb-2">
                <div className="font-medium">⚡ Circuits ({equipments?.length ?? 0})</div>
                <button
                    onClick={onAdd}
                    className="bg-[var(--color-main,#85B726)] px-2 py-1 rounded text-sm"
                >
                    ➕ Agregar Equipo
                </button>
            </div>

            {validation && !validation.valid && (
                <div className="mb-2 p-2 rounded bg-yellow-100 text-yellow-900 text-sm">
                    <div className="font-semibold">⚠️ Common inputs validation issues</div>
                    <ul className="mt-1 list-disc list-inside text-sm">
                        {(validation.messages || []).map((m, i) => (
                            <li key={i}>{m}</li>
                        ))}
                    </ul>
                </div>
            )}

            {(!equipments || equipments.length === 0) ? (
                <div className="text-sm text-gray-200">No hay equipos agregados. Haz clic en 'Agregar Equipo' para comenzar.</div>
            ) : (
                <div className="overflow-auto mt-2 border border-gray-600 rounded hide-scrollbar">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-800 sticky top-0">
                            <tr>
                                <th className="px-2 py-2">Out</th>
                                <th className="px-2 py-2">Name</th>
                                <th className="px-2 py-2">Pha.Qty.</th>
                                <th className="px-2 py-2">I.P.[kVA]</th>
                                <th className="px-2 py-2">U.F.</th>
                                <th className="px-2 py-2">Dem.P.</th>
                                <th className="px-2 py-2">Inx1.25</th>
                                <th className="px-2 py-2">Prot.I</th>
                                <th className="px-2 py-2">CxPha</th>
                                <th className="px-2 py-2">Cal</th>
                                <th className="px-2 py-2">xN</th>
                                <th className="px-2 py-2">xN.Fac</th>
                                <th className="px-2 py-2">L[km]</th>
                                <th className="px-2 py-2">R[Ω/km]</th>
                                <th className="px-2 py-2">Xl[Ω/km]</th>
                                <th className="px-2 py-2">REG</th>
                                <th className="px-2 py-2">LOS</th>
                                <th className="px-2 py-2">Del</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipments.map(eq => {
                                const rawCaliber = (eq as any).caliber ?? '--'
                                const resPlaceholder = rawCaliber && rawCaliber !== '--' ? resistanceFromTable(rawCaliber, commonInputs?.conductorMaterial ?? 'Cu', commonInputs?.conduitMaterial ?? 'PVC') : undefined
                                const xlPlaceholder = rawCaliber && rawCaliber !== '--' ? inductiveReactanceFromTable(rawCaliber, commonInputs?.conduitMaterial ?? 'PVC') : undefined

                                return (
                                    <tr key={eq.id} className="even:bg-gray-800/60">
                                        <td className="px-2 py-2">
                                            <input
                                                className="w-20 bg-gray-700 text-white border border-gray-600 px-1 py-0.5 rounded"
                                                value={eq.output ?? ''}
                                                onChange={e => onUpdate(eq.id, { output: e.target.value })}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                className="w-36 bg-gray-700 text-white border border-gray-600 px-1 py-0.5 rounded"
                                                value={eq.name ?? ''}
                                                onChange={e => onUpdate(eq.id, { name: e.target.value })}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <select
                                                className="bg-gray-700 text-white border border-gray-600 px-1 py-0.5 rounded"
                                                value={String(eq.phases ?? 3)}
                                                onChange={e => onUpdate(eq.id, { phases: Number(e.target.value) as 1 | 3 })}
                                            >
                                                <option value={3}>3</option>
                                                <option value={1}>1</option>
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-20 bg-gray-700 text-white border border-gray-600 px-1 py-0.5 rounded"
                                                value={eq.installedPower ?? ''}
                                                onChange={e => {
                                                    const v = e.target.value === '' ? '' : Number(e.target.value)
                                                    onUpdate(eq.id, { installedPower: v as any })
                                                }}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="1"
                                                className="w-16 bg-gray-700 text-white border border-gray-600 px-1 py-0.5 rounded"
                                                value={(eq as any).usageFactor ?? ''}
                                                onChange={e => {
                                                    const v = e.target.value === '' ? '' : Number(e.target.value)
                                                    onUpdate(eq.id, { usageFactor: v as any })
                                                }}
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right">{typeof (eq as any).demandedPower !== 'undefined' ? Number((eq as any).demandedPower).toFixed(2) : '-'}</td>
                                        <td className="px-2 py-2 text-right">{typeof (eq as any).iNominalx125 !== 'undefined' ? Number((eq as any).iNominalx125).toFixed(2) : '-'}</td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                className="w-20 bg-gray-700 text-white border border-gray-600 px-1 py-0.5 rounded"
                                                value={(eq as any).protectionCurrent ?? ''}
                                                onChange={e => {
                                                    const v = e.target.value === '' ? '' : Number(e.target.value)
                                                    onUpdate(eq.id, { protectionCurrent: v as any })
                                                }}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                className="w-20 bg-gray-700 text-white border border-gray-600 px-1 py-0.5 rounded"
                                                value={(eq as any).conductorsPerPhase ?? ''}
                                                onChange={e => {
                                                    const v = e.target.value === '' ? '' : Number(e.target.value)
                                                    onUpdate(eq.id, { conductorsPerPhase: v as any })
                                                }}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <select
                                                className="w-24 bg-gray-700 text-white border border-gray-600 px-1 py-0.5 rounded"
                                                value={rawCaliber}
                                                onChange={e => onUpdate(eq.id, { caliber: e.target.value })}
                                            >
                                                <option value="--">--</option>
                                                {caliberOptions.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-2 py-2 text-right">{typeof (eq as any).calculatedAmpacity !== 'undefined' ? Number((eq as any).calculatedAmpacity).toFixed(0) : '-'}</td>
                                        <td className="px-2 py-2 text-right">{typeof (eq as any).calculatedAmpacityFac !== 'undefined' ? Number((eq as any).calculatedAmpacityFac).toFixed(0) : '-'}</td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-20 bg-gray-700 text-white border border-gray-600 px-1 py-0.5 rounded"
                                                value={(eq as any).conductorLength ?? ''}
                                                onChange={e => {
                                                    const v = e.target.value === '' ? '' : Number(e.target.value)
                                                    onUpdate(eq.id, { conductorLength: v as any })
                                                }}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                step="0.001"
                                                
                                                className="w-20 bg-gray-700 text-white border border-gray-600 px-1 py-0.5 rounded"
                                                value={(eq as any).resistance ?? ''}
                                                onChange={e => {
                                                    const v = e.target.value === '' ? '' : Number(e.target.value)
                                                    onUpdate(eq.id, { resistance: v as any })
                                                }}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                step="0.001"
                                                
                                                className="w-20 bg-gray-700 text-white border border-gray-600 px-1 py-0.5 rounded"
                                                value={(eq as any).inductiveReactance ?? ''}
                                                onChange={e => {
                                                    const v = e.target.value === '' ? '' : Number(e.target.value)
                                                    onUpdate(eq.id, { inductiveReactance: v as any })
                                                }}
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right">{typeof (eq as any).regulation !== 'undefined' ? Number((eq as any).regulation).toFixed(4) : '-'}</td>
                                        <td className="px-2 py-2 text-right">{typeof (eq as any).lossesPerc !== 'undefined' ? Number((eq as any).lossesPerc).toFixed(4) : '-'}</td>
                                        <td className="px-2 py-2">
                                            <button
                                                onClick={() => onDelete(eq.id)}
                                                className="px-2 py-1 rounded bg-red-600 text-white"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
