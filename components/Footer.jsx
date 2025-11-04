import React from 'react'

export default function Footer() {
    const year = new Date().getFullYear()
    return (
        <div className="footer-bar" role="contentinfo">
            <div className="app-footer">
                <img src="/company.svg" alt="Company" className="footer-logo" />
                <div className="footer-info">
                    <div style={{ fontWeight: 700 }}>MeCalApp — Calculation Memories App</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>Calle 38 No 66 A 55, — Medellín, Colombia</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>Contact: arturoinsignares@he-ing.com · © {year}</div>
                </div>
            </div>
        </div>
    )
}
