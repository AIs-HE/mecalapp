import React from 'react'

export default function Footer(): React.ReactElement {
    return (
        <footer className="w-full border-t border-gray-100 bg-white/50 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 flex items-center justify-between">
                <div>© {new Date().getFullYear()} Mecal. All rights reserved.</div>
                <div className="flex items-center gap-4">
                    <a href="/docs" className="hover:underline">Docs</a>
                    <a href="/privacy" className="hover:underline">Privacy</a>
                </div>
            </div>
        </footer>
    )
}
