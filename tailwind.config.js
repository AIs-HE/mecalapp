/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,jsx}',
        './components/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#85B726',
                muted: '#858688',
            },
        },
    },
    plugins: [],
}
