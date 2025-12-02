import React, { useMemo, useState, useEffect } from 'react'
import CommonInputs from './CommonInputs'
import EquipmentTableGallery, { Equipment } from './EquipmentTableGallery'
import { computeCalculatedFields } from '../lib/calculations'

type TabId = 'esential_loads' | 'non_esential_loads' | 'transfer_outputs' | 'dc_panel' | 'transformers_&_generators'

export default function CircuitTabs({
    memoryId,
    nonEseBool,
    dcBool,
    tranBool,
    genBool,
}: {
    memoryId?: string
    nonEseBool: boolean
    dcBool: boolean
    tranBool: boolean
    genBool: boolean
}) {
    const availableTabs = useMemo(() => {
        const t: { id: TabId; label: string }[] = [
            { id: 'esential_loads', label: 'Esential Loads' },
        ]
        if (nonEseBool) t.push({ id: 'non_esential_loads', label: 'Non Esential Loads' })
        if (tranBool) t.push({ id: 'transfer_outputs', label: 'Transfer Panels & Outputs' })
        if (dcBool) t.push({ id: 'dc_panel', label: 'DC Panel' })
        t.push({ id: 'transformers_&_generators', label: 'Transformers & Generators' })
        return t
    }, [nonEseBool, dcBool, tranBool, genBool])

    const [activeTab, setActiveTab] = useState<TabId>(availableTabs[0].id)
    const [equipments, setEquipments] = useState<Equipment[]>([])
    const [commonInputs, setCommonInputs] = useState<any>({ tensionKV: 0.48, powerFactor: 1, ambientTemperature: 30, conductorTemperature: '75°C', conductorsPerConduit: '1-3' })

    // No modal-config read (reverted POC localStorage reading). Use defaults.
    const defaultModalCfg = { niFactor: 1.25, deltaV: 5, percLoss: 3.88 }

    function handleAddEquipment() {
        const id = String(Date.now())
        const newEq: Equipment = {
            id,
            output: id,
            name: `Equipo ${equipments.length + 1}`,
            phases: 3,
            installedPower: '',
            usageFactor: '',
            protectionCurrent: '',
            conductorsPerPhase: 1,
            caliber: '',
            conductorLength: '',
            resistance: '',
            inductiveReactance: '',
        } as unknown as Equipment
        const cfg = defaultModalCfg
        const computed = computeCalculatedFields(newEq, commonInputs, cfg.niFactor, cfg.deltaV, cfg.percLoss)
        setEquipments(prev => [...prev, computed])
    }

    function handleDeleteEquipment(id: string) {
        setEquipments(prev => prev.filter(e => e.id !== id))
    }

    function handleUpdateEquipment(id: string, changes: Partial<Equipment>) {
        const cfg = defaultModalCfg
        setEquipments(prev => prev.map(e => {
            if (e.id !== id) return e
            const merged = { ...e, ...changes }
            return computeCalculatedFields(merged, commonInputs, cfg.niFactor, cfg.deltaV, cfg.percLoss)
        }))
    }

    // Recompute all equipment calculated fields whenever common inputs change
    useEffect(() => {
        const cfg = defaultModalCfg
        setEquipments(prev => prev.map(e => computeCalculatedFields(e, commonInputs, cfg.niFactor, cfg.deltaV, cfg.percLoss)))
    }, [commonInputs])

    return (
        <div className="rounded-lg overflow-hidden">
            <div className="bg-purple-500 text-white px-3 py-2 rounded-t-lg">
                <nav className="flex gap-2 overflow-x-auto hide-scrollbar">
                    {availableTabs.map(t => {
                        const isActive = t.id === activeTab
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`${isActive ? 'bg-red-500 text-white' : 'bg-purple-400 text-white/90'} px-3 py-1 rounded whitespace-nowrap`}
                                aria-pressed={isActive}
                            >
                                {t.label}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Common Inputs (promote inner gray card from CommonInputs) */}
            <div>
                <CommonInputs
                    memoryId={memoryId}
                    tabLabel={availableTabs.find(t => t.id === activeTab)?.label}
                    onChange={(s) => setCommonInputs(s)}
                />
            </div>

            {/* Equipment gallery */}
            <EquipmentTableGallery
                equipments={equipments}
                onAdd={handleAddEquipment}
                onDelete={handleDeleteEquipment}
                onUpdate={handleUpdateEquipment}
                commonInputs={commonInputs}
                validation={{ valid: true }}
            />
        </div>
    )
}
