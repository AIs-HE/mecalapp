import React, { useEffect, useState } from 'react'
import conductorTypes from '../data/conductor_types.json'

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

export default function CommonInputs({ memoryId, onChange }: { memoryId?: string, onChange?: (s: CommonInputsState) => void }) {
    const [collapsed, setCollapsed] = useState(false)
    const [state, setState] = useState<CommonInputsState>(defaultState)

    useEffect(() => {
        // Load persisted circuit config (if present) to prefill sensible fields
        if (!memoryId) return
        try {
            const raw = localStorage.getItem(`circuit_config:${memoryId}`)
            if (raw) {
                const cfg = JSON.parse(raw)
                setState(prev => ({ ...prev, tensionKV: cfg.tensionKV ?? prev.tensionKV, powerFactor: cfg.powerFactor ?? prev.powerFactor, conductorTemperature: cfg.conductorTemperature ?? prev.conductorTemperature }))
            }
        } catch (e) {
            // ignore
        }
    }, [memoryId])

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
            // default to first option
            setState(prev => ({ ...prev, conductorType: opts[0] }))
        }
    }, [state.conductorMaterial, state.conductorTemperature])

    function update<K extends keyof CommonInputsState>(k: K, v: CommonInputsState[K]) {
        setState(prev => ({ ...prev, [k]: v }))
    }

    return (
        <div className="bg-bg-lightgray-100 text-black rounded-lg shadow-md p-3">
            <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">📊 Common data</div>
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
                        <input type="number" step="0.001" className="w-full mt-1 text-sm p-1 rounded text-black" value={state.tensionKV} onChange={(e) => update('tensionKV', Number(e.target.value))} />
                    </div>

                    <div>
                        <div className="text-xs mb-1 text-[#85C538]">Power Factor</div>
                        <input type="number" step="0.01" className="w-full mt-1 text-sm p-1 rounded text-black" value={state.powerFactor} onChange={(e) => update('powerFactor', Number(e.target.value))} />
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
                        <input type="number" className="w-full mt-1 text-sm p-1 rounded text-black" value={state.ambientTemperature} onChange={(e) => update('ambientTemperature', Number(e.target.value))} />
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
