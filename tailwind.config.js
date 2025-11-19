/** @type {import('tailwindcss').Config} */
module.exports = {
    // Include .ts and .tsx sources and common Next.js folders so Tailwind
    // scans all component files after the TypeScript migration.
    content: [
        './pages/**/*.{js,jsx,ts,tsx}',
        './components/**/*.{js,jsx,ts,tsx}',
        './app/**/*.{js,jsx,ts,tsx}',
        './src/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#85B726',
                muted: '#858688',
            },
        },
    },
    // Safelist: use pattern-based rules to cover dynamic variants without
    // listing every single utility. This reduces maintenance and still
    // prevents critical UI utilities from being purged during builds.
    safelist: [
        { pattern: /^(?:hover:|active:)?(?:bg|text)-(?:gray|green)-\d{2,3}$/ },
        { pattern: /^text-(?:xs|sm|base|lg|xl)$/ },
        'px-4', 'py-2', 'rounded-md', 'font-semibold', 'font-extrabold'
    ],
    plugins: [],
}
