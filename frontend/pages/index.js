import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'

export default function Home() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [user, setUser] = useState(null)
    const [message, setMessage] = useState('')
    const rectsRef = useRef(null)

    // check session on mount and subscribe to auth changes
    useEffect(() => {
        let mounted = true
        async function init() {
            try {
                const { data, error } = await supabase.auth.getSession()
                if (error) console.warn('getSession error', error)
                if (mounted && data?.session?.user) {
                    setUser(data.session.user)
                }
            } catch (err) {
                console.error(err)
            }
        }
        init()

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) setUser(session.user)
            if (!session) setUser(null)
        })

        // animate rects in
        requestAnimationFrame(() => {
            rectsRef.current?.classList.add('animate-in')
        })

        return () => {
            mounted = false
            listener?.subscription?.unsubscribe?.()
        }
    }, [])

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

        // play submit animation then navigate
        rectsRef.current?.classList.add('animate-submit')
        setTimeout(() => router.push('/dashboard'), 350)
    }

    async function handleSignOut() {
        await supabase.auth.signOut()
        setUser(null)
        setMessage('Signed out')
    }

    return (
        <div className="page-wrap">
            <div className="card">
                <div className="left">
                    <div className="brand">
                        <img src="/company.svg" alt="company" />
                        <div className="title">MecalApp Management System</div>
                    </div>

                    <div className="login-form">
                        {!user ? (
                            <form onSubmit={handleSignIn}>
                                <label>Email</label>
                                <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
                                <label>Password</label>
                                <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
                                <button type="submit">Sign in</button>
                                <div className="message">{message}</div>
                            </form>
                        ) : (
                            <div>
                                <p>Signed in as {user.email}</p>
                                <div className="login-actions">
                                    <button className="small-btn" onClick={handleSignOut}>Sign out</button>
                                    <button className="small-btn" onClick={() => router.push('/dashboard')}>Go to dashboard</button>
                                </div>
                                <div className="message">{message}</div>
                            </div>
                        )}
                    </div>

                    <div ref={rectsRef} className="rects" aria-hidden>
                        <div className="rect r1" />
                        <div className="rect r2" />
                        <div className="rect r3" />
                        <div className="rect r4" />
                        <div className="rect r5" />
                    </div>
                </div>

                <div className="right">
                    <img src="/logo.svg" alt="logo" />
                </div>
            </div>
        </div>
    )
}
