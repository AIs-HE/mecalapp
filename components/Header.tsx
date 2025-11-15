import React from 'react'
import Link from 'next/link'
import { UserInfo } from '../types/interfaces'

type Props = {
    user?: UserInfo | null
}

export default function Header({ user = null }: Props) {
    return (
        <header className="w-full bg-white/60 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold">M</div>
                        <div className="text-lg font-semibold">Mecal</div>
                    </Link>
                </div>
                <nav className="flex items-center gap-3">
                    <Link href="/projects" className="text-sm text-gray-700 hover:text-gray-900">Projects</Link>
                    <Link href="/memories" className="text-sm text-gray-700 hover:text-gray-900">Memories</Link>
                    <Link href="/calc" className="text-sm text-gray-700 hover:text-gray-900">Calculations</Link>
                </nav>
                <div>
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="text-sm">{user.full_name}</div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/auth/login" className="text-sm text-gray-600">Login</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
