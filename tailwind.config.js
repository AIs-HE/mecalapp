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
    // Narrow safelist to a minimal set of utility classes that are
    // intentionally applied via JS or are critical for initial layout.
    // We aim to remove this safelist after converting dynamic classes
    // to static lookups across components.
    safelist: [
        'px-4', 'py-2', 'rounded-md', 'font-semibold'
    ],
    plugins: [],
}
