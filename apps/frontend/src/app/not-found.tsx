
"use client";

import Link from "next/link";
import { ArrowLeft, Home, FileText, Activity, Copy, Check, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import Logo from "@/components/Logo";

export default function NotFound() {
    const [copied, setCopied] = useState(false);
    const [requestId, setRequestId] = useState("");

    // Simulasi Request ID agar terlihat seperti sistem enterprise sungguhan
    // Gunakan useEffect agar tidak terjadi hydration mismatch (server vs client)
    useEffect(() => {
        setRequestId("req_" + Math.random().toString(36).substr(2, 9));
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(requestId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative overflow-hidden selection:bg-slate-900 selection:text-white font-sans">

            {/* --- BACKGROUND TEXTURE --- */}
            {/* Subtle Grid - Enterprise Standard */}
            <div className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40"></div>

            {/* --- TOP BAR --- */}
            <div className="relative z-10 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <Link href="/" className="opacity-60 hover:opacity-100 transition-opacity">
                    <Logo variant="icon" height={24} className="text-slate-900" />
                </Link>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-mono text-slate-500 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    STATUS: 404_NOT_FOUND
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">

                <div className="max-w-md w-full">

                    {/* 1. The Glitch/Abstract Visual */}
                    <div className="mb-8 relative flex justify-center">
                        <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-center justify-center relative overflow-hidden group">
                            {/* Animated Geometric Shape inside */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#f1f5f9,transparent)]"></div>
                            <div className="w-12 h-12 border-2 border-slate-900 rounded-lg transform rotate-45 group-hover:rotate-90 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"></div>
                            <div className="absolute w-12 h-12 border border-slate-300 rounded-lg transform rotate-45 scale-75 group-hover:scale-50 transition-transform duration-700"></div>

                            {/* 404 Text Overlay */}
                            <span className="absolute text-xs font-mono font-bold text-slate-900 bg-white px-1">404</span>
                        </div>
                    </div>

                    {/* 2. Text Content */}
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                            Halaman tidak ditemukan.
                        </h1>
                        <p className="text-slate-500 text-[15px] leading-relaxed">
                            Jalur yang Anda tuju tidak ada, telah dipindahkan, atau Anda tidak memiliki izin akses.
                        </p>
                    </div>

                    {/* 3. Action Card (The "Control Center") */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                        {/* Primary Actions */}
                        <div className="p-2 flex flex-col gap-1">
                            <Link
                                href="/"
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-black group-hover:text-white transition-colors">
                                    <Home className="w-4 h-4" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-sm font-semibold text-slate-900">Kembali ke Beranda</div>
                                    <div className="text-[11px] text-slate-400">Dashboard utama</div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900" />
                            </Link>

                            <div className="w-full h-[1px] bg-slate-100 my-1"></div>

                            <Link
                                href="/docs"
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 transition-colors">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-sm font-semibold text-slate-900">Dokumentasi</div>
                                    <div className="text-[11px] text-slate-400">Pelajari cara kerja sistem</div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900" />
                            </Link>
                        </div>

                        {/* Technical Details Footer */}
                        <div className="bg-[#F8F9FA] border-t border-slate-100 px-4 py-3 flex justify-between items-center">
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Request ID</span>
                                <code className="text-[11px] font-mono text-slate-600">{requestId}</code>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-200 transition-colors text-slate-500"
                                title="Copy Request ID for Support"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span className="text-[10px] font-medium">{copied ? "Copied" : "Copy"}</span>
                            </button>
                        </div>
                    </div>

                    {/* 4. Footer Links */}
                    <div className="mt-8 flex justify-center gap-6">
                        <Link href="/status" className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-900 transition-colors">
                            <Activity className="w-3.5 h-3.5" />
                            <span>System Status</span>
                        </Link>
                        <span className="text-slate-200">|</span>
                        <Link href="/support" className="text-[12px] text-slate-400 hover:text-slate-900 transition-colors">
                            Hubungi Support
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}