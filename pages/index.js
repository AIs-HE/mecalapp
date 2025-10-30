import { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'
import COLORS from '../lib/theme'

export default function Home() {
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
            if (data?.session?.user) setUser(data.session.user)
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
    }

    async function handleSignOut() {
        await supabase.auth.signOut()
        setUser(null)
        setProjects([])
        setMessage('Signed out')
        setRectState('exit')
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
        <div className="auth-root">
            <div className={`parallax-rect rect-a ${rectState === 'in' ? 'animate-in' : rectState === 'enter' ? 'animate-up-enter' : rectState === 'exit' ? 'animate-up-exit' : ''}`}></div>
            <div className={`parallax-rect rect-b ${rectState === 'in' ? 'animate-in' : rectState === 'enter' ? 'animate-up-enter' : rectState === 'exit' ? 'animate-up-exit' : ''}`}></div>
            <div className={`parallax-rect rect-c ${rectState === 'in' ? 'animate-in' : rectState === 'enter' ? 'animate-up-enter' : rectState === 'exit' ? 'animate-up-exit' : ''}`}></div>

            <div className="auth-container">
                <div className="left-brand">
                    <img src="/company.svg" alt="Company" className="brand-logo" />
                    <img src="/logo.svg" alt="Management" className="brand-company" />
                    <p className="meta">A compact management system — coming soon</p>
                </div>

                <div className="auth-card">
                    <h2 style={{ color: COLORS.primary, margin: 0 }}>Sign in</h2>
                    <p className="meta">Use your email and password to sign in.</p>
                    <div style={{ marginTop: 12 }}>
                        {!user ? (
                            <form onSubmit={handleSignIn}>
                                <label className="label">Email</label>
                                <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
                                <label className="label">Password</label>
                                <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
                                <button className="btn" type="submit">Sign in</button>
                            </form>
                        ) : (
                            <div>
                                <p>Signed in as <strong>{user.email}</strong></p>
                                <button className="btn" onClick={handleSignOut}>Sign out</button>
                                <div style={{ marginTop: 12 }}>
                                    <button className="btn" onClick={fetchProjects}>Fetch Projects (server API)</button>
                                </div>
                            </div>
                        )}

                        <p className="meta" style={{ marginTop: 12 }}>{message}</p>

                        {projects.length > 0 && (
                            <div className="projects-list">
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
