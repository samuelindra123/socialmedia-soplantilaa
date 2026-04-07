"use client";

import {
  Heart,
  Users,
  Shield,
  Zap,
  MessageCircle,
  TrendingUp,
  Lock,
  Globe,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function ProductShowcase() {
  const features = [
    {
      icon: Heart,
      title: "Mindful Feed",
      description: "An algorithm-free timeline that shows posts from people you care about, not what drives engagement metrics.",
      gradient: "from-rose-500 to-pink-600",
      iconBg: "bg-rose-50 dark:bg-rose-900/20",
      iconColor: "text-rose-600 dark:text-rose-400",
    },
    {
      icon: MessageCircle,
      title: "Real-time Messaging",
      description: "Instant, encrypted conversations with individuals or groups. Your messages stay private and secure.",
      gradient: "from-blue-500 to-cyan-600",
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Users,
      title: "Private Communities",
      description: "Create or join circles around shared interests. Foster deep connections in safe, moderated spaces.",
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "End-to-end encryption, zero data selling, and full control over your content. Your data is yours.",
      gradient: "from-purple-500 to-indigo-600",
      iconBg: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      icon: TrendingUp,
      title: "Analytics Dashboard",
      description: "Understand your community engagement with beautiful, privacy-respecting insights and metrics.",
      gradient: "from-orange-500 to-red-600",
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance with instant loading, smooth animations, and real-time updates.",
      gradient: "from-yellow-500 to-amber-600",
      iconBg: "bg-yellow-50 dark:bg-yellow-900/20",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
  ];

  const values = [
    {
      icon: Lock,
      title: "No Surveillance",
      description: "We don't track, profile, or sell your data. Ever.",
    },
    {
      icon: Globe,
      title: "Open Standards",
      description: "Built on open protocols. Your data is portable.",
    },
    {
      icon: Heart,
      title: "Human First",
      description: "Designed for wellbeing, not addiction.",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden">

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 dark:opacity-10" />

      {/* Gradient Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-full shadow-lg">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Features that Matter
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Everything you need for
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              meaningful connection
            </span>
          </h2>

          <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
            Built with intention. Every feature designed to bring people together, not tear them apart.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Gradient Overlay on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover Arrow */}
                  <div className="mt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-sm">Learn more</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Values Section */}
        <div className="relative bg-gradient-to-br from-slate-900 to-blue-900 dark:from-slate-800 dark:to-blue-900 rounded-3xl p-12 lg:p-16 overflow-hidden shadow-2xl">

          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

          {/* Content */}
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h3 className="text-3xl lg:text-4xl font-black text-white mb-4">
                Our Core Values
              </h3>
              <p className="text-blue-200 text-lg max-w-2xl mx-auto">
                We're not just another social platform. We're building something different.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div
                    key={index}
                    className="text-center space-y-4"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${0.8 + index * 0.2}s both`
                    }}
                  >
                    <div className="inline-flex w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl items-center justify-center">
                      <Icon className="w-8 h-8 text-blue-300" />
                    </div>
                    <h4 className="text-xl font-bold text-white">
                      {value.title}
                    </h4>
                    <p className="text-blue-200 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <Link
                href="/manifesto"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-blue-50 text-slate-900 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <span>Read Our Manifesto</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
