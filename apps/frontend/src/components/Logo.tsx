import React from 'react';
import Image from 'next/image';

interface LogoProps {
    variant?: 'full' | 'icon' | 'wordmark';
    height?: number;
    className?: string;
    colored?: boolean; // kept for API compat, unused
}

export default function Logo({
    variant = 'full',
    height = 32,
    className = '',
}: LogoProps) {
    return (
        <div className={`inline-flex items-center gap-2.5 ${className}`} style={{ height }}>
            {(variant === 'full' || variant === 'icon') && (
                <Image
                    src="/logo.png"
                    alt="Soplantila"
                    width={height}
                    height={height}
                    className="shrink-0"
                    style={{ width: height, height: height }}
                />
            )}
            {(variant === 'full' || variant === 'wordmark') && (
                <span
                    className="font-bold tracking-tight text-slate-900 select-none"
                    style={{ fontSize: height * 0.75, lineHeight: 1 }}
                >
                    Soplantila
                </span>
            )}
        </div>
    );
}
