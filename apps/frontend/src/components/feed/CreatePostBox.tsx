"use client";

import { useState } from "react";
import { ImageIcon, FileText, Smile } from "lucide-react";
import useAuthStore from "@/store/auth";
import SmartImage from "@/components/ui/SmartImage";
import CreatePostModal from "./CreatePostModal";

export default function CreatePostBox() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const firstName = user?.namaLengkap?.split(" ")[0] || "kamu";

  return (
    <>
      <div className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-4 mb-4 shadow-sm">
        {/* Input row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 ring-2 ring-indigo-200 dark:ring-indigo-500/20">
            {user?.profile?.profileImageUrl ? (
              <SmartImage
                src={user.profile.profileImageUrl}
                alt={user.namaLengkap}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white text-sm font-bold">
                {user?.namaLengkap?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 text-left px-4 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 dark:text-slate-500 text-sm hover:bg-slate-200 dark:hover:bg-white/[0.09] transition-colors"
          >
            Bagikan refleksimu, {firstName}...
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center border-t border-slate-100 dark:border-white/[0.06] pt-3 -mb-1">
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 py-1.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-indigo-500" />
            <span>Foto/Video</span>
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 py-1.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            <FileText className="w-4 h-4 text-violet-500" />
            <span>Refleksi</span>
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 py-1.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            <Smile className="w-4 h-4 text-amber-500" />
            <span>Perasaan</span>
          </button>
        </div>
      </div>

      <CreatePostModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
