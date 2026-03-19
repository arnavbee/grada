"use client";

import { useEffect, useState } from "react";

export function GridBackground() {
    const [highlightedSquares, setHighlightedSquares] = useState<number[]>([]);
    const rows = 40;
    const cols = 40;
    const totalSquares = rows * cols;

    useEffect(() => {
        // Occasionally highlight a few squares
        const interval = setInterval(() => {
            const numHighlights = Math.floor(Math.random() * 3) + 1; // 1 to 3 squares
            const newHighlights: number[] = [];
            for (let i = 0; i < numHighlights; i++) {
                newHighlights.push(Math.floor(Math.random() * totalSquares));
            }
            setHighlightedSquares(newHighlights);
        }, 3000);

        return () => clearInterval(interval);
    }, [totalSquares]);

    return (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            <div
                className="absolute inset-0 z-0 grid"
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    opacity: 0.04 /* 3-5% opacity as requested */
                }}
            >
                {Array.from({ length: totalSquares }).map((_, i) => (
                    <div
                        key={i}
                        className="border-[0.5px] border-white/20 transition-colors duration-1000"
                        style={{
                            backgroundColor: highlightedSquares.includes(i) ? "#9b7b5a" : "transparent"
                        }}
                    />
                ))}
            </div>
            {/* Optional: Add a subtle overlay gradient to blend the edges if desired */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] z-10" />
        </div>
    );
}
