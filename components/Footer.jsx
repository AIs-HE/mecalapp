import React from 'react'

export default function Footer() {
    const year = new Date().getFullYear()
    return (
        <div className="footer-bar" role="contentinfo">
            <div className="app-footer">
                <img src="/company.svg" alt="Company" className="footer-logo" />
                <div className="footer-info">
                    <div style={{ fontWeight: 700 }}>MeCalApp — Mechatronics Calibration</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>123 Industrial Ave, Suite 400 — City, Country</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>Contact: ops@example.com · © {year}</div>
                </div>
            </div>
        </div>
    )
}
