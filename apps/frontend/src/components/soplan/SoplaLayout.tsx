"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import SocialThemeWrapper from "@/components/SocialThemeWrapper";
import SoplaNavbar from "./SoplaNavbar";
import SoplaLeftSidebar from "./SoplaLeftSidebar";
import SoplaRightSidebar from "./SoplaRightSidebar";
import MobileNav from "@/components/navigation/MobileNav";
import SocialHeader from "@/components/navigation/SocialHeader";

interface SoplaLayoutProps {
  children: ReactNode;
  hideRight?: boolean;
  hideLeft?: boolean;
  maxWidth?: string;
  className?: string;
  contentClassName?: string;
}

export default function SoplaLayout({
  children,
  hideRight = false,
  hideLeft = false,
  maxWidth = "max-w-[640px]",
  className,
  contentClassName,
}: SoplaLayoutProps) {
  return (
    <SocialThemeWrapper
      className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F0F10] text-slate-900 dark:text-slate-100"
    >
      {/* Desktop top navbar */}
      <SoplaNavbar />

      {/* Mobile header */}
      <SocialHeader className="md:hidden" />

      <div className="flex w-full md:pt-[60px] min-h-screen">
        {/* Left sidebar — desktop only */}
        {!hideLeft && <SoplaLeftSidebar />}

        {/* Center feed */}
        <main
          className={cn(
            "flex-1 min-w-0 w-full py-5 px-3 sm:px-4 pb-24 md:pb-6",
            contentClassName && "!p-0 !m-0",
            className
          )}
        >
          <div className={cn("mx-auto w-full", !contentClassName && maxWidth, contentClassName)}>
            {children}
          </div>
        </main>

        {/* Right sidebar — desktop only */}
        {!hideRight && <SoplaRightSidebar />}
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </SocialThemeWrapper>
  );
}
