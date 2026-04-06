"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Zap } from "lucide-react";
import Logo from "@/components/Logo";
import Reveal from "@/components/Reveal";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Detect scroll untuk mengubah state header
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Fitur", href: "/features" },
        { name: "Manifesto", href: "/manifesto" },
        { name: "Harga", href: "/pricing" },
        { name: "Blog", href: "/blog" },
    ];

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled || isMobileMenuOpen
                    ? "bg-white/75 backdrop-blur-2xl border-b border-slate-200/60 py-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]"
                    : "bg-transparent border-transparent py-5"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal animation="fadeInDown" duration={800} className="w-full">
                        <div className="flex justify-between items-center">

                            {/* --- LOGO --- */}
                            <Link href="/" className="flex items-center gap-2 group z-50 relative">
                                <div className="text-slate-900 transition-opacity hover:opacity-80">
                                    <Logo variant="full" height={28} />
                                </div>
                            </Link>

                            {/* --- DESKTOP NAVIGATION --- */}
                            <nav className="hidden md:flex items-center gap-1 bg-slate-50/80 p-1 rounded-full border border-slate-200/50 backdrop-blur-md">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className="px-4 py-1.5 text-[13px] font-medium text-slate-600 rounded-full hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all duration-200"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </nav>

                            {/* --- ACTIONS --- */}
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="hidden md:block text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors px-2"
                                >
                                    Masuk
                                </Link>

                                {/* UPDATED CTA: AKSES BETA */}
                                {/* Menunjukkan akses langsung/instant, bukan waitlist */}
                                <Link
                                    href="/signup"
                                    className="hidden md:flex items-center gap-2 bg-[#0B0C0E] hover:bg-black text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-all hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 group"
                                >
                                    <Zap className="w-3.5 h-3.5 fill-white text-white" />
                                    <span>Akses Beta</span>
                                </Link>

                                {/* Mobile Menu Toggle */}
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="md:hidden p-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors z-50 relative"
                                    aria-label="Toggle Menu"
                                >
                                    {isMobileMenuOpen ? (
                                        <X className="w-5 h-5" />
                                    ) : (
                                        <Menu className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </header>

            {/* --- MOBILE MENU OVERLAY --- */}
            <div
                className={`fixed inset-0 z-40 bg-white/95 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isMobileMenuOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-4 pointer-events-none"
                    }`}
            >
                <div className="flex flex-col h-full pt-24 px-6 pb-8">
                    <nav className="flex flex-col gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-2xl font-semibold text-slate-900 py-4 border-b border-slate-100 hover:pl-2 transition-all"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-auto flex flex-col gap-4">
                        <Link
                            href="/login"
                            className="w-full flex justify-center py-4 text-slate-600 font-medium border border-slate-200 rounded-xl hover:bg-slate-50"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Masuk
                        </Link>
                        {/* Mobile CTA Updated */}
                        <Link
                            href="/signup"
                            className="w-full flex justify-center items-center gap-2 bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <Zap className="w-5 h-5 fill-white" />
                            Akses Beta Sekarang
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}