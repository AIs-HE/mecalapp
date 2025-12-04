import React, { useEffect, useState } from 'react'
import conductorTypes from '../data/conductor_types.json'

/*
 * CommonInputs
 *
 * What we implemented:
 * - Central source for shared calculation inputs used by the equipment table
 *   (installationType, tensionKV, powerFactor, conductorMaterial, conductorTemperature,
 *   ambientTemperature, conductorType, conductorsPerConduit, conduitMaterial).
 * - Loads persisted modal configuration from `localStorage` (key
 *   `circuit_config:<memoryId>`) to prefill sensible defaults where available.
 * - Emits changes via `onChange` so parent components recompute calculated fields
 *   when common inputs are modified.
 */

export interface CommonInputsState {
    installationType: 'Conduit' | 'Exposed'
    tensionKV: number
    powerFactor: number
    conductorMaterial: 'Cu' | 'Al'
    conductorTemperature: '60°C' | '75°C' | '90°C'
    ambientTemperature: number
    conductorType: string
    conductorsPerConduit: string
    conduitMaterial: 'PVC' | 'Aluminum' | 'Steel'
}

const defaultState: CommonInputsState = {
    installationType: 'Conduit',
    tensionKV: 0.48,
    powerFactor: 1.0,
    conductorMaterial: 'Cu',
    conductorTemperature: '75°C',
    ambientTemperature: 30,
    conductorType: '',
    conductorsPerConduit: '1-3',
    conduitMaterial: 'PVC',
}

export default function CommonInputs({ memoryId, onChange, tabLabel }: { memoryId: string | undefined, onChange?: (s: CommonInputsState) => void, tabLabel?: string | undefined }) {
    const [collapsed, setCollapsed] = useState(false)
    const [state, setState] = useState<CommonInputsState>(defaultState)
    // local editing buffer + error for tensionKV so we can reject invalid inputs
    const [tensionInput, setTensionInput] = useState<string>(String(defaultState.tensionKV))
    const [tensionError, setTensionError] = useState<string | null>(null)
    const [powerInput, setPowerInput] = useState<string>(String(defaultState.powerFactor))
    const [powerError, setPowerError] = useState<string | null>(null)
    const [ambientInput, setAmbientInput] = useState<string>(String(defaultState.ambientTemperature))
    const [ambientError, setAmbientError] = useState<string | null>(null)

    // No localStorage prefill — keep defaults unless parent provides overrides

    useEffect(() => {
        if (onChange) onChange(state)
    }, [state, onChange])

    // when material or temperature changes, ensure conductorType stays valid
    useEffect(() => {
        const mat = state.conductorMaterial || 'Cu'
        const temp = (state.conductorTemperature || '75°C').replace('°C', '')
        const opts: string[] = ((conductorTypes as any)[mat] && (conductorTypes as any)[mat][temp]) || []
        if (opts.length === 0) return
        if (!state.conductorType || !opts.includes(state.conductorType)) {
            // default to first option (ensure string, not undefined)
            setState(prev => ({ ...prev, conductorType: opts[0] ?? '' }))
        }
    }, [state.conductorMaterial, state.conductorTemperature])

    function update<K extends keyof CommonInputsState>(k: K, v: CommonInputsState[K]) {
        setState(prev => ({ ...prev, [k]: v }))
    }

    // validate tension input: only digits and at most one '.', no commas; keep
    // underlying numeric state unchanged unless parsed value > 0
    function handleTensionChange(raw: string) {
        // immediate checks for forbidden characters
        if (raw.includes(',')) {
            setTensionError("Use '.' as decimal separator (no commas)")
            setTensionInput(raw)
            return
        }

        // allow empty (user clearing) but don't accept it as numeric state
        if (raw === '') {
            setTensionInput(raw)
            setTensionError('')
            return
        }

        // only digits and a single dot
        const validPattern = /^\d*\.?\d*$/
        if (!validPattern.test(raw)) {
            setTensionError("Only digits and '.' allowed")
            setTensionInput(raw)
            return
        }

        // syntactically valid; parse number
        const parsed = Number(raw)
        if (isNaN(parsed)) {
            setTensionError('Invalid number')
            setTensionInput(raw)
            return
        }

        // parsed number is valid syntax; enforce > 0 when accepting into model
        if (parsed <= 0) {
            // don't accept into state.tensionKV, but show inline warning
            setTensionError('Tension must be greater than 0')
            setTensionInput(raw)
            return
        }

        // valid and > 0: accept
        setTensionError(null)
        setTensionInput(raw)
        setState(prev => ({ ...prev, tensionKV: parsed }))
    }

    // validate power factor: only digits and at most one '.', no commas; must be between 0 and 1
    function handlePowerChange(raw: string) {
        if (raw.includes(',')) {
            setPowerError("Use '.' as decimal separator (no commas)")
            setPowerInput(raw)
            return
        }

        if (raw === '') {
            setPowerInput(raw)
            setPowerError('')
            return
        }

        const validPattern = /^\d*\.?\d*$/
        if (!validPattern.test(raw)) {
            setPowerError("Only digits and '.' allowed")
            setPowerInput(raw)
            return
        }

        const parsed = Number(raw)
        if (isNaN(parsed)) {
            setPowerError('Invalid number')
            setPowerInput(raw)
            return
        }

        if (parsed < 0 || parsed > 1) {
            setPowerError('Power factor must be between 0 and 1')
            setPowerInput(raw)
            return
        }

        setPowerError(null)
        setPowerInput(raw)
        setState(prev => ({ ...prev, powerFactor: parsed }))
    }

    // validate ambient temperature: integer only (optional leading '-'), no commas; range -20..100
    function handleAmbientChange(raw: string) {
        if (raw.includes(',')) {
            setAmbientError("Use only digits (no commas)")
            setAmbientInput(raw)
            return
        }

        if (raw === '') {
            setAmbientInput(raw)
            setAmbientError('')
            return
        }

        const validPattern = /^-?\d*$/
        if (!validPattern.test(raw)) {
            setAmbientError("Only digits and optional leading '-' allowed")
            setAmbientInput(raw)
            return
        }

        const parsed = Number(raw)
        if (isNaN(parsed)) {
            setAmbientError('Invalid number')
            setAmbientInput(raw)
            return
        }

        if (parsed < -20 || parsed > 100) {
            setAmbientError('Ambient temperature must be between -20 and 100')
            setAmbientInput(raw)
            return
        }

        setAmbientError(null)
        setAmbientInput(raw)
        setState(prev => ({ ...prev, ambientTemperature: parsed }))
    }

    return (
        <div className="bg-gray-300 text-black rounded-lg shadow-md p-3">
            <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">📊 Common data{tabLabel ? ` - ${tabLabel}` : ''}</div>
                <button aria-label="toggle common inputs" onClick={() => setCollapsed(!collapsed)} className="text-black/90">{collapsed ? '▸' : '▾'}</button>
            </div>

            {!collapsed && (
                <div className="grid grid-cols-3 gap-3 common-inputs-grid">
                    <div>
                        <div className="text-xs mb-1 text-[#85C538]">Type of installation</div>
                        <select className="w-full mt-1 text-sm p-1 rounded text-black" value={state.installationType} onChange={(e) => update('installationType', e.target.value as any)}>
                            <option>Conduit</option>
                            <option>Exposed</option>
                        </select>
                    </div>

                    <div>
                        <div className="text-xs mb-1 text-[#85C538]">Tension (kV)</div>
                        <input
                            type="text"
                            inputMode="decimal"
                            className="w-full mt-1 text-sm p-1 rounded text-black"
                            value={tensionInput}
                            onChange={(e) => handleTensionChange(e.target.value)}
                            onBlur={() => {
                                // on blur, if empty, restore previous numeric value
                                if (tensionInput === '') {
                                    setTensionInput(String(state.tensionKV || defaultState.tensionKV))
                                    setTensionError(null)
                                }
                            }}
                        />
                        {tensionError !== null && tensionError !== '' && (
                            <div role="alert" className="mt-1 text-xs text-red-700 bg-red-100 p-1 rounded">
                                {tensionError}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="text-xs mb-1 text-[#85C538]">Power Factor</div>
                        <input
                            type="text"
                            inputMode="decimal"
                            className="w-full mt-1 text-sm p-1 rounded text-black"
                            value={powerInput}
                            onChange={(e) => handlePowerChange(e.target.value)}
                            onBlur={() => {
                                if (powerInput === '') {
                                    setPowerInput(String(state.powerFactor ?? defaultState.powerFactor))
                                    setPowerError(null)
                                }
                            }}
                        />
                        {powerError !== null && powerError !== '' && (
                            <div role="alert" className="mt-1 text-xs text-red-700 bg-red-100 p-1 rounded">
                                {powerError}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="text-xs mb-1 text-[#85C538]">Conductor Material</div>
                        <select className="w-full mt-1 text-sm p-1 rounded text-black" value={state.conductorMaterial} onChange={(e) => update('conductorMaterial', e.target.value as any)}>
                            <option value="Cu">Cu</option>
                            <option value="Al">Al</option>
                        </select>
                    </div>

                    <div>
                        <div className="text-xs mb-1 text-[#85C538]">Conductor Temp</div>
                        <select className="w-full mt-1 text-sm p-1 rounded text-black" value={state.conductorTemperature} onChange={(e) => update('conductorTemperature', e.target.value as any)}>
                            <option>60°C</option>
                            <option>75°C</option>
                            <option>90°C</option>
                        </select>
                    </div>

                    <div>
                        <div className="text-xs mb-1 text-[#85C538]">Ambient Temp (°C)</div>
                        <input
                            type="text"
                            inputMode="numeric"
                            className="w-full mt-1 text-sm p-1 rounded text-black"
                            value={ambientInput}
                            onChange={(e) => handleAmbientChange(e.target.value)}
                            onBlur={() => {
                                if (ambientInput === '') {
                                    setAmbientInput(String(state.ambientTemperature ?? defaultState.ambientTemperature))
                                    setAmbientError(null)
                                }
                            }}
                        />
                        {ambientError !== null && ambientError !== '' && (
                            <div role="alert" className="mt-1 text-xs text-red-700 bg-red-100 p-1 rounded">
                                {ambientError}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="text-xs mb-1 text-[#85C538]">Conductors per Conduit</div>
                        <select className="w-full mt-1 text-sm p-1 rounded text-black" value={state.conductorsPerConduit} onChange={(e) => update('conductorsPerConduit', e.target.value)}>
                            <option>1-3</option>
                            <option>4-6</option>
                            <option>7-9</option>
                            <option>10-20</option>
                            <option>21-24</option>
                            <option>25-30</option>
                            <option>31-40</option>
                            <option>41-42</option>
                            <option>43-more</option>
                        </select>
                    </div>

                    <div>
                        <div className="text-xs mb-1 text-[#85C538]">Conduit Material</div>
                        <select className="w-full mt-1 text-sm p-1 rounded text-black" value={state.conduitMaterial} onChange={(e) => update('conduitMaterial', e.target.value as any)}>
                            <option>PVC</option>
                            <option>Aluminum</option>
                            <option>Steel</option>
                        </select>
                    </div>

                    <div>
                        <div className="text-xs mb-1 text-[#85C538]">Conductor Type</div>
                        {/* populate options from conductor_types.json based on material + temperature */}
                        <select
                            className="w-full mt-1 text-sm p-1 rounded text-black"
                            value={state.conductorType}
                            onChange={(e) => update('conductorType', e.target.value)}
                        >
                            <option value="">-- select conductor type --</option>
                            {(() => {
                                const mat = state.conductorMaterial || 'Cu'
                                const temp = (state.conductorTemperature || '75°C').replace('°C', '')
                                const opts: string[] = ((conductorTypes as any)[mat] && (conductorTypes as any)[mat][temp]) || []
                                return opts.map((o) => <option key={o} value={o}>{o}</option>)
                            })()}
                        </select>
                    </div>
                </div>
            )}
        </div>
    )
}
