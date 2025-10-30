import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'
import Header from '../components/Header'
import ProjectCard from '../components/ProjectCard'
import MemoryCard from '../components/MemoryCard'
import BackgroundRects from '../components/BackgroundRects'
import AddProjectCard from '../components/AddProjectCard'
import Footer from '../components/Footer'

export default function Dashboard() {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedProject, setSelectedProject] = useState(null)
    const router = useRouter()
    const scrollRef = useRef(null)
    const scrollTimeoutRef = useRef(null)

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

    useEffect(() => {
        if (!user) return
        async function load() {
            setLoading(true)
            try {
                const res = await fetch('/api/projects')
                const json = await res.json()
                if (res.ok) setProjects(json.projects || [])
                else console.error('Failed to load projects', json)
            } catch (err) { console.error(err) }
            setLoading(false)
        }
        load()
    }, [user])

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.replace('/')
    }

    const isAdmin = role === 'admin' || role === 'director'

    return (
        <div className="font-sans min-h-screen relative overflow-hidden flex flex-col">
            <BackgroundRects />
            <Header title="MeCalApp" user={user} role={role} onSignOut={handleSignOut} />

            <main className="p-5 max-w-5xl mx-auto flex-1 w-full box-border overflow-y-auto">
                {selectedProject ? (
                    <section>
                        <button onClick={() => setSelectedProject(null)} className="mb-3 text-sm text-gray-700">← Back to projects</button>
                        <h2 className="text-2xl font-bold">Memories for {selectedProject.name}</h2>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 mt-3">
                            <div className="col-span-full text-gray-500">Memory list will appear here (to be implemented)</div>
                        </div>
                    </section>
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
                                    <div ref={scrollRef} className="projects-scroll max-h-[60vh] overflow-y-auto pr-2">
                                        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
                                            {projects.length > 0 && projects.map(p => (
                                                <ProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} isAdmin={isAdmin} />
                                            ))}

                                            {(projects.length === 0 || isAdmin) && (
                                                <AddProjectCard onClick={() => alert('Open create project modal (TODO)')} />
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
        </div>
    )
}

