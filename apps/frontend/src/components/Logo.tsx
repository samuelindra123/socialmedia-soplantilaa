import React from 'react';

interface LogoProps {
    /**
     * Tampilan logo:
     * - 'full': Icon + Text (Default)
     * - 'icon': Icon saja (untuk favicon/mobile)
     * - 'wordmark': Text saja
     */
    variant?: 'full' | 'icon' | 'wordmark';

    /**
     * Tinggi logo dalam pixel.
     * Default: 32
     */
    height?: number;

    /**
     * Class tambahan (warna, margin, dll).
     */
    className?: string;

    /**
     * Toggle warna brand (gradient) vs monochrome (currentColor).
     * Default: true
     */
    colored?: boolean;
}

export default function Logo({
    variant = 'full',
    height = 32,
    className = '',
    colored = true,
}: LogoProps) {
    // Base sizing logic
    const baseHeight = 32;
    
    // Calculate Width & ViewBox based on variant
    let width = height;
    let viewBox = `0 0 ${baseHeight} ${baseHeight}`;

    if (variant === 'full') {
        // Icon (32) + Gap (8) + Text (~110)
        width = height * 4.5; 
        viewBox = "0 0 144 32";
    } else if (variant === 'wordmark') {
        width = height * 3.5; 
        viewBox = "40 0 110 32"; 
    }

    // Unique IDs for gradient & filters to avoid conflicts
    const gradientId = React.useId();
    const glowId = React.useId();

    // Fill logic
    const fillValue = colored ? `url(#${gradientId})` : "currentColor";

    return (
        <div className={`group inline-flex items-center ${className}`} style={{ height }}>
            <svg
                width={width}
                height={height}
                viewBox={viewBox}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label={variant === 'icon' ? "Soplantila Logo" : "Soplantila"}
                role="img"
                className="overflow-visible" // Allow glow to spill over
            >
                <title>Soplantila</title>

                {/* --- STYLES & DEFS --- */}
                <defs>
                    {colored && (
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366F1" /> {/* Indigo 500 */}
                            <stop offset="50%" stopColor="#8B5CF6" /> {/* Violet 500 */}
                            <stop offset="100%" stopColor="#EC4899" /> {/* Pink 500 */}
                        </linearGradient>
                    )}
                    
                    {/* Glow Filter for Hover Effect */}
                    <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* CSS Animation for precise control */}
                    <style>{`
                        .logo-cross {
                            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease;
                            transform-origin: 16px 16px;
                        }
                        .group:hover .logo-cross {
                            transform: scale(1.1);
                            filter: ${colored ? `url(#${glowId})` : 'none'};
                        }
                        .logo-rays {
                            transition: opacity 0.3s ease, transform 0.5s ease;
                            transform-origin: 16px 16px;
                            opacity: 0.6;
                        }
                        .group:hover .logo-rays {
                            opacity: 1;
                            transform: rotate(15deg);
                        }
                    `}</style>
                </defs>

                {/* --- LOGO SYMBOL: THE KINETIC PULSE --- */}
                {(variant === 'icon' || variant === 'full') && (
                    <g id="logo-symbol">
                        {/* Outer Geometric Ring */}
                        <circle
                            className="logo-rays"
                            cx="16" cy="16" r="14"
                            stroke="var(--color-brand-primary)"
                            strokeWidth="0.5"
                            strokeOpacity="0.2"
                            fill="none"
                        />

                        {/* Connection Nodes (Marketing Group Vibe) */}
                        <path
                            className="logo-cross"
                            fill={fillValue}
                            d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6zM14 16a2 2 0 114 0 2 2 0 01-4 0z"
                        />
                        
                        {/* Pulse Dot */}
                        <circle
                            cx="26" cy="10" r="2"
                            fill="var(--color-brand-accent)"
                            className="animate-pulse"
                        />
                    </g>
                )}

                {/* --- WORDMARK: CLEAR SANS-SERIF --- */}
                {(variant === 'full' || variant === 'wordmark') && (
                    <text
                        x={variant === 'wordmark' ? "0" : "40"}
                        y="22"
                        fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                        fontSize="20"
                        fontWeight="700"
                        fill="currentColor"
                        letterSpacing="-0.02em"
                        className="select-none"
                        style={{ fontFeatureSettings: '"cv11", "ss01"' }} // Optional: nicer font features if Inter is loaded
                    >
                        Soplantila
                    </text>
                )}
            </svg>
        </div>
    );
}
