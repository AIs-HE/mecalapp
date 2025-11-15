import React from 'react'

export default function Footer(): React.ReactElement {
    return (
        <footer className="w-full border-t border-gray-100 bg-white/50 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-gray-600">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                        <img src="/company.svg" alt="MeCalApp" className="h-6 w-auto" />
                        <div className="text-sm font-medium">MeCalApp</div>
                    </div>
                    <div className="text-sm text-gray-700">MeCalApp v1.0 — All rights reserved</div>
                    <div className="text-sm text-gray-600">Address: Calle 38 N 66 A 55</div>
                    <div className="text-sm text-gray-600"><a href="https://www.he-ing.com" className="hover:underline">www.he-ing.com</a></div>
                    <div className="flex items-center gap-4 pt-2">
                        <a href="/docs" className="hover:underline">Docs</a>
                        <a href="/privacy" className="hover:underline">Privacy</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
