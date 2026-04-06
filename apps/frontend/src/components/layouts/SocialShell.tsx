"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import SocialThemeWrapper from "@/components/SocialThemeWrapper";
import Sidebar from "@/components/feed/Sidebar";
import SocialHeader from "@/components/navigation/SocialHeader";
import MobileNav from "@/components/navigation/MobileNav";
import CreatePostModal from "@/components/feed/CreatePostModal";

interface SocialShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  mobileTitle?: string;
  mobileDescription?: string;
  hideMobileHeader?: boolean;
  disableDefaultContentPadding?: boolean;
  hideMobileNav?: boolean;
  mobileHeaderRightSlot?: ReactNode;
}

export default function SocialShell({
  children,
  className,
  contentClassName,
  mobileTitle,
  mobileDescription,
  hideMobileHeader = false,
  disableDefaultContentPadding = false,
  hideMobileNav = false,
  mobileHeaderRightSlot,
}: SocialShellProps) {
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const openComposer = () => setIsComposerOpen(true);
  const closeComposer = () => setIsComposerOpen(false);

  return (
    <SocialThemeWrapper
      className={cn(
        "min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100",
        className
      )}
    >
      <div className="flex min-h-screen w-full">
        <Sidebar onUploadClick={openComposer} />
        <div className="flex-1 min-w-0 flex flex-col">
          {!hideMobileHeader && (
            <SocialHeader
              title={mobileTitle}
              description={mobileDescription}
              onCreatePost={openComposer}
              rightSlot={mobileHeaderRightSlot}
            />
          )}
          <main
            className={cn(
              disableDefaultContentPadding
                ? "flex-1 w-full"
                : hideMobileNav
                  ? "flex-1 w-full px-4 pt-4 pb-6 sm:px-6 lg:px-10 md:pb-0"
                  : "flex-1 w-full px-4 pt-4 pb-24 sm:px-6 lg:px-10 md:pb-0",
              contentClassName
            )}
          >
            {children}
          </main>
        </div>
      </div>
      {!hideMobileNav && <MobileNav />}
      <CreatePostModal isOpen={isComposerOpen} onClose={closeComposer} />
    </SocialThemeWrapper>
  );
}
