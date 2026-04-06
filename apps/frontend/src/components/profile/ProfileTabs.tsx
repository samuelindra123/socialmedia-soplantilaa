"use client";

import { useState } from "react";
import { Grid, List, Image as ImageIcon, FileText } from "lucide-react";
import PostCard from "@/components/feed/PostCard";
import Image from "next/image";

interface ProfileTabsProps {
  posts: any[];
  viewerUsername?: string;
}

export default function ProfileTabs({ posts, viewerUsername }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"text" | "media">("text");

  // Filter posts based on content type
  const textPosts = posts.filter(post => (post.type === 'text') || ((!post.images || post.images.length === 0) && (!post.videos || post.videos.length === 0)));
  const mediaPosts = posts.filter(post => (post.type === 'media' || post.type === 'image' || post.type === 'video') || (post.images && post.images.length > 0) || (post.videos && post.videos.length > 0));

  return (
    <div>
      {/* Content */}
      <div className="min-h-[200px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} context="profile" currentUsername={viewerUsername} prefetchComments />
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-slate-500 font-medium">Belum ada postingan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
