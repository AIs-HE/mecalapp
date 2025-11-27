import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'
import type { UserInfo } from '../types/interfaces'

type Props = {
    user?: UserInfo | null
    role?: string | null
    onShowProjects?: (() => void) | null
}

export default function Header({ user = null, role = null, onShowProjects = null }: Props) {
    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Sign out failed', err)
        } finally {
            void (window.location.href = '/')
        }
    }

    const formatRole = (r?: string | null) => {
        if (!r) return null
        const normalized = String(r).toLowerCase().trim()
        if (normalized.includes('auth')) return 'Member'
        if (normalized.includes('admin')) return 'Admin'
        if (normalized.includes('director')) return 'Director'
        if (normalized.includes('employee')) return 'Employee'
        // Capitalize words for unknown tokens
        return normalized.replace(/[_-]/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }

    const roleLabel = formatRole((user?.role ?? null))
    // Prefer explicit role prop if provided (pages pass `role`), otherwise fall back to user.role
    const propsRole = () => {
        const r = role ?? (user as any)?.role ?? null
        return r ? String(r).toLowerCase() : undefined
    }

    const router = useRouter()
    const pathname = router.pathname

    const navItem = (href: string, label: string) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        const base = 'nav-link transition-colors'
        const activeClasses = 'nav-link-active'
        const cls = active ? `${base} ${activeClasses}` : base
        return (
            <Link href={href} className={cls}>
                {label}
            </Link>
        )
    }
    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-white/60 backdrop-blur-md border-b border-gray-100 h-[64px]">
            <div className="relative w-full px-6 h-full flex items-center">
                <div className="flex items-center justify-between w-full">
                    {/* Left: plain brand text, not a link */}
                    <div className="flex-none">
                        <div className="text-lg font-extrabold tracking-tight font-sans">MeCalApp</div>
                    </div>

                    {/* Right: user info and sign out */}
                    <div className="flex-none">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-right font-sans">
                                    <div className="font-medium text-gray-800">{user.full_name ?? user.email}</div>
                                    <div className="text-xs text-gray-500">{(propsRole() ?? roleLabel ?? '')}</div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="btn btn-sm bg-primary text-white font-semibold"
                                    type="button"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/auth/login" className="text-sm text-gray-600">Login</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Centered nav — absolute centered so left and right can size independently */}
                <nav className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
                    {/* Projects should call onShowProjects when available to clear project selection */}
                    <button
                        type="button"
                        onClick={() => {
                            try { onShowProjects && onShowProjects() } catch (e) { }
                            try { router.push('/projects') } catch (e) { }
                        }}
                        className={pathname === '/projects' ? 'nav-link nav-link-active transition-colors' : 'nav-link transition-colors'}
                    >
                        Projects
                    </button>
                    {navItem('/dashboard', 'Dashboard')}
                    {navItem('/help', 'Help')}
                </nav>
            </div>
        </header>
    )
}
