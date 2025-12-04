import React, { useEffect, useState } from 'react'
import { caliberOptions, resistanceFromTable, inductiveReactanceFromTable, calculateINominalx125, suggestCaliber } from '../lib/calculations'

export type Equipment = {
    id: string
    output?: string
    name?: string
    phases?: 1 | 3
    installedPower?: number | ''
    usageFactor?: number | ''
    demandedPower?: number
    iNominalx125?: number
    protectionCurrent?: number | ''
    conductorsPerPhase?: number | ''
    caliber?: string
    calculatedAmpacity?: number
    calculatedAmpacityFac?: number
    conductorLength?: number | ''
    resistance?: number | ''
    inductiveReactance?: number | ''
    regulation?: number
    lossesPerc?: number
}

export default function EquipmentTableGallery({
    equipments = [],
    activeTab,
    onAdd,
    onDelete,
    onUpdate,
    validation,
    commonInputs,
}: {
    equipments?: Equipment[]
    activeTab?: string
    onAdd: () => void
    onDelete: (id: string) => void
    onUpdate: (id: string, changes: Partial<Equipment>) => void
    validation?: { valid: boolean; messages?: string[] }
    commonInputs?: any
}) {
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

    function getRowBgClass(eq: Equipment | any) {
        // selected/editing row (honeydew)
        if (selectedRowId && eq && eq.id === selectedRowId) return 'bg-green-50'

        const icb = (eq as any).ICBBool
        const reg = (eq as any).REGBool
        // some code paths may use PERBool instead of LOSBool; accept either
        const los = (eq as any).LOSBool !== undefined ? (eq as any).LOSBool : (eq as any).PERBool

        // all verifications passed -> green
        if (icb === true && reg === true && los === true) return 'bg-green-100'

        // any verification explicitly failed -> red
        if (icb === false || reg === false || los === false) return 'bg-red-50'

        // default
        return 'bg-white'
    }
    const [installedInputs, setInstalledInputs] = useState<Record<string, string>>({})
    const [installedErrors, setInstalledErrors] = useState<Record<string, string | null>>({})
    const [usageInputs, setUsageInputs] = useState<Record<string, string>>({})
    const [usageErrors, setUsageErrors] = useState<Record<string, string | null>>({})
    const [protectionInputs, setProtectionInputs] = useState<Record<string, string>>({})
    const [protectionErrors, setProtectionErrors] = useState<Record<string, string | null>>({})
    const [conductorsInputs, setConductorsInputs] = useState<Record<string, string>>({})
    const [conductorsErrors, setConductorsErrors] = useState<Record<string, string | null>>({})
    const [conductorLenInputs, setConductorLenInputs] = useState<Record<string, string>>({})
    const [conductorLenErrors, setConductorLenErrors] = useState<Record<string, string | null>>({})
    const [resistanceInputs, setResistanceInputs] = useState<Record<string, string>>({})
    const [resistanceErrors, setResistanceErrors] = useState<Record<string, string | null>>({})
    const [inductiveInputs, setInductiveInputs] = useState<Record<string, string>>({})
    const [inductiveErrors, setInductiveErrors] = useState<Record<string, string | null>>({})

    useEffect(() => {
        // initialize per-row buffers when equipments change, but preserve any
        // existing buffers so an in-progress edit (e.g. typing "0.") isn't
        // clobbered by a reinitialization triggered from parent updates.
        setInstalledInputs(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') {
                        next[eq.id] = eq.installedPower === undefined || eq.installedPower === '' ? '' : String(eq.installedPower)
                    }
                })
            return next
        })

        setInstalledErrors(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') next[eq.id] = null
                })
            return next
        })

        setUsageInputs(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') next[eq.id] = (eq as any).usageFactor === undefined || (eq as any).usageFactor === '' ? '' : String((eq as any).usageFactor)
                })
            return next
        })

        setUsageErrors(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') next[eq.id] = null
                })
            return next
        })

        setProtectionInputs(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') {
                        next[eq.id] = (eq as any).protectionCurrent === undefined || (eq as any).protectionCurrent === '' ? '' : String((eq as any).protectionCurrent)
                    }
                })
            return next
        })

        setProtectionErrors(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') next[eq.id] = null
                })
            return next
        })

        setConductorsInputs(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') {
                        next[eq.id] = (eq as any).conductorsPerPhase === undefined || (eq as any).conductorsPerPhase === '' ? '' : String((eq as any).conductorsPerPhase)
                    }
                })
            return next
        })

        setConductorsErrors(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') next[eq.id] = null
                })
            return next
        })

        setConductorLenInputs(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') {
                        next[eq.id] = (eq as any).conductorLength === undefined || (eq as any).conductorLength === '' ? '' : String((eq as any).conductorLength)
                    }
                })
            return next
        })

        setConductorLenErrors(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') next[eq.id] = null
                })
            return next
        })

        setResistanceInputs(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') {
                        next[eq.id] = (eq as any).resistance === undefined || (eq as any).resistance === '' ? '' : String((eq as any).resistance)
                    }
                })
            return next
        })

        setResistanceErrors(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') next[eq.id] = null
                })
            return next
        })

        setInductiveInputs(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') {
                        next[eq.id] = (eq as any).inductiveReactance === undefined || (eq as any).inductiveReactance === '' ? '' : String((eq as any).inductiveReactance)
                    }
                })
            return next
        })

        setInductiveErrors(prev => {
            const next = { ...prev }
                ; (equipments || []).forEach(eq => {
                    if (typeof next[eq.id] === 'undefined') next[eq.id] = null
                })
            return next
        })
    }, [equipments])

    function handleInstalledChange(id: string, raw: string) {
        // reject commas explicitly
        if (raw.includes(',')) {
            setInstalledErrors(prev => ({ ...prev, [id]: "Use '.' as decimal separator (no commas)" }))
            setInstalledInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        if (raw === '') {
            // user cleared; keep blank and clear error message for now
            setInstalledInputs(prev => ({ ...prev, [id]: raw }))
            setInstalledErrors(prev => ({ ...prev, [id]: '' }))
            return
        }

        const validPattern = /^\d*\.?\d*$/
        if (!validPattern.test(raw)) {
            setInstalledErrors(prev => ({ ...prev, [id]: "Only digits and '.' allowed" }))
            setInstalledInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        const parsed = Number(raw)
        if (isNaN(parsed)) {
            // Allow a single '.' as an intermediate input so the user can type decimals
            if (raw === '.') {
                setInstalledErrors(prev => ({ ...prev, [id]: null }))
                setInstalledInputs(prev => ({ ...prev, [id]: raw }))
                return
            }
            setInstalledErrors(prev => ({ ...prev, [id]: 'Invalid number' }))
            setInstalledInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        // enforce up to 2 decimal places
        if (raw.includes('.')) {
            const decimals = raw.split('.')[1] || ''
            if (decimals.length > 2) {
                setInstalledErrors(prev => ({ ...prev, [id]: 'Maximum 2 decimal places allowed' }))
                setInstalledInputs(prev => ({ ...prev, [id]: raw }))
                return
            }
        }

        if (parsed <= 0) {
            setInstalledErrors(prev => ({ ...prev, [id]: 'Installed power must be greater than 0' }))
            setInstalledInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        // valid: update model and clear error
        setInstalledErrors(prev => ({ ...prev, [id]: null }))
        setInstalledInputs(prev => ({ ...prev, [id]: raw }))
        onUpdate(id, { installedPower: parsed as any })
    }

    function handleUsageChange(id: string, raw: string) {
        if (raw.includes(',')) {
            setUsageErrors(prev => ({ ...prev, [id]: "Use '.' as decimal separator (no commas)" }))
            setUsageInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        if (raw === '') {
            setUsageInputs(prev => ({ ...prev, [id]: raw }))
            setUsageErrors(prev => ({ ...prev, [id]: '' }))
            return
        }

        const validPattern = /^\d*\.?\d*$/
        if (!validPattern.test(raw)) {
            setUsageErrors(prev => ({ ...prev, [id]: "Only digits and '.' allowed" }))
            setUsageInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        const parsed = Number(raw)
        if (isNaN(parsed)) {
            // Allow a single '.' as an intermediate input so the user can type decimals
            if (raw === '.') {
                setUsageErrors(prev => ({ ...prev, [id]: null }))
                setUsageInputs(prev => ({ ...prev, [id]: raw }))
                return
            }
            setUsageErrors(prev => ({ ...prev, [id]: 'Invalid number' }))
            setUsageInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        if (raw.includes('.')) {
            const decimals = raw.split('.')[1] || ''
            if (decimals.length > 2) {
                setUsageErrors(prev => ({ ...prev, [id]: 'Maximum 2 decimal places allowed' }))
                setUsageInputs(prev => ({ ...prev, [id]: raw }))
                return
            }
        }

        if (parsed < 0 || parsed > 1) {
            setUsageErrors(prev => ({ ...prev, [id]: 'Value must be between 0 and 1' }))
            setUsageInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        setUsageErrors(prev => ({ ...prev, [id]: null }))
        setUsageInputs(prev => ({ ...prev, [id]: raw }))
        onUpdate(id, { usageFactor: parsed as any })
    }

    function handleProtectionChange(id: string, raw: string) {
        // reject commas explicitly
        if (raw.includes(',')) {
            setProtectionErrors(prev => ({ ...prev, [id]: "Use '.' as decimal separator (no commas)" }))
            setProtectionInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        if (raw === '') {
            // user cleared; keep blank and clear error message for now
            setProtectionInputs(prev => ({ ...prev, [id]: raw }))
            setProtectionErrors(prev => ({ ...prev, [id]: '' }))
            return
        }

        const validPattern = /^\d*$/
        if (!validPattern.test(raw)) {
            setProtectionErrors(prev => ({ ...prev, [id]: "Only digits allowed (no decimals)" }))
            setProtectionInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        const parsed = Number(raw)
        if (isNaN(parsed)) {
            setProtectionErrors(prev => ({ ...prev, [id]: 'Invalid number' }))
            setProtectionInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        if (!Number.isInteger(parsed)) {
            setProtectionErrors(prev => ({ ...prev, [id]: 'Enter an integer value' }))
            setProtectionInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        if (parsed <= 0) {
            setProtectionErrors(prev => ({ ...prev, [id]: 'Protection current must be greater than 0' }))
            setProtectionInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        setProtectionErrors(prev => ({ ...prev, [id]: null }))
        setProtectionInputs(prev => ({ ...prev, [id]: raw }))
        onUpdate(id, { protectionCurrent: parsed as any })
    }

    function handleConductorsChange(id: string, raw: string) {
        // reject commas explicitly
        if (raw.includes(',')) {
            setConductorsErrors(prev => ({ ...prev, [id]: "Use only digits (no commas)" }))
            setConductorsInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        if (raw === '') {
            setConductorsInputs(prev => ({ ...prev, [id]: raw }))
            setConductorsErrors(prev => ({ ...prev, [id]: '' }))
            return
        }

        const validPattern = /^\d*$/
        if (!validPattern.test(raw)) {
            setConductorsErrors(prev => ({ ...prev, [id]: "Only digits allowed (no decimals)" }))
            setConductorsInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        const parsed = Number(raw)
        if (isNaN(parsed)) {
            setConductorsErrors(prev => ({ ...prev, [id]: 'Invalid number' }))
            setConductorsInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        if (!Number.isInteger(parsed)) {
            setConductorsErrors(prev => ({ ...prev, [id]: 'Enter an integer value' }))
            setConductorsInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        if (parsed <= 0) {
            setConductorsErrors(prev => ({ ...prev, [id]: 'Value must be greater than 0' }))
            setConductorsInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        setConductorsErrors(prev => ({ ...prev, [id]: null }))
        setConductorsInputs(prev => ({ ...prev, [id]: raw }))
        onUpdate(id, { conductorsPerPhase: parsed as any })
    }

    function handleConductorLengthChange(id: string, raw: string) {
        // reject commas explicitly
        if (raw.includes(',')) {
            setConductorLenErrors(prev => ({ ...prev, [id]: "Use '.' as decimal separator (no commas)" }))
            setConductorLenInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        if (raw === '') {
            // user cleared; keep blank and clear error message for now
            setConductorLenInputs(prev => ({ ...prev, [id]: raw }))
            setConductorLenErrors(prev => ({ ...prev, [id]: '' }))
            return
        }

        const validPattern = /^\d*\.?\d*$/
        if (!validPattern.test(raw)) {
            setConductorLenErrors(prev => ({ ...prev, [id]: "Only digits and '.' allowed" }))
            setConductorLenInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        const parsed = Number(raw)
        if (isNaN(parsed)) {
            // Allow a single '.' as an intermediate input so the user can type decimals
            if (raw === '.') {
                setConductorLenErrors(prev => ({ ...prev, [id]: null }))
                setConductorLenInputs(prev => ({ ...prev, [id]: raw }))
                return
            }
            setConductorLenErrors(prev => ({ ...prev, [id]: 'Invalid number' }))
            setConductorLenInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        // enforce up to 2 decimal places
        if (raw.includes('.')) {
            const decimals = raw.split('.')[1] || ''
            if (decimals.length > 2) {
                setConductorLenErrors(prev => ({ ...prev, [id]: 'Maximum 2 decimal places allowed' }))
                setConductorLenInputs(prev => ({ ...prev, [id]: raw }))
                return
            }
        }

        if (parsed <= 0) {
            setConductorLenErrors(prev => ({ ...prev, [id]: 'Length must be greater than 0' }))
            setConductorLenInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        // valid: update model and clear error
        setConductorLenErrors(prev => ({ ...prev, [id]: null }))
        setConductorLenInputs(prev => ({ ...prev, [id]: raw }))
        onUpdate(id, { conductorLength: parsed as any })
    }

    function handleResistanceChange(id: string, raw: string) {
        // reject commas explicitly
        if (raw.includes(',')) {
            setResistanceErrors(prev => ({ ...prev, [id]: "Use '.' as decimal separator (no commas)" }))
            setResistanceInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        if (raw === '') {
            // user cleared; keep blank and clear error message for now
            setResistanceInputs(prev => ({ ...prev, [id]: raw }))
            setResistanceErrors(prev => ({ ...prev, [id]: '' }))
            return
        }

        const validPattern = /^\d*\.?\d*$/
        if (!validPattern.test(raw)) {
            setResistanceErrors(prev => ({ ...prev, [id]: "Only digits and '.' allowed" }))
            setResistanceInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        const parsed = Number(raw)
        if (isNaN(parsed)) {
            // Allow a single '.' as an intermediate input so the user can type decimals
            if (raw === '.') {
                setResistanceErrors(prev => ({ ...prev, [id]: null }))
                setResistanceInputs(prev => ({ ...prev, [id]: raw }))
                return
            }
            setResistanceErrors(prev => ({ ...prev, [id]: 'Invalid number' }))
            setResistanceInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        // enforce up to 3 decimal places
        if (raw.includes('.')) {
            const decimals = raw.split('.')[1] || ''
            if (decimals.length > 3) {
                setResistanceErrors(prev => ({ ...prev, [id]: 'Maximum 3 decimal places allowed' }))
                setResistanceInputs(prev => ({ ...prev, [id]: raw }))
                return
            }
        }

        if (parsed <= 0) {
            setResistanceErrors(prev => ({ ...prev, [id]: 'Resistance must be greater than 0' }))
            setResistanceInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        // valid: update model and clear error
        setResistanceErrors(prev => ({ ...prev, [id]: null }))
        setResistanceInputs(prev => ({ ...prev, [id]: raw }))
        onUpdate(id, { resistance: parsed as any })
    }

    function handleInductiveChange(id: string, raw: string) {
        // reject commas explicitly
        if (raw.includes(',')) {
            setInductiveErrors(prev => ({ ...prev, [id]: "Use '.' as decimal separator (no commas)" }))
            setInductiveInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        if (raw === '') {
            // user cleared; keep blank and clear error message for now
            setInductiveInputs(prev => ({ ...prev, [id]: raw }))
            setInductiveErrors(prev => ({ ...prev, [id]: '' }))
            return
        }

        const validPattern = /^\d*\.?\d*$/
        if (!validPattern.test(raw)) {
            setInductiveErrors(prev => ({ ...prev, [id]: "Only digits and '.' allowed" }))
            setInductiveInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        const parsed = Number(raw)
        if (isNaN(parsed)) {
            // Allow a single '.' as an intermediate input so the user can type decimals
            if (raw === '.') {
                setInductiveErrors(prev => ({ ...prev, [id]: null }))
                setInductiveInputs(prev => ({ ...prev, [id]: raw }))
                return
            }
            setInductiveErrors(prev => ({ ...prev, [id]: 'Invalid number' }))
            setInductiveInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        // enforce up to 3 decimal places
        if (raw.includes('.')) {
            const decimals = raw.split('.')[1] || ''
            if (decimals.length > 3) {
                setInductiveErrors(prev => ({ ...prev, [id]: 'Maximum 3 decimal places allowed' }))
                setInductiveInputs(prev => ({ ...prev, [id]: raw }))
                return
            }
        }

        if (parsed <= 0) {
            setInductiveErrors(prev => ({ ...prev, [id]: 'Inductive reactance must be greater than 0' }))
            setInductiveInputs(prev => ({ ...prev, [id]: raw }))
            return
        }

        // valid: update model and clear error
        setInductiveErrors(prev => ({ ...prev, [id]: null }))
        setInductiveInputs(prev => ({ ...prev, [id]: raw }))
        onUpdate(id, { inductiveReactance: parsed as any })
    }
    // No wheel hijacking: let the mouse wheel control vertical scrolling only.
    return (
        <div className="bg-gray-300 text-black p-3 rounded-b-lg flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between mb-2">
                <div className="font-medium">⚡ Circuits ({equipments?.length ?? 0})</div>
                <button
                    onClick={onAdd}
                    className="bg-[var(--color-main,#85B726)] px-2 py-1 rounded text-sm"
                >
                    ➕ Add a Circuit
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
                <div className="text-sm text-black">No circuits added. Click '➕ Add a Circuit' to get started.</div>
            ) : (
                <div className="flex-1 overflow-auto mt-2 border border-gray-300 rounded min-h-0 relative hide-scrollbar">
                    <div className="overflow-x-auto overflow-y-visible min-w-full">
                        <table className="min-w-max w-full text-left text-sm">
                            <thead className="bg-gray-500 sticky top-0 z-10">
                                <tr>
                                    {activeTab === 'dc_panel' ? (
                                        <>
                                            <th className="px-2 py-2">Out</th>
                                            <th className="px-2 py-2">Name</th>
                                            <th className="px-2 py-2">T. Charge</th>
                                            <th className="px-2 py-2">Equ.Qty.</th>
                                            <th className="px-2 py-2">U.I.P.</th>
                                            <th className="px-2 py-2">Dem.F.</th>
                                            <th className="px-2 py-2">Nom.CxF</th>
                                            <th className="px-2 py-2">Prot.I</th>
                                            <th className="px-2 py-2">CxPha</th>
                                            <th className="px-2 py-2">Cal</th>
                                            <th className="px-2 py-2">xN</th>
                                            <th className="px-2 py-2">L[km]</th>
                                            <th className="px-2 py-2">R[Ω/km]</th>
                                            <th className="px-2 py-2">REG</th>
                                            <th className="px-2 py-2">LOS</th>
                                            <th className="px-2 py-2">Del</th>
                                        </>
                                    ) : (
                                        <>
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
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {equipments.map((eq, idx) => {
                                    // defensive: skip malformed rows without an id
                                    if (!eq || !eq.id) return null
                                    const rawCaliber = (eq as any).caliber ?? ''
                                    const resPlaceholder = rawCaliber !== '' ? resistanceFromTable(rawCaliber, commonInputs?.conductorMaterial ?? 'Cu', commonInputs?.conduitMaterial ?? 'PVC') : undefined
                                    const xlPlaceholder = rawCaliber !== '' ? inductiveReactanceFromTable(rawCaliber, commonInputs?.conduitMaterial ?? 'PVC') : undefined

                                    // verification flags used for row/background and per-column color coding
                                    const icbFlag = (eq as any).ICBBool
                                    const regFlag = (eq as any).REGBool
                                    const losFlag = (eq as any).LOSBool !== undefined ? (eq as any).LOSBool : (eq as any).PERBool

                                    // compute local iNominalx125 if not present on the row
                                    const localINominalx125 = Number((eq as any).iNominalx125 || calculateINominalx125(Number(eq.installedPower || 0), Number(commonInputs?.tensionKV || 0), Number(eq.phases || 3)))
                                    const suggested = suggestCaliber(Number(eq.protectionCurrent || 0), localINominalx125, Number(eq.conductorsPerPhase || 1), commonInputs)

                                    const rowBg = getRowBgClass(eq)
                                    const evenClass = idx % 2 === 0 ? 'bg-gray-100/60' : ''

                                    // DC panel has a different column layout
                                    if (activeTab === 'dc_panel') {
                                        return (
                                            <tr key={eq.id} onDoubleClick={() => setSelectedRowId(eq.id)} className={`${evenClass} ${rowBg}`}>
                                                <td className="px-2 py-2">
                                                    <input className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded" value={(eq as any).dcoutput ?? ''} onChange={e => onUpdate(eq.id, { dcoutput: e.target.value } as any)} />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input className="w-36 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded" value={(eq as any).dcname ?? ''} onChange={e => onUpdate(eq.id, { dcname: e.target.value } as any)} />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <select className="bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded" value={(eq as any).chargeType ?? 'Con'} onChange={e => onUpdate(eq.id, { chargeType: e.target.value } as any)}>
                                                        <option value="Con">Con</option>
                                                        <option value="Mom">Mom</option>
                                                    </select>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="text" inputMode="numeric" className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded" value={String((eq as any).equipmentNumber ?? '')} onChange={e => onUpdate(eq.id, { equipmentNumber: Number(e.target.value) || '' } as any)} />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="text" inputMode="numeric" className="w-24 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded" value={String((eq as any).unitInstalledPower ?? '')} onChange={e => onUpdate(eq.id, { unitInstalledPower: Number(e.target.value) || '' } as any)} />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="text" inputMode="decimal" className="w-16 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded" value={String((eq as any).demandedPowerFactor ?? '')} onChange={e => onUpdate(eq.id, { demandedPowerFactor: Number(e.target.value) || '' } as any)} />
                                                </td>
                                                <td className="px-2 py-2 text-right">{typeof (eq as any).InFac !== 'undefined' ? Number((eq as any).InFac).toFixed(2) : '-'}</td>
                                                <td className="px-2 py-2">
                                                    <input type="text" inputMode="numeric" className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded" value={String((eq as any).dcprotectionCurrent ?? '')} onChange={e => onUpdate(eq.id, { dcprotectionCurrent: Number(e.target.value) || '' } as any)} />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="text" inputMode="numeric" className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded" value={String((eq as any).dcconductorsPerPhase ?? '')} onChange={e => onUpdate(eq.id, { dcconductorsPerPhase: Number(e.target.value) || '' } as any)} />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <select className={`w-24 bg-gray-100 border border-gray-600 px-1 py-0.5 rounded`} value={(eq as any).dccaliber ?? ''} onChange={e => onUpdate(eq.id, { dccaliber: e.target.value } as any)}>
                                                        <option value="">--</option>
                                                        {caliberOptions.map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-2 py-2 text-right">{typeof (eq as any).dccalculatedAmpacity !== 'undefined' ? Number((eq as any).dccalculatedAmpacity).toFixed(0) : '-'}</td>
                                                <td className="px-2 py-2">
                                                    <input type="text" inputMode="decimal" className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded" value={String((eq as any).dcconductorLength ?? '')} onChange={e => onUpdate(eq.id, { dcconductorLength: Number(e.target.value) || '' } as any)} />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="text" inputMode="decimal" className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded" value={String((eq as any).dcresistance ?? '')} onChange={e => onUpdate(eq.id, { dcresistance: Number(e.target.value) || '' } as any)} />
                                                </td>
                                                <td className="px-2 py-2 text-right">{typeof (eq as any).dcregulation !== 'undefined' ? `${Number((eq as any).dcregulation).toFixed(2)}%` : '-'}</td>
                                                <td className="px-2 py-2 text-right">{typeof (eq as any).dclossesPerc !== 'undefined' ? `${Number((eq as any).dclossesPerc).toFixed(2)}%` : '-'}</td>
                                                <td className="px-2 py-2">
                                                    <button onClick={() => onDelete(eq.id)} className="px-2 py-1 rounded bg-red-600 text-white">🗑️</button>
                                                </td>
                                            </tr>
                                        )
                                    }

                                    // default (esential / non esential / transfer)
                                    return (
                                        <tr key={eq.id} onDoubleClick={() => setSelectedRowId(eq.id)} className={`${evenClass} ${rowBg}`}>
                                            <td className="px-2 py-2">
                                                <input
                                                    className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded"
                                                    value={eq.output ?? ''}
                                                    onChange={e => onUpdate(eq.id, { output: e.target.value })}
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    className="w-36 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded"
                                                    value={eq.name ?? ''}
                                                    onChange={e => onUpdate(eq.id, { name: e.target.value })}
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <select
                                                    className="bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded"
                                                    value={String(eq.phases ?? 3)}
                                                    onChange={e => onUpdate(eq.id, { phases: Number(e.target.value) as 1 | 3 })}
                                                >
                                                    <option value={3}>3</option>
                                                    <option value={1}>1</option>
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="relative">
                                                    {installedErrors[eq.id] && installedErrors[eq.id] !== '' && (
                                                        <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-sm z-30 whitespace-nowrap pointer-events-none">
                                                            <div className="transform -translate-y-1 text-center">{installedErrors[eq.id]}</div>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded"
                                                        value={installedInputs[eq.id] ?? (eq.installedPower === undefined || eq.installedPower === '' ? '' : String(eq.installedPower))}
                                                        onChange={e => handleInstalledChange(eq.id, e.target.value)}
                                                        onBlur={() => {
                                                            if ((installedInputs[eq.id] ?? '') === '') {
                                                                const prev = eq.installedPower === undefined || eq.installedPower === '' ? '' : String(eq.installedPower)
                                                                setInstalledInputs(prevState => ({ ...prevState, [eq.id]: prev }))
                                                                setInstalledErrors(prev => ({ ...prev, [eq.id]: null }))
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="relative">
                                                    {usageErrors[eq.id] && usageErrors[eq.id] !== '' && (
                                                        <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-sm z-30 whitespace-nowrap pointer-events-none">
                                                            <div className="transform -translate-y-1 text-center">{usageErrors[eq.id]}</div>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        className="w-16 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded"
                                                        value={usageInputs[eq.id] ?? ((eq as any).usageFactor === undefined || (eq as any).usageFactor === '' ? '' : String((eq as any).usageFactor))}
                                                        onChange={e => {
                                                            if (activeTab === 'transfer_outputs') return
                                                            handleUsageChange(eq.id, e.target.value)
                                                        }}
                                                        onBlur={() => {
                                                            if ((usageInputs[eq.id] ?? '') === '') {
                                                                const prevVal = (eq as any).usageFactor === undefined || (eq as any).usageFactor === '' ? '' : String((eq as any).usageFactor)
                                                                setUsageInputs(prevState => ({ ...prevState, [eq.id]: prevVal }))
                                                                setUsageErrors(prev => ({ ...prev, [eq.id]: null }))
                                                            }
                                                        }}
                                                        disabled={activeTab === 'transfer_outputs'}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-right">
                                                {activeTab === 'transfer_outputs' ? (
                                                    <select className="w-28 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded" value={String((eq as any).demandedPower ?? '')} onChange={e => onUpdate(eq.id, { demandedPower: e.target.value } as any)}>
                                                        <option value="">--</option>
                                                        <option value="Ese">Ese</option>
                                                        <option value="NonEse">NonEse</option>
                                                        <option value="Ese&NonEse">Ese & NonEse</option>
                                                    </select>
                                                ) : (
                                                    <span>{typeof (eq as any).demandedPower !== 'undefined' ? Number((eq as any).demandedPower).toFixed(2) : '-'}</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 text-right">{typeof (eq as any).iNominalx125 !== 'undefined' ? Number((eq as any).iNominalx125).toFixed(2) : '-'}</td>
                                            <td className="px-2 py-2">
                                                <div className="relative">
                                                    {protectionErrors[eq.id] && protectionErrors[eq.id] !== '' && (
                                                        <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-sm z-30 whitespace-nowrap pointer-events-none">
                                                            <div className="transform -translate-y-1 text-center">{protectionErrors[eq.id]}</div>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded"
                                                        value={protectionInputs[eq.id] ?? ((eq as any).protectionCurrent === undefined || (eq as any).protectionCurrent === '' ? '' : String((eq as any).protectionCurrent))}
                                                        onChange={e => handleProtectionChange(eq.id, e.target.value)}
                                                        onBlur={() => {
                                                            if ((protectionInputs[eq.id] ?? '') === '') {
                                                                const prev = (eq as any).protectionCurrent === undefined || (eq as any).protectionCurrent === '' ? '' : String((eq as any).protectionCurrent)
                                                                setProtectionInputs(prevState => ({ ...prevState, [eq.id]: prev }))
                                                                setProtectionErrors(prev => ({ ...prev, [eq.id]: null }))
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="relative">
                                                    {conductorsErrors[eq.id] && conductorsErrors[eq.id] !== '' && (
                                                        <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-sm z-30 whitespace-nowrap pointer-events-none">
                                                            <div className="transform -translate-y-1 text-center">{conductorsErrors[eq.id]}</div>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded"
                                                        value={conductorsInputs[eq.id] ?? ((eq as any).conductorsPerPhase === undefined || (eq as any).conductorsPerPhase === '' ? '' : String((eq as any).conductorsPerPhase))}
                                                        onChange={e => handleConductorsChange(eq.id, e.target.value)}
                                                        onBlur={() => {
                                                            if ((conductorsInputs[eq.id] ?? '') === '') {
                                                                const prev = (eq as any).conductorsPerPhase === undefined || (eq as any).conductorsPerPhase === '' ? '' : String((eq as any).conductorsPerPhase)
                                                                setConductorsInputs(prevState => ({ ...prevState, [eq.id]: prev }))
                                                                setConductorsErrors(prev => ({ ...prev, [eq.id]: null }))
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <select
                                                    className={`w-24 bg-gray-100 border border-gray-600 px-1 py-0.5 rounded ${icbFlag === true ? 'text-green-700' : icbFlag === false ? 'text-red-600' : 'text-black'}`}
                                                    value={rawCaliber}
                                                    onChange={e => onUpdate(eq.id, { caliber: e.target.value })}
                                                >
                                                    <option value="">{suggested ? `Suggested: ${suggested}` : '--'}</option>
                                                    {caliberOptions.map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2 text-right">{typeof (eq as any).calculatedAmpacity !== 'undefined' ? Number((eq as any).calculatedAmpacity).toFixed(0) : '-'}</td>
                                            <td className="px-2 py-2 text-right">{typeof (eq as any).calculatedAmpacityFac !== 'undefined' ? Number((eq as any).calculatedAmpacityFac).toFixed(0) : '-'}</td>
                                            <td className="px-2 py-2">
                                                <div className="relative">
                                                    {conductorLenErrors[eq.id] && conductorLenErrors[eq.id] !== '' && (
                                                        <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-sm z-30 whitespace-nowrap pointer-events-none">
                                                            <div className="transform -translate-y-1 text-center">{conductorLenErrors[eq.id]}</div>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded"
                                                        value={conductorLenInputs[eq.id] ?? ((eq as any).conductorLength === undefined || (eq as any).conductorLength === '' ? '' : String((eq as any).conductorLength))}
                                                        onChange={e => handleConductorLengthChange(eq.id, e.target.value)}
                                                        onBlur={() => {
                                                            if ((conductorLenInputs[eq.id] ?? '') === '') {
                                                                const prev = (eq as any).conductorLength === undefined || (eq as any).conductorLength === '' ? '' : String((eq as any).conductorLength)
                                                                setConductorLenInputs(prevState => ({ ...prevState, [eq.id]: prev }))
                                                                setConductorLenErrors(prev => ({ ...prev, [eq.id]: null }))
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="relative">
                                                    {resistanceErrors[eq.id] && resistanceErrors[eq.id] !== '' && (
                                                        <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-sm z-30 whitespace-nowrap pointer-events-none">
                                                            <div className="transform -translate-y-1 text-center">{resistanceErrors[eq.id]}</div>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded"
                                                        value={resistanceInputs[eq.id] ?? ((eq as any).resistance === undefined || (eq as any).resistance === '' ? '' : String((eq as any).resistance))}
                                                        placeholder={typeof resPlaceholder === 'number' && !isNaN(resPlaceholder) ? resPlaceholder.toFixed(3) : ''}
                                                        onChange={e => handleResistanceChange(eq.id, e.target.value)}
                                                        onBlur={() => {
                                                            if ((resistanceInputs[eq.id] ?? '') === '') {
                                                                const prev = (eq as any).resistance === undefined || (eq as any).resistance === '' ? '' : String((eq as any).resistance)
                                                                setResistanceInputs(prevState => ({ ...prevState, [eq.id]: prev }))
                                                                setResistanceErrors(prev => ({ ...prev, [eq.id]: null }))
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="relative">
                                                    {inductiveErrors[eq.id] && inductiveErrors[eq.id] !== '' && (
                                                        <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-sm z-30 whitespace-nowrap pointer-events-none">
                                                            <div className="transform -translate-y-1 text-center">{inductiveErrors[eq.id]}</div>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        className="w-20 bg-gray-100 text-black border border-gray-600 px-1 py-0.5 rounded"
                                                        value={inductiveInputs[eq.id] ?? ((eq as any).inductiveReactance === undefined || (eq as any).inductiveReactance === '' ? '' : String((eq as any).inductiveReactance))}
                                                        placeholder={typeof xlPlaceholder === 'number' && !isNaN(xlPlaceholder) ? xlPlaceholder.toFixed(3) : ''}
                                                        onChange={e => handleInductiveChange(eq.id, e.target.value)}
                                                        onBlur={() => {
                                                            if ((inductiveInputs[eq.id] ?? '') === '') {
                                                                const prev = (eq as any).inductiveReactance === undefined || (eq as any).inductiveReactance === '' ? '' : String((eq as any).inductiveReactance)
                                                                setInductiveInputs(prevState => ({ ...prevState, [eq.id]: prev }))
                                                                setInductiveErrors(prev => ({ ...prev, [eq.id]: null }))
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-right">
                                                {typeof (eq as any).regulation !== 'undefined' ? (
                                                    <span className={`${regFlag === true ? 'text-green-700' : regFlag === false ? 'text-red-600' : ''}`}>{`${Number((eq as any).regulation).toFixed(2)}%`}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-2 py-2 text-right">
                                                {typeof (eq as any).lossesPerc !== 'undefined' ? (
                                                    <span className={`${losFlag === true ? 'text-green-700' : losFlag === false ? 'text-red-600' : ''}`}>{`${Number((eq as any).lossesPerc).toFixed(2)}%`}</span>
                                                ) : '-'}
                                            </td>
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
                </div>
            )}
        </div>
    )
}
