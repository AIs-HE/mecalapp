import { useState } from 'react'
import supabase from '../lib/supabaseClient'

export default function Home() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [user, setUser] = useState(null)
    const [projects, setProjects] = useState([])
    const [message, setMessage] = useState('')

    async function handleSignIn(e) {
        e.preventDefault()
        setMessage('Signing in...')
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setMessage(error.message)
            return
        }
        setUser(data.user)
        setMessage('Signed in')
    }

    async function fetchProjects() {
        setMessage('Fetching projects...')
        try {
            // Use server API which runs with service role key (bypasses RLS) for testing
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
        <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
            <h1>MecalApp — Supabase POC</h1>
            <p>{message}</p>

            {!user ? (
                <form onSubmit={handleSignIn} style={{ maxWidth: 360 }}>
                    <label>Email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
                    <label>Password</label>
                    <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
                    <button type="submit">Sign in</button>
                </form>
            ) : (
                <div>
                    <p>Signed in as {user.email}</p>
                    <button onClick={() => { supabase.auth.signOut(); setUser(null); setProjects([]); setMessage('Signed out') }}>Sign out</button>
                    <div style={{ marginTop: 12 }}>
                        <button onClick={fetchProjects}>Fetch Projects (server API)</button>
                    </div>
                </div>
            )}

            {projects.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <h2>Projects</h2>
                    <ul>
                        {projects.map(p => (
                            <li key={p.id}>{p.name} — {p.status}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
