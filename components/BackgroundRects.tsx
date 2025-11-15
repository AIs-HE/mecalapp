// @ts-nocheck
import React from 'react'

// Decorative background rectangle clump used on multiple pages.
// Accepts an optional `state` prop: 'in' | 'enter' | 'exit' to match existing auth animation classes.
export default function BackgroundRects({ state } = {}) {
    const cls = s => (state === 'in' ? 'animate-in' : state === 'enter' ? 'animate-up-enter' : state === 'exit' ? 'animate-up-exit' : '')

    return (
        <div className="bg-clump" aria-hidden="true">
            {/* parallax rectangles (larger, slower-moving shapes) */}
            <div className={`parallax-rect rect-a ${cls(state)}`}></div>
            <div className={`parallax-rect rect-b ${cls(state)}`}></div>
            <div className={`parallax-rect rect-c ${cls(state)}`}></div>
            <div className={`parallax-rect rect-d ${cls(state)}`}></div>
            <div className={`parallax-rect rect-e ${cls(state)}`}></div>
            <div className={`parallax-rect rect-f ${cls(state)}`}></div>
            <div className={`parallax-rect rect-g ${cls(state)}`}></div>
            <div className={`parallax-rect rect-h ${cls(state)}`}></div>

            {/* smaller decorative clump rectangles */}
            <div className={`decor-rect decor-rect-1 ${cls(state)}`}></div>
            <div className={`decor-rect decor-rect-2 ${cls(state)}`}></div>
            <div className={`decor-rect decor-rect-3 ${cls(state)}`}></div>
            <div className={`decor-rect decor-rect-4 ${cls(state)}`}></div>
            <div className={`decor-rect decor-rect-5 ${cls(state)}`}></div>
            <div className={`decor-rect decor-rect-6 ${cls(state)}`}></div>
            <div className={`decor-rect decor-rect-7 ${cls(state)}`}></div>
            <div className={`decor-rect decor-rect-8 ${cls(state)}`}></div>
            <div className={`decor-rect decor-rect-9 ${cls(state)}`}></div>
            <div className={`decor-rect decor-rect-10 ${cls(state)}`}></div>
            <div className={`decor-rect decor-rect-11 ${cls(state)}`}></div>
            <div className={`decor-rect decor-rect-12 ${cls(state)}`}></div>
            <div className={`decor-rect decor-rect-13 ${cls(state)}`}></div>
        </div>
    )
}
