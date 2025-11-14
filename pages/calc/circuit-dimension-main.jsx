import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../../lib/supabaseClient'

export default function CircuitDimensionMainPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [projectData, setProjectData] = useState(null)
    const [memoryData, setMemoryData] = useState(null)
    const [showModal, setShowModal] = useState(true)
    const [error, setError] = useState(null)

    // Form state for the modal questions
    const [formData, setFormData] = useState({
        // Boolean questions (default: No/false)
        NonEseBool: false,    // Does the SLD includes Non Essential panel?
        DCBool: false,        // Does the SLD includes DC loads?
        TranBool: false,      // Does the SLD includes Transfer Panel?
        GenBool: false,       // Does the SLD includes A Generator Set?
        
        // Numeric factor questions
        niFactor: 1.25,       // Correction factor for Nominal Current
        deltaV: 5,            // Acceptable %ΔV [%]
        percLoss: 3.88        // Acceptable % of Losses [%]
    })

    useEffect(() => {
        if (!router.isReady) return
        loadPageData()
    }, [router.isReady, router.query])

    const loadPageData = async () => {
        setLoading(true)
        try {
            const { project_id, memory_id } = router.query

            // Load project data if project_id provided
            if (project_id) {
                const res = await fetch(`/api/projects?id=${encodeURIComponent(project_id)}`)
                const data = await res.json()
                if (res.ok) setProjectData(data.project)
            }

            // Load memory data if memory_id provided
            if (memory_id) {
                const { data: memory, error: memErr } = await supabase
                    .from('project_memories')
                    .select('*')
                    .eq('id', memory_id)
                    .single()
                
                if (!memErr) setMemoryData(memory)
            }

        } catch (err) {
            console.error('Error loading page data:', err)
            setError(String(err))
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: !prev[field]
        }))
    }

    const handleNumberChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }))
    }

    const handleLoadCalculationMemory = () => {
        setShowModal(false)
        // Store the configuration for use in secondary layout
        localStorage.setItem('circuit-dimension-config', JSON.stringify(formData))
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-lg">Loading Circuit Dimension Memory...</div>
        </div>
    )

    if (error) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-red-600">Error: {error}</div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Modal for Configuration Questions */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="bg-slate-800 text-white p-6 rounded-t-lg">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">Circuit Dimension Memory Configuration</h2>
                                <button 
                                    onClick={() => router.back()}
                                    className="text-white hover:text-gray-300"
                                >
                                    ✕
                                </button>
                            </div>
                            {projectData && (
                                <div className="mt-2 text-sm text-gray-300">
                                    Project: {projectData.name} | Cost Center: {projectData.cost_center}
                                </div>
                            )}
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <div className="space-y-6">
                                {/* Boolean Questions */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800">System Configuration Questions</h3>
                                    <div className="space-y-4">
                                        {[
                                            { key: 'NonEseBool', label: 'Does the SLD includes Non Essential panel?' },
                                            { key: 'DCBool', label: 'Does the SLD includes DC loads?' },
                                            { key: 'TranBool', label: 'Does the SLD includes Transfer Panel?' },
                                            { key: 'GenBool', label: 'Does the SLD includes A Generator Set?' }
                                        ].map((question) => (
                                            <div key={question.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <label className="text-sm font-medium text-gray-700 flex-1">
                                                    {question.label}
                                                </label>
                                                <div className="flex items-center ml-4">
                                                    <span className="mr-2 text-sm text-gray-600">No</span>
                                                    <button
                                                        onClick={() => handleToggle(question.key)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                            formData[question.key] 
                                                                ? 'bg-blue-600' 
                                                                : 'bg-gray-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                                formData[question.key] 
                                                                    ? 'translate-x-6' 
                                                                    : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                    <span className="ml-2 text-sm text-gray-600">Yes</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Numeric Factor Questions */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Calculation Parameters</h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                What is the correction factor for Nominal Current?
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.niFactor}
                                                onChange={(e) => handleNumberChange('niFactor', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="1.25"
                                            />
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                What is the acceptable %ΔV [%]?
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={formData.deltaV}
                                                onChange={(e) => handleNumberChange('deltaV', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="5"
                                            />
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                What is the acceptable % of Losses [%]?
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.percLoss}
                                                onChange={(e) => handleNumberChange('percLoss', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="3.88"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => router.back()}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLoadCalculationMemory}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Load Calculation Memory
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Secondary Page Layout (Dummy Implementation) */}
            {!showModal && (
                <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
                    {/* Dark Blue Header Container */}
                    <div className="bg-slate-800 text-white p-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <h1 className="text-xl font-bold">MeCalApp</h1>
                                <span className="text-sm">CDM - Circuit Dimension memory</span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                                <button 
                                    onClick={() => setShowModal(true)}
                                    className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                                >
                                    Back to Config
                                </button>
                                <button 
                                    onClick={() => router.push('/dashboard')}
                                    className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-700"
                                >
                                    Back to Projects
                                </button>
                                <span>User: Admin</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex">
                        {/* Left Content - Purple Container Placeholder */}
                        <div className="flex-1 bg-purple-500 p-6">
                            <div className="text-white">
                                <h2 className="text-lg font-bold mb-4">📊 Tabs & Common Inputs (Purple Container)</h2>
                                <div className="bg-purple-400 p-4 rounded mb-4">
                                    <p>Tab Navigation will go here</p>
                                    <p>Active tabs based on configuration:</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>• Essential Loads (Always visible)</li>
                                        {formData.NonEseBool && <li>• Non Essential Loads</li>}
                                        {formData.TranBool && <li>• Transfer Panels & Outputs</li>}
                                        {formData.DCBool && <li>• DC Panel</li>}
                                        <li>• Transformers & Generators (Always visible)</li>
                                    </ul>
                                </div>
                                <div className="bg-gray-700 p-4 rounded">
                                    <p className="text-white">Equipment Table Gallery will go here</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar - Emerald Green Container */}
                        <div className="w-80 bg-emerald-600 p-6 text-white">
                            <h2 className="text-lg font-bold mb-4">🏢 Project Info Panel</h2>
                            {projectData ? (
                                <div className="space-y-3">
                                    <div>
                                        <strong>Cost Center:</strong> {projectData.cost_center}
                                    </div>
                                    <div>
                                        <strong>Project Name:</strong> {projectData.name}
                                    </div>
                                    <div>
                                        <strong>Version:</strong> <span className="bg-yellow-400 text-black px-2 py-1 rounded">V1</span>
                                    </div>
                                </div>
                            ) : (
                                <p>Project information will be displayed here</p>
                            )}
                            
                            <div className="mt-6 border-2 border-dashed border-emerald-400 p-4 rounded">
                                <p className="text-sm">AI Integration Placeholder</p>
                            </div>
                        </div>
                    </div>

                    {/* White Draft Controls Container */}
                    <div className="bg-white p-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">All changes have been saved</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    Last modified: {new Date().toLocaleString()}
                                </span>
                            </div>
                            <div className="flex space-x-3">
                                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    Guardar en DB
                                </button>
                                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                                    Cargar desde DB
                                </button>
                                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                                    Exportar a Word
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}