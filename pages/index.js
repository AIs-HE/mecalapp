import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'
import COLORS from '../lib/theme'
import BackgroundRects from '../components/BackgroundRects'

export default function Home() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [user, setUser] = useState(null)
    const [projects, setProjects] = useState([])
    const [message, setMessage] = useState('')
    const [rectState, setRectState] = useState('idle')

    useEffect(() => {
        let mounted = true
        supabase.auth.getSession().then(({ data }) => {
            if (!mounted) return
            // If a session exists, immediately redirect to dashboard and replace history
            if (data?.session?.user) {
                try { router.replace('/dashboard') } catch (e) { }
                return
            }
        })

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })
        // trigger initial rectangle entrance animation shortly after mount
        const t = setTimeout(() => setRectState('in'), 120)

        return () => { mounted = false; clearTimeout(t); sub?.subscription?.unsubscribe?.() }
    }, [])

    async function handleSignIn(e) {
        e.preventDefault()
        setMessage('Signing in...')
        setRectState('enter')
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setMessage(error.message)
            setRectState('idle')
            return
        }
        setUser(data.user)
        setMessage('Signed in')
        // navigate to dashboard after successful sign-in (replace current history entry to avoid back navigation to sign-in)
        try { router.replace('/dashboard') } catch (e) { }
    }

    async function handleSignOut() {
        await supabase.auth.signOut()
        setUser(null)
        setProjects([])
        setMessage('Signed out')
        setRectState('exit')
        try { router.replace('/') } catch (e) { }
    }

    async function fetchProjects() {
        setMessage('Fetching projects...')
        try {
            const res = await fetch('/api/projects')
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to load')
            setProjects(json.projects || [])
            setMessage('Projects loaded')
        } catch (err) {
            setMessage(err.message)
        }
    }

    return (
        <div className="auth-root min-h-screen flex items-center justify-center relative overflow-hidden p-10">
            <BackgroundRects state={rectState} />

            <div className="auth-container w-full max-w-[980px] bg-white rounded-xl shadow-lg grid md:grid-cols-[1fr_420px] gap-6 p-7 items-center">
                <div className="left-brand p-4 md:p-6 flex flex-col">
                    <img src="/company.svg" alt="Company" className="brand-logo max-w-[260px] w-full h-auto" style={{ maxWidth: 260, width: '100%', height: 'auto' }} />
                    <p className="meta mt-4">A compact management system — coming soon</p>
                    <img src="/logo.svg" alt="Management" className="brand-company mt-3 max-w-[160px] w-full h-auto" style={{ maxWidth: 160, width: '100%', height: 'auto' }} />
                </div>

                <div className="auth-card p-6">
                    <h2 className="text-primary text-2xl font-extrabold m-0">Sign in</h2>
                    <p className="meta">Use your email and password to sign in.</p>
                    <div className="mt-3">
                        {!user ? (
                            <form onSubmit={handleSignIn}>
                                <label className="label block text-sm mt-3 text-muted">Email</label>
                                <input className="w-full px-3 py-2 mt-2 rounded-md border border-gray-200" value={email} onChange={e => setEmail(e.target.value)} type="email" required />

                                <label className="label block text-sm mt-3 text-muted">Password</label>
                                <input className="w-full px-3 py-2 mt-2 rounded-md border border-gray-200" value={password} onChange={e => setPassword(e.target.value)} type="password" required />

                                <button className="btn bg-primary text-white px-4 py-2 rounded-md mt-4 font-semibold" type="submit">Sign in</button>
                            </form>
                        ) : (
                            <div>
                                <p>Signed in as <strong>{user.email}</strong></p>
                                <p className="meta">You are signed in. Redirecting to the dashboard…</p>
                            </div>
                        )}

                        <p className="meta mt-3">{message}</p>

                        {projects.length > 0 && (
                            <div className="projects-list mt-3">
                                <h3>Projects</h3>
                                <ul>
                                    {projects.map(p => (
                                        <li key={p.id}>{p.name} — {p.status}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
