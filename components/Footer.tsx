import React from 'react'

export default function Footer(): React.ReactElement {
    return (
        <footer className="fixed bottom-0 left-0 w-full z-50 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img src="/company.svg" alt="MeCalApp" className="h-[90px] w-auto" />
                    <div className="flex flex-col">
                        <div className="text-sm font-medium">MeCalApp</div>
                        <div className="text-sm text-gray-700">MeCalApp v1.0 — All rights reserved</div>
                        <div className="text-sm text-gray-600">Address: Calle 38 N 66 A 55</div>
                        <div className="text-sm text-gray-600"><a href="https://www.he-ing.com" className="hover:underline">www.he-ing.com</a></div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
