"use client";

import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    animation?: 'fadeInUp' | 'fadeInDown' | 'fadeIn';
    delay?: number; // in ms
    duration?: number; // in ms
    threshold?: number; // 0 to 1
}

export default function Reveal({
    children,
    className = "",
    animation = 'fadeInUp',
    delay = 0,
    duration = 800,
    threshold = 0.1,
}: RevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold,
                rootMargin: "0px 0px -50px 0px" // Trigger slightly before bottom
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [threshold]);

    const getAnimationClass = () => {
        switch (animation) {
            case 'fadeInUp': return 'animate-fadeInUp';
            case 'fadeInDown': return 'animate-fadeInDown';
            case 'fadeIn': return 'animate-fadeIn';
            default: return 'animate-fadeInUp';
        }
    };

    return (
        <div
            ref={ref}
            className={`${className} ${isVisible ? getAnimationClass() : 'opacity-0'}`}
            style={{
                animationDelay: `${delay}ms`,
                animationDuration: `${duration}ms`,
            }}
        >
            {children}
        </div>
    );
}
