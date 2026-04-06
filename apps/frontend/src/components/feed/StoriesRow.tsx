"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import useAuthStore from "@/store/auth";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewer from "./StoryViewer";

interface StoryUser {
  id: string;
  namaLengkap: string;
  profile?: {
    username: string;
    profileImageUrl: string | null;
  };
}

interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
  caption?: string;
  type: "IMAGE" | "VIDEO";
  createdAt: string;
  expiresAt: string;
  isSeen: boolean;
}

interface StoryGroup {
  user: StoryUser;
  stories: Story[];
  hasUnseen: boolean;
}

export default function StoriesRow() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{
    groups: StoryGroup[];
    startIndex: number;
  } | null>(null);

  const { data: storyGroups = [], isLoading } = useQuery<StoryGroup[]>({
    queryKey: ["stories", "feed"],
    queryFn: async () => {
      const res = await apiClient.get("/stories/feed");
      return res.data || [];
    },
    staleTime: 1000 * 60 * 2,
    retry: false,
    enabled: !!user,
  });

  // Find current user's story group
  const myStoryGroup = storyGroups.find((g) => g.user.id === user?.id);
  const otherStoryGroups = storyGroups.filter((g) => g.user.id !== user?.id);

  const handleOpenMyStory = () => {
    if (myStoryGroup && myStoryGroup.stories.length > 0) {
      // Open viewer with my stories
      const allGroups = [myStoryGroup, ...otherStoryGroups];
      setViewerData({ groups: allGroups, startIndex: 0 });
    } else {
      // Open create modal
      setIsCreateOpen(true);
    }
  };

  const handleAddMoreStories = () => {
    setIsCreateOpen(true);
  };

  const handleOpenStory = (groupIndex: number) => {
    const allGroups = myStoryGroup
      ? [myStoryGroup, ...otherStoryGroups]
      : otherStoryGroups;
    const actualIndex = myStoryGroup ? groupIndex + 1 : groupIndex;
    setViewerData({ groups: allGroups, startIndex: actualIndex });
  };

  const handleStoryCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["stories", "feed"] });
    setIsCreateOpen(false);
  };

  const handleCloseViewer = () => {
    setViewerData(null);
    queryClient.invalidateQueries({ queryKey: ["stories", "feed"] });
  };

  return (
    <>
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {/* My Story / Add Story */}
        <button
          onClick={handleOpenMyStory}
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
        >
          <div className="relative">
            <div
              className={`w-16 h-16 rounded-full p-[2px] ${
                myStoryGroup && myStoryGroup.stories.length > 0
                  ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-slate-100 dark:bg-slate-800">
                {user?.profile?.profileImageUrl ? (
                  <img
                    src={user.profile.profileImageUrl}
                    alt="Your story"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                    {user?.profile?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>
            {/* Plus button - always show to add more */}
            <div 
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleAddMoreStories();
              }}
            >
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate w-16 text-center font-medium">
            {myStoryGroup && myStoryGroup.stories.length > 0
              ? "Cerita Anda"
              : "Tambah"}
          </span>
        </button>

        {/* Loading skeleton */}
        {isLoading &&
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 animate-pulse"
            >
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="w-12 h-2 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}

        {/* Other users' stories */}
        {!isLoading &&
          otherStoryGroups.map((group, index) => (
            <button
              key={group.user.id}
              onClick={() => handleOpenStory(index)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
            >
              <div
                className={`w-16 h-16 rounded-full p-[2px] transition-all ${
                  group.hasUnseen
                    ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {group.user.profile?.profileImageUrl ? (
                    <img
                      src={group.user.profile.profileImageUrl}
                      alt={group.user.profile.username}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold">
                      {group.user.profile?.username?.charAt(0).toUpperCase() ||
                        "U"}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate w-16 text-center font-medium">
                {group.user.profile?.username || "user"}
              </span>
            </button>
          ))}
      </div>

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleStoryCreated}
      />

      {/* Story Viewer */}
      {viewerData && (
        <StoryViewer
          groups={viewerData.groups}
          startGroupIndex={viewerData.startIndex}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
}
