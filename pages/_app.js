// Tailwind (added for incremental migration). Keep `globals.css` as a fallback while converting components.
import '../styles/tailwind.css'
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }) {
    return <Component {...pageProps} />
}
