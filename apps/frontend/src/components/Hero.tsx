"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Zap,
  Shield,
  Users,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

export default function Hero() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "50K+", label: "Posts Created" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9/5", label: "User Rating" },
  ];

  const features = [
    { icon: Shield, text: "End-to-end encryption" },
    { icon: Users, text: "Private communities" },
    { icon: TrendingUp, text: "Analytics dashboard" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 pt-24 pb-20 overflow-hidden">

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 dark:opacity-10" />

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Floating Elements */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 border border-blue-200/30 dark:border-blue-800/30 rounded-2xl rotate-12 animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 border border-purple-200/30 dark:border-purple-800/30 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Content */}
          <div className="space-y-8 animate-fadeInUp">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-full shadow-lg shadow-blue-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Now in Beta
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2">
                v2.0 Available
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
                Connect
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
                  Meaningfully
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-medium">
                A modern platform for authentic connection, mindful reflection, and community building. No algorithms. No ads. Just pure human interaction.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 cursor-default"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {feature.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/signup"
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                <Sparkles className="w-5 h-5" />
                <span>Start Free Today</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10" />
              </Link>

              <button
                onClick={() => setIsVideoPlaying(true)}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-slate-900 dark:text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-gradient-to-br from-blue-400 to-purple-600 shadow-md"
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Join 10,000+ users
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  ⭐⭐⭐⭐⭐ 4.9/5 rating
                </p>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative animate-fadeInUp" style={{ animationDelay: '0.3s' }}>

            {/* Main Card */}
            <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">Your Feed</h3>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 h-[500px] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-slate-800 pointer-events-none z-10" />

                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-white">User {i}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">2 hours ago</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                      Just finished an amazing reflection session. This platform truly helps me stay mindful and connected.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <button className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>24 likes</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <span>5 comments</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating Action Button */}
              <div className="absolute bottom-6 right-6 z-20">
                <button className="group w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Stats Overlay */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md grid grid-cols-4 gap-2 px-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-center backdrop-blur-sm"
                  style={{
                    animation: `scaleIn 0.5s ease-out ${0.5 + index * 0.1}s both`
                  }}
                >
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400">{stat.value}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-slate-300 dark:border-slate-700 rounded-full p-1">
          <div className="w-1 h-3 bg-slate-400 dark:bg-slate-600 rounded-full mx-auto animate-pulse" />
        </div>
      </div>
    </section>
  );
}
