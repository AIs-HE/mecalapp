import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'
import type { UserInfo } from '../types/interfaces'

type Props = {
    user?: UserInfo | null
}

export default function Header({ user = null }: Props) {
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

    const roleLabel = formatRole(user?.role ?? null)

    const router = useRouter()
    const pathname = router.pathname

    const navItem = (href: string, label: string) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
            <Link
                href={href}
                className={`text-sm ${active ? 'text-green-600 font-medium' : 'text-gray-500'} hover:text-green-600 transition-colors`}>
                {label}
            </Link>
        )
    }
    return (
        <header className="w-full bg-white/60 backdrop-blur-md border-b border-gray-100">
            <div className="relative w-full px-6 py-3">
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
                                    {roleLabel && <div className="text-xs text-gray-500">{roleLabel}</div>}
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 active:bg-gray-300 transition-colors"
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
                    {navItem('/projects', 'Projects')}
                    {navItem('/dashboard', 'Dashboard')}
                    {navItem('/help', 'Help')}
                </nav>
            </div>
        </header>
    )
}
