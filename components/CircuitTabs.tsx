import React, { useMemo, useState, useEffect, useCallback } from 'react'
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
    memoryId: string | undefined
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

    const [activeTab, setActiveTab] = useState<TabId>(availableTabs[0]?.id ?? 'esential_loads')
    // store equipments per tab so each tab has its own gallery
    const [equipmentsByTab, setEquipmentsByTab] = useState<Record<string, Equipment[]>>({})
    // store common inputs per tab
    const [commonByTab, setCommonByTab] = useState<Record<string, any>>({})

    // No modal-config read (reverted POC localStorage reading). Use defaults.
    const defaultModalCfg = { niFactor: 1.25, deltaV: 5, percLoss: 3.88 }

    function handleAddEquipment() {
        const id = String(Date.now())
        const currentEquipments = equipmentsByTab[activeTab] || []
        const newEq: Equipment = {
            id,
            output: id,
            name: `Equipo ${currentEquipments.length + 1}`,
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
        const commonInputsForTab = commonByTab[activeTab] || { tensionKV: 0.48, powerFactor: 1, ambientTemperature: 30, conductorTemperature: '75°C', conductorsPerConduit: '1-3' }
        const computed = computeCalculatedFields(newEq, commonInputsForTab, cfg.niFactor, cfg.deltaV, cfg.percLoss)
        setEquipmentsByTab(prev => ({ ...prev, [activeTab]: [...currentEquipments, computed] }))
    }

    function handleDeleteEquipment(id: string) {
        const currentEquipments = equipmentsByTab[activeTab] || []
        setEquipmentsByTab(prev => ({ ...prev, [activeTab]: currentEquipments.filter(e => e.id !== id) }))
    }

    function handleUpdateEquipment(id: string, changes: Partial<Equipment>) {
        const cfg = defaultModalCfg
        const currentEquipments = equipmentsByTab[activeTab] || []
        const commonInputsForTab = commonByTab[activeTab] || { tensionKV: 0.48, powerFactor: 1, ambientTemperature: 30, conductorTemperature: '75°C', conductorsPerConduit: '1-3' }
        const updated = currentEquipments.map(e => {
            if (e.id !== id) return e
            const merged = { ...e, ...changes }
            return computeCalculatedFields(merged, commonInputsForTab, cfg.niFactor, cfg.deltaV, cfg.percLoss)
        })
        setEquipmentsByTab(prev => ({ ...prev, [activeTab]: updated }))
    }

    // Recompute all equipment calculated fields whenever common inputs for the active tab change
    useEffect(() => {
        const cfg = defaultModalCfg
        const commonInputsForTab = commonByTab[activeTab] || { tensionKV: 0.48, powerFactor: 1, ambientTemperature: 30, conductorTemperature: '75°C', conductorsPerConduit: '1-3' }
        const currentEquipments = equipmentsByTab[activeTab] || []
        const recomputed = currentEquipments.map(e => computeCalculatedFields(e, commonInputsForTab, cfg.niFactor, cfg.deltaV, cfg.percLoss))
        setEquipmentsByTab(prev => ({ ...prev, [activeTab]: recomputed }))
    }, [commonByTab, activeTab])

    return (
        <div className="rounded-t-lg overflow-hidden flex flex-col h-full min-h-0">
            <div className="bg-white text-black px-3 py-0 rounded-t-lg">
                <nav className="flex gap-2 overflow-x-auto hide-scrollbar">
                    {availableTabs.map(t => {
                        const isActive = t.id === activeTab
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`${isActive ? 'bg-gray-300 text-black' : 'bg-gray-400 text-white/90'} px-3 py-1 rounded-t-lg whitespace-nowrap`}
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
                    memoryId={memoryId as string | undefined}
                    tabLabel={availableTabs.find(t => t.id === activeTab)?.label}
                    activeTab={activeTab}
                    onChange={useCallback((s: any) => setCommonByTab(prev => ({ ...prev, [activeTab]: s })), [activeTab])}
                />
            </div>

            {/* Equipment gallery */}
            <div className="flex-1 min-h-0">
                <EquipmentTableGallery
                    activeTab={activeTab}
                    equipments={equipmentsByTab[activeTab] || []}
                    onAdd={handleAddEquipment}
                    onDelete={handleDeleteEquipment}
                    onUpdate={handleUpdateEquipment}
                    commonInputs={commonByTab[activeTab] || { tensionKV: 0.48, powerFactor: 1, ambientTemperature: 30, conductorTemperature: '75°C', conductorsPerConduit: '1-3' }}
                    validation={{ valid: true }}
                />
            </div>
        </div>
    )
}
