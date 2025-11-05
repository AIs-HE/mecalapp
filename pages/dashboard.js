import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'
import Header from '../components/Header'
import ProjectCard from '../components/ProjectCard'
import MemoryCard from '../components/MemoryCard'
import BackgroundRects from '../components/BackgroundRects'
import AddProjectCard from '../components/AddProjectCard'
import AddMemoryCard from '../components/AddMemoryCard'
import NewProjectModal from '../components/NewProjectModal'
import Footer from '../components/Footer'

export default function Dashboard() {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [showNewProject, setShowNewProject] = useState(false)
    const [editProject, setEditProject] = useState(null)
    const [selectedProject, setSelectedProject] = useState(null)
    const router = useRouter()
    const scrollRef = useRef(null)
    const scrollTimeoutRef = useRef(null)
    const [memRefreshSignal, setMemRefreshSignal] = useState(0)

    // show scrollbar only while the user is actively scrolling
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        const onScroll = () => {
            el.classList.add('scrolling')
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
            scrollTimeoutRef.current = setTimeout(() => {
                el.classList.remove('scrolling')
                scrollTimeoutRef.current = null
            }, 800)
        }

        el.addEventListener('scroll', onScroll, { passive: true })
        return () => {
            el.removeEventListener('scroll', onScroll)
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        }
    }, [scrollRef.current])

    useEffect(() => {
        let mounted = true
        supabase.auth.getSession().then(({ data }) => {
            if (!mounted) return
            if (data?.session?.user) {
                try { router.replace('/dashboard') } catch (e) { }
                return
            }
        })

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                // best-effort profile role load
                supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data: p }) => {
                    if (p && mounted) setRole(p.role)
                }).catch(() => { })
            }
        })

        const t = setTimeout(() => { /* trigger any entrance animation externally */ }, 120)

        return () => { mounted = false; clearTimeout(t); sub?.subscription?.unsubscribe?.() }
    }, [])

    async function loadProjects() {
        if (!user) return
        setLoading(true)
        try {
            // If the current user is an employee, request a user-scoped project list
            // by attaching the user's access token as an Authorization header. The server
            // derives the user from the token and will return only projects with assigned memories.
            const url = '/api/projects'
            const headers = { 'Content-Type': 'application/json' }
            if (role === 'employee') {
                const { data } = await supabase.auth.getSession()
                const token = data?.session?.access_token
                if (token) headers['Authorization'] = `Bearer ${token}`
            }
            const res = await fetch(url, { headers })
            const json = await res.json()
            if (res.ok) setProjects(json.projects || [])
            else console.error('Failed to load projects', json)
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    useEffect(() => { loadProjects() }, [user, role])

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.replace('/')
    }

    const isAdmin = role === 'admin' || role === 'director'

    return (
        <div className="font-sans min-h-screen relative overflow-hidden flex flex-col">
            <BackgroundRects />
            <Header title="MeCalApp" user={user} role={role} onSignOut={handleSignOut} onShowProjects={() => setSelectedProject(null)} isProjectView={!selectedProject} />

            <main className="p-5 max-w-5xl mx-auto flex-1 w-full box-border overflow-y-auto">
                {selectedProject ? (
                    <ProjectMemoriesView project={selectedProject} isAdmin={isAdmin} user={user} onBack={() => setSelectedProject(null)} onEditProject={(proj) => { setEditProject(proj); setShowNewProject(true); }} refreshSignal={memRefreshSignal} />
                ) : (
                    <section>
                        <div className="projects-panel bg-gray-50/60 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="projects-heading text-3xl font-bold">Projects</h2>
                            </div>

                            {loading ? (
                                <div>Loading projects…</div>
                            ) : (
                                <div className="projects-inner">
                                    <div
                                        ref={scrollRef}
                                        className="projects-scroll max-h-[60vh] overflow-y-auto pr-2"
                                        style={projects.length === 0 ? { minHeight: '13rem' } : undefined}
                                    >
                                        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
                                            {projects.length > 0 && projects.map(p => (
                                                <ProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} isAdmin={isAdmin}
                                                    onEdit={(proj) => { setEditProject(proj); setShowNewProject(true); }}
                                                    onDelete={async (proj) => {
                                                        if (!confirm('Delete this project? This cannot be undone.')) return
                                                        try {
                                                            const res = await fetch('/api/projects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: proj.id }) })
                                                            const j = await res.json()
                                                            if (!res.ok) throw new Error(j.error || 'Failed to delete project')
                                                            loadProjects()
                                                        } catch (err) { console.error(err); alert(err.message || String(err)) }
                                                    }}
                                                />
                                            ))}

                                            {isAdmin && (
                                                <AddProjectCard onClick={() => { setEditProject(null); setShowNewProject(true); }} />
                                            )}
                                        </div>

                                        {projects.length === 0 && (
                                            <div className="text-gray-500 mt-3">No projects found.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </main>

            <Footer />
            <NewProjectModal open={showNewProject} project={editProject} onClose={() => { setShowNewProject(false); setEditProject(null); }} onCreated={(proj) => { setShowNewProject(false); loadProjects(); }} onUpdated={(proj) => { setShowNewProject(false); setEditProject(null); loadProjects(); setMemRefreshSignal(s => s + 1); }} />
        </div>
    )
}

function ProjectMemoriesView({ project, isAdmin, user, onBack, onEditProject, refreshSignal }) {
    const [memories, setMemories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            setError(null)
            try {
                const url = `/api/project_memories?project_id=${project.id}`
                const headers = { 'Content-Type': 'application/json' }
                if (!isAdmin) {
                    const { data } = await supabase.auth.getSession()
                    const token = data?.session?.access_token
                    if (token) headers['Authorization'] = `Bearer ${token}`
                }
                const res = await fetch(url, { headers })
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}))
                    throw new Error(j.error || `Failed to load memories (${res.status})`)
                }
                const j = await res.json()
                if (!mounted) return
                setMemories(j.memories || [])
            } catch (err) {
                console.error('Failed to load project memories', err)
                if (!mounted) return
                setError(err.message || String(err))
            }
            if (mounted) setLoading(false)
        }
        load()
        return () => { mounted = false }
    }, [project?.id, refreshSignal, user?.id, isAdmin])

    async function refresh() {
        try {
            const url = `/api/project_memories?project_id=${project.id}`
            const headers = { 'Content-Type': 'application/json' }
            if (!isAdmin) {
                const { data } = await supabase.auth.getSession()
                const token = data?.session?.access_token
                if (token) headers['Authorization'] = `Bearer ${token}`
            }
            const res = await fetch(url, { headers })
            const j = await res.json()
            setMemories(j.memories || [])
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <section>
            <div className="projects-panel bg-gray-50/60 rounded-lg p-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="projects-heading text-3xl font-bold">{project.cost_center ? `${project.cost_center} - ` : ''}{project.name}</h2>
                    <div>
                        {loading ? (
                            <div className="text-sm text-gray-600">Loading…</div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ flex: '0 0 auto', color: 'var(--color-main)', backgroundColor: 'rgba(133,183,38,0.08)', borderRadius: 12, padding: '6px 10px', fontSize: '0.85rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                    <div>{memories.length}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-main)', marginTop: 2 }}>memories</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {error ? (
                    <div className="mt-4 text-red-600">Error loading memories: {error}</div>
                ) : (
                    <div className="projects-inner">
                        <div className="projects-scroll max-h-[60vh] overflow-y-auto pr-2">
                            <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
                                {loading && <div className="col-span-full text-gray-500">Loading memories…</div>}
                                {!loading && memories.length === 0 && !isAdmin && (
                                    <div className="col-span-full text-gray-500">No memories found for this project.</div>
                                )}
                                {!loading && memories.map(m => (
                                    <MemoryCard key={m.id || `${m.project_id}_${m.memory_type}`} memory={m} isAdmin={isAdmin} onDelete={async () => { await refresh() }} />
                                ))}
                                {isAdmin && (
                                    <AddMemoryCard onClick={() => onEditProject && onEditProject(project)} />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

