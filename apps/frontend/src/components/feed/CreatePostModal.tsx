"use client";

import { useState, useRef, useMemo } from "react";
import {
  X,
  Loader2,
  Play,
  Volume2,
  VolumeX,
  ChevronLeft,
} from "lucide-react";
import { TbGridDots } from "react-icons/tb";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import useAuthStore from "@/store/auth";
import { uploadToAppwrite } from "@/lib/appwrite-storage";
import videoService from "@/lib/api/videoService";
import RichTextarea from "@/components/common/RichTextarea";
import { VideoUploadSection } from "@/components/video/VideoUploadSection";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PostType = "text" | "image" | "video";
type BackgroundTab = "solid" | "gradient" | "decorative";

interface BackgroundOption {
  label: string;
  value: string | null;
  preview?: string;
  textColor?: "light" | "dark";
}

const MAX_WORDS = 10_000;
const MAX_WORDS_LABEL = MAX_WORDS.toLocaleString("id-ID");
const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_FILES = 10;

const countWords = (value: string) => {
  if (!value) return 0;
  const normalized = value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).length;
};

// Background options organized by category
const BACKGROUND_OPTIONS: Record<BackgroundTab, BackgroundOption[]> = {
  solid: [
    { label: "White", value: "#ffffff", preview: "#ffffff", textColor: "dark" },
    { label: "Black", value: "#1a1a2e", preview: "#1a1a2e", textColor: "light" },
    { label: "Dark Blue", value: "#16213e", preview: "#16213e", textColor: "light" },
    { label: "Navy", value: "#0f1419", preview: "#0f1419", textColor: "light" },
    { label: "Midnight", value: "#192734", preview: "#192734", textColor: "light" },
    { label: "Deep Purple", value: "#2d1b4e", preview: "#2d1b4e", textColor: "light" },
    { label: "Deep Red", value: "#4a1f1f", preview: "#4a1f1f", textColor: "light" },
    { label: "Deep Green", value: "#1f4a2f", preview: "#1f4a2f", textColor: "light" },
    { label: "Slate Blue", value: "#3d3d5c", preview: "#3d3d5c", textColor: "light" },
    { label: "Charcoal", value: "#2a2a2a", preview: "#2a2a2a", textColor: "light" },
  ],
  gradient: [
    { label: "Purple Dream", value: "linear-gradient(135deg,#667eea,#764ba2)", preview: "linear-gradient(135deg,#667eea,#764ba2)", textColor: "light" },
    { label: "Sunset Fire", value: "linear-gradient(135deg,#f093fb,#f5576c)", preview: "linear-gradient(135deg,#f093fb,#f5576c)", textColor: "light" },
    { label: "Ocean Blue", value: "linear-gradient(135deg,#4facfe,#00f2fe)", preview: "linear-gradient(135deg,#4facfe,#00f2fe)", textColor: "light" },
    { label: "Tropical", value: "linear-gradient(135deg,#43e97b,#38f9d7)", preview: "linear-gradient(135deg,#43e97b,#38f9d7)", textColor: "dark" },
    { label: "Warm Peach", value: "linear-gradient(135deg,#fa709a,#fee140)", preview: "linear-gradient(135deg,#fa709a,#fee140)", textColor: "dark" },
    { label: "Lavender", value: "linear-gradient(135deg,#a18cd1,#fbc2eb)", preview: "linear-gradient(135deg,#a18cd1,#fbc2eb)", textColor: "dark" },
    { label: "Neon Pink", value: "linear-gradient(135deg,#ff1493,#ff69b4)", preview: "linear-gradient(135deg,#ff1493,#ff69b4)", textColor: "light" },
    { label: "Royal Purple", value: "linear-gradient(135deg,#7c3aed,#d946ef)", preview: "linear-gradient(135deg,#7c3aed,#d946ef)", textColor: "light" },
    { label: "Electric Blue", value: "linear-gradient(135deg,#0ea5e9,#06b6d4)", preview: "linear-gradient(135deg,#0ea5e9,#06b6d4)", textColor: "light" },
    { label: "Coral Sunset", value: "linear-gradient(135deg,#ff7f50,#ff1493)", preview: "linear-gradient(135deg,#ff7f50,#ff1493)", textColor: "light" },
  ],
  decorative: [
    {
      label: "Polka Dots",
      value: "radial-gradient(circle, rgba(255,255,255,0.25) 2px, transparent 2px) 0 0 / 24px 24px, linear-gradient(135deg,#f43f5e,#e11d48)",
      preview: "radial-gradient(circle, rgba(255,255,255,0.25) 2px, transparent 2px) 0 0 / 24px 24px, linear-gradient(135deg,#f43f5e,#e11d48)",
      textColor: "light",
    },
    {
      label: "Diagonal Stripes",
      value: "repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0 8px, transparent 8px 16px), linear-gradient(135deg,#6366f1,#8b5cf6)",
      preview: "repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0 8px, transparent 8px 16px), linear-gradient(135deg,#6366f1,#8b5cf6)",
      textColor: "light",
    },
    {
      label: "Grid",
      value: "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(135deg,#0ea5e9,#0284c7)",
      preview: "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(135deg,#0ea5e9,#0284c7)",
      textColor: "light",
    },
    {
      label: "Zigzag",
      value: "repeating-linear-gradient(120deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px), repeating-linear-gradient(60deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px), linear-gradient(135deg,#f59e0b,#d97706)",
      preview: "repeating-linear-gradient(120deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px), repeating-linear-gradient(60deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px), linear-gradient(135deg,#f59e0b,#d97706)",
      textColor: "light",
    },
    {
      label: "Confetti",
      value: "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.4) 0 3px, transparent 3px), radial-gradient(circle at 60% 10%, rgba(255,255,255,0.3) 0 2px, transparent 2px), radial-gradient(circle at 30% 60%, rgba(255,255,255,0.35) 0 4px, transparent 4px), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.25) 0 3px, transparent 3px), linear-gradient(135deg,#10b981,#059669)",
      preview: "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.4) 0 3px, transparent 3px), radial-gradient(circle at 60% 10%, rgba(255,255,255,0.3) 0 2px, transparent 2px), radial-gradient(circle at 30% 60%, rgba(255,255,255,0.35) 0 4px, transparent 4px), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.25) 0 3px, transparent 3px), linear-gradient(135deg,#10b981,#059669)",
      textColor: "light",
    },
    {
      label: "Diamonds",
      value: "repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 10px, transparent 10px 20px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.12) 0 10px, transparent 10px 20px), linear-gradient(135deg,#ec4899,#be185d)",
      preview: "repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 10px, transparent 10px 20px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.12) 0 10px, transparent 10px 20px), linear-gradient(135deg,#ec4899,#be185d)",
      textColor: "light",
    },
    {
      label: "Waves",
      value: "repeating-radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0 20px, transparent 20px 40px), linear-gradient(135deg,#7c3aed,#4f46e5)",
      preview: "repeating-radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0 20px, transparent 20px 40px), linear-gradient(135deg,#7c3aed,#4f46e5)",
      textColor: "light",
    },
    {
      label: "Night Sky",
      value: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0 1px, transparent 1px), radial-gradient(circle at 70% 15%, rgba(255,255,255,0.5) 0 1.5px, transparent 1.5px), radial-gradient(circle at 45% 60%, rgba(255,255,255,0.4) 0 1px, transparent 1px), radial-gradient(circle at 85% 50%, rgba(255,255,255,0.55) 0 1px, transparent 1px), radial-gradient(circle at 10% 80%, rgba(255,255,255,0.45) 0 1.5px, transparent 1.5px), linear-gradient(135deg,#0f172a,#1e1b4b)",
      preview: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0 1px, transparent 1px), radial-gradient(circle at 70% 15%, rgba(255,255,255,0.5) 0 1.5px, transparent 1.5px), radial-gradient(circle at 45% 60%, rgba(255,255,255,0.4) 0 1px, transparent 1px), radial-gradient(circle at 85% 50%, rgba(255,255,255,0.55) 0 1px, transparent 1px), radial-gradient(circle at 10% 80%, rgba(255,255,255,0.45) 0 1.5px, transparent 1.5px), linear-gradient(135deg,#0f172a,#1e1b4b)",
      textColor: "light",
    },
  ],
};

// Quick select (first 5 gradients for the bar)
const QUICK_SELECT_BG: BackgroundOption[] = [
  { label: "Purple Dream", value: "linear-gradient(135deg,#667eea,#764ba2)", preview: "linear-gradient(135deg,#667eea,#764ba2)", textColor: "light" },
  { label: "Sunset Fire", value: "linear-gradient(135deg,#f093fb,#f5576c)", preview: "linear-gradient(135deg,#f093fb,#f5576c)", textColor: "light" },
  { label: "Ocean Blue", value: "linear-gradient(135deg,#4facfe,#00f2fe)", preview: "linear-gradient(135deg,#4facfe,#00f2fe)", textColor: "light" },
  { label: "Tropical", value: "linear-gradient(135deg,#43e97b,#38f9d7)", preview: "linear-gradient(135deg,#43e97b,#38f9d7)", textColor: "dark" },
  { label: "Warm Peach", value: "linear-gradient(135deg,#fa709a,#fee140)", preview: "linear-gradient(135deg,#fa709a,#fee140)", textColor: "dark" },
];

const getTextareaStyle = (bg: BackgroundOption | null) => {
  if (!bg?.value) return {};
  return {
    background: bg.value,
    color: resolveTextColor(bg),
    textShadow: resolveTextColor(bg) === "#ffffff" ? "0 1px 2px rgba(0,0,0,0.45)" : "none",
  } as const;
};

const resolveTextColor = (bg: BackgroundOption | null) => {
  if (!bg?.value) return undefined;

  if (bg.textColor) {
    return bg.textColor === "dark" ? "#0f172a" : "#ffffff";
  }

  const normalized = bg.value.toLowerCase();
  if (normalized.includes("#fff") || normalized.includes("white")) {
    return "#0f172a";
  }

  if (
    normalized.includes("#000") ||
    normalized.includes("black") ||
    normalized.includes("#1a1a2e") ||
    normalized.includes("#16213e")
  ) {
    return "#ffffff";
  }

  return "#ffffff";
};

const getPreviewStyle = (bg: BackgroundOption) => {
  if (!bg.value) return {};
  return { background: bg.preview || bg.value } as const;
};

function VideoPreview({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  return (
    <div className="relative w-full h-full">
      <video
        ref={ref}
        src={url}
        className="w-full h-full object-cover"
        loop
        muted={muted}
        playsInline
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>
      )}
      <button
        onClick={() => {
          if (!ref.current) return;
          if (playing) {
            ref.current.pause();
          } else {
            ref.current.play();
          }
          setPlaying(!playing);
        }}
        className="absolute inset-0"
        aria-label="Toggle play"
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!ref.current) return;
          ref.current.muted = !muted;
          setMuted(!muted);
        }}
        className="absolute bottom-2 right-2 p-2 bg-slate-900/50 hover:bg-slate-900/70 rounded-full text-white backdrop-blur-sm transition-colors"
        aria-label="Toggle mute"
      >
        {muted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default function CreatePostModal({
  isOpen,
  onClose,
}: CreatePostModalProps) {
  const [activeTab, setActiveTab] = useState<PostType>("text");

  // Common State
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [link, setLink] = useState("");

  // Media State
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedThumbBlob, setSelectedThumbBlob] = useState<Blob | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<
    "idle" | "preparing" | "uploading" | "publishing"
  >("idle");
  const [isUploading, setIsUploading] = useState(false);
  const [isPostingText, setIsPostingText] = useState(false);
  const [isPostingImage, setIsPostingImage] = useState(false);
  const [isPostingVideo, setIsPostingVideo] = useState(false);
  const [selectedBg, setSelectedBg] = useState<BackgroundOption | null>(null);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [bgMenuTab, setBgMenuTab] = useState<BackgroundTab>("gradient");

  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const textWordCount = useMemo(() => countWords(content), [content]);
  const descriptionWordCount = useMemo(() => countWords(description), [description]);

  const resetForm = () => {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setContent("");
    setImageFiles([]);
    setImagePreviews([]);
    setVideoFile(null);
    setVideoPreview(null);
    setSelectedVideoFile(null);
    setSelectedThumbBlob(null);
    setTitle("");
    setDescription("");
    setTags([]);
    setCurrentTag("");
    setLink("");
    setUploadProgress(0);
    setUploadStage("idle");
    setSelectedBg(null);
    setShowBgMenu(false);
    setShowMediaMenu(false);
    setBgMenuTab("gradient");
  };

  const handleTextContentChange = (value: string) => {
    if (countWords(value) > MAX_WORDS) {
      toast.error(`Konten maksimal ${MAX_WORDS_LABEL} kata`);
      return;
    }
    setContent(value);

    // Auto-extract judul: baris pertama pendek jadi title
    const lines = value.split('\n');
    const firstLine = lines[0].trim();
    setTitle(firstLine.length > 0 && firstLine.length <= 80 && lines.length > 1 ? firstLine : '');

    // Auto-extract URL
    const urlMatch = value.match(/https?:\/\/[^\s]+/);
    setLink(urlMatch ? urlMatch[0] : '');

    // Auto-extract #tag dari konten → kirim ke backend
    const extracted = (value.match(/#([\w\u00C0-\u024F]+)/g) || []).map(t => t.slice(1));
    setTags(extracted);
  };

  const handleDescriptionChange = (value: string) => {
    if (countWords(value) > MAX_WORDS) {
      toast.error(`Deskripsi maksimal ${MAX_WORDS_LABEL} kata`);
      return;
    }
    setDescription(value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const incoming = Array.from(e.target.files);
    // Only take the first file
    const file = incoming[0];
    if (!file) { e.target.value = ""; return; }

    if (file.type.startsWith("video/")) {
      if (imageFiles.length > 0) {
        imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
        setImageFiles([]);
        setImagePreviews([]);
      }

      if (videoFile) {
        removeVideo();
      }

      if (!file.type.startsWith("video/")) {
        toast.error("File harus berupa video");
        e.target.value = "";
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        toast.error("Ukuran video maksimal 100MB");
        e.target.value = "";
        return;
      }

      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      e.target.value = "";
      return;
    }

    if (videoFile) {
      removeVideo();
    }

    if (imageFiles.length > 0) {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setImageFiles([]);
      setImagePreviews([]);
    }

    if (incoming.length > 1) {
      toast.error("Hanya bisa 1 foto, foto pertama yang digunakan");
    }

    const isValidType = ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type);
    if (!isValidType) {
      toast.error("Hanya JPG, PNG, dan WebP yang diizinkan");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      toast.error("Ukuran gambar maksimal 5MB");
      e.target.value = "";
      return;
    }

    setImageFiles([file]);
    setImagePreviews([URL.createObjectURL(file)]);
    e.target.value = "";
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (imageFiles.length > 0) {
        imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
        setImageFiles([]);
        setImagePreviews([]);
      }

      if (!file.type.startsWith("video/")) {
        toast.error("File harus berupa video");
        e.target.value = "";
        return;
      }
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Ukuran video maksimal 100MB");
        e.target.value = "";
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const getUploadStageLabel = () => {
    switch (uploadStage) {
      case "preparing":
        return "Menyiapkan upload cepat...";
      case "uploading":
        return "Mengunggah media...";
      case "publishing":
        return "Mempublikasikan postingan...";
      default:
        return "Mengunggah...";
    }
  };

  const getVideoProcessingToast = (progress: number) => {
    if (progress <= 30) return '⚙️ Mengkompres video...';
    if (progress <= 60) return '🖼️ Membuat thumbnail...';
    if (progress <= 85) return '☁️ Mengupload ke cloud...';
    return '✨ Finishing up...';
  };

  // Submit Text Post
  const submitTextPost = async (overrideContent?: string) => {
    const plainText = (overrideContent ?? content).trim();
    const effectiveContent = plainText || (selectedBg?.value ? '\u00A0' : '');

    if (!effectiveContent.trim()) {
      toast.error('Harap isi konten postingan');
      return;
    }

    try {
      setIsPostingText(true);
      setIsUploading(true);
      setUploadStage('uploading');
      await apiClient.post('/posts/text', {
        content: effectiveContent,
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(tags.length ? { tags } : {}),
        ...(link.trim() ? { link: [link.trim()] } : {}),
        ...(selectedBg?.value ? { background: selectedBg.value } : {}),
      });
      toast.success('Postingan berhasil dibagikan!');
      queryClient.refetchQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.profile?.username] });
      resetForm();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal memposting');
    } finally {
      setIsPostingText(false);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStage('idle');
    }
  };

  // Submit Image Post
  const submitImagePost = async (overrideDesc?: string) => {
    if (imageFiles.length === 0) {
      toast.error("Tambahkan setidaknya satu gambar");
      return;
    }
    const desc = (overrideDesc ?? description).trim();
    if (!desc) {
      toast.error("Isi deskripsi untuk posting gambar");
      return;
    }

    if (countWords(desc) > MAX_WORDS) {
      toast.error(`Deskripsi gambar maksimal ${MAX_WORDS_LABEL} kata`);
      return;
    }

    try {
      setIsPostingImage(true);
      setIsUploading(true);

      const postContent = desc;
      let usedFallbackUpload = false;
      let uploadedMediaUrls: string[] = [];

      try {
        setUploadStage("preparing");

        const totalBytes = imageFiles.reduce((sum, file) => sum + file.size, 0) || 1;
        const uploadedBytesByFile = new Array(imageFiles.length).fill(0);

        setUploadStage("uploading");
        const results = await Promise.all(
          imageFiles.map(async (file, index) => {
            const result = await uploadToAppwrite(file, (percent) => {
              uploadedBytesByFile[index] = (file.size * percent) / 100;
              const totalUploaded = uploadedBytesByFile.reduce((sum, v) => sum + v, 0);
              setUploadProgress(
                Math.min(99, Math.round((totalUploaded / totalBytes) * 100))
              );
            });
            return result.fileUrl;
          })
        );

        uploadedMediaUrls = results;
        setUploadStage("publishing");
        setUploadProgress(100);
      } catch (fastUploadError) {
        usedFallbackUpload = true;
        console.warn("Appwrite upload failed, fallback ke multipart backend:", fastUploadError);

        const fd = new FormData();
        if (title.trim()) fd.append("title", title);
        fd.append("content", postContent);
        tags.forEach((tag) => fd.append("tags", tag));
        imageFiles.forEach((file) => fd.append("images", file));

        setUploadStage("uploading");
        setUploadProgress(0);

        await apiClient.post("/posts/images", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
          onUploadProgress: (e) => {
            if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
          },
        });
      }

      if (!usedFallbackUpload) {
        await apiClient.post("/posts/from-urls", {
          title: title.trim() || undefined,
          content: postContent,
          tags,
          ...(link.trim() ? { link: [link.trim()] } : {}),
          type: "image",
          mediaType: "image",
          mediaUrls: uploadedMediaUrls,
        });
      }

      if (usedFallbackUpload) {
        toast.success("Gambar berhasil diunggah!");
      } else {
        toast.success("Gambar berhasil diunggah super cepat! ⚡");
      }

      queryClient.refetchQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({
        queryKey: ["profile", user?.profile?.username],
      });
      resetForm();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Gagal mengunggah gambar";
      toast.error(msg);
    } finally {
      setIsPostingImage(false);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStage("idle");
    }
  };

  // Submit Video Post — modal tutup dulu, upload di background
  const submitVideoPost = () => {
    if (!selectedVideoFile || !description.trim()) return;

    const fileToUpload = selectedVideoFile;
    const thumbToUpload = selectedThumbBlob ?? undefined;
    const postContent = description.trim();
    const postTitle = title.trim() || undefined;
    const postTags = [...tags];
    const postLink = link.trim();

    resetForm();
    onClose();

    const toastId = toast.loading('📤 Mengunggah video... 0%');

    void (async () => {
      try {
        const { id: videoId } = await videoService.uploadVideo(
          fileToUpload,
          thumbToUpload,
          (percent) => {
            toast.loading(`📤 Mengunggah video... ${percent}%`, { id: toastId });
          },
        );

        toast.loading('📝 Memposting...', { id: toastId });

        await apiClient.post('/posts/video-from-id', {
          videoId,
          content: postContent,
          title: postTitle,
          tags: postTags,
          ...(postLink ? { link: [postLink] } : {}),
        });

        toast.success('✅ Video berhasil diposting!', { id: toastId });
        void queryClient.refetchQueries({ queryKey: ['feed'] });
      } catch (e: unknown) {
        const msg =
          (e as any)?.response?.data?.message ??
          (e as Error)?.message ??
          'Gagal memposting video';
        toast.error(`❌ ${msg}`, { id: toastId });
      }
    })();
  };

  // Get submit handler based on active tab
  const handleSubmit = () => {
    switch (activeTab) {
      case "text":
        submitTextPost();
        break;
      case "image":
        submitImagePost();
        break;
      case "video":
        submitVideoPost();
        break;
    }
  };

  // Check if submit is disabled
  const isSubmitDisabled = () => {
    if (isUploading || isPostingText || isPostingImage || isPostingVideo)
      return true;

    switch (activeTab) {
      case "text":
        const plainText = content.replace(/<[^>]+>/g, "").trim();
        return !plainText || textWordCount > MAX_WORDS;
      case "image":
        return (
          imageFiles.length === 0 ||
          !description.trim() ||
          descriptionWordCount > MAX_WORDS
        );
      case "video":
        return (
          !videoFile ||
          !description.trim() ||
          descriptionWordCount > MAX_WORDS
        );
    }
  };

  // Get submit button text
  const getSubmitText = () => {
    const isLoading = isPostingText || isPostingImage || isPostingVideo;
    switch (activeTab) {
      case "text":
        return isLoading ? "Memposting..." : "Bagikan";
      case "image":
        return isLoading ? "Mengunggah..." : "Kirim Gambar";
      case "video":
        return isLoading ? "Mengunggah..." : "Kirim Video";
    }
  };

  if (!isOpen) return null;

  const isLoading = isPostingText || isPostingImage || isPostingVideo || isUploading;
  const submitType: PostType = activeTab === "video" && (selectedVideoFile || videoFile) ? "video" : imageFiles.length > 0 ? "image" : "text";
  const plainText = content.replace(/<[^>]+>/g, "").trim();
  const canSubmit = !isLoading && (
    submitType === "video"
      ? !!selectedVideoFile && !!description.trim()
      : submitType === "image"
        ? imageFiles.length > 0 && !!description.trim()
        : !!plainText || !!selectedBg?.value
  );

  const handleUnifiedSubmit = () => {
    const textVal = submitType === 'text' ? content.trim() : description.trim();

    if (!textVal && !selectedBg?.value) {
      toast.error('Konten tidak boleh kosong');
      return;
    }

    setActiveTab(submitType);

    if (submitType === 'text') submitTextPost(textVal);
    else if (submitType === 'image') submitImagePost(textVal);
    else submitVideoPost();
  };

  const hasBg = !!selectedBg?.value;
  const activeBgStyle = getTextareaStyle(selectedBg);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#242526] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center justify-center px-4 py-3.5 border-b border-slate-200 dark:border-white/[0.08]">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Buat Postingan
          </h2>
          <button
            onClick={onClose}
            className="absolute right-3 p-1.5 rounded-full bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* User row */}
          <div className="flex items-center gap-3 px-4 pt-4">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 ring-2 ring-indigo-200 dark:ring-indigo-500/20">
              {user?.profile?.profileImageUrl ? (
                <img
                  src={user.profile.profileImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white font-bold text-sm">
                  {user?.namaLengkap?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {user?.namaLengkap}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Publik</p>
            </div>
          </div>

          {/* Text area — with optional background */}
          {!imageFiles.length && !videoFile && (
            <div
              className={`mx-4 mt-3 rounded-2xl overflow-hidden transition-all relative ${
                !hasBg && isFocused
                  ? 'ring-2 ring-indigo-400 dark:ring-indigo-500'
                  : !hasBg
                  ? 'ring-1 ring-slate-200 dark:ring-white/[0.08]'
                  : ''
              }`}
              style={hasBg ? { ...activeBgStyle, minHeight: 360 } : {}}
            >
              <RichTextarea
                value={submitType === 'text' ? content : description}
                onChange={(plain) => {
                  if (submitType === 'text') handleTextContentChange(plain);
                  else handleDescriptionChange(plain);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={`Apa yang kamu pikirkan, ${user?.namaLengkap?.split(" ")[0] || "kamu"}? Ketik #tag atau tempel link.`}
                className={hasBg ? "text-2xl font-bold text-center" : "text-slate-900 dark:text-white text-[17px]"}
              />

              {/* Quick background selector bar (bottom-left when text bg is active) */}
              {hasBg && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                  {/* Back button */}
                  <button
                    onClick={() => setSelectedBg(null)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    title="Remove background"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>

                  {/* Quick select gradients */}
                  {QUICK_SELECT_BG.slice(0, 5).map((bg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedBg(bg)}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-transform hover:scale-110 ${
                        selectedBg?.value === bg.value
                          ? "border-white scale-110"
                          : "border-white/40"
                      }`}
                      style={getPreviewStyle(bg)}
                      title={bg.label}
                    />
                  ))}

                  {/* Grid icon to expand menu */}
                  <button
                    onClick={() => setShowBgMenu(!showBgMenu)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors ml-1"
                    title="More backgrounds"
                  >
                    <TbGridDots size={16} color="white" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Expanded background menu */}
          {showBgMenu && !imageFiles.length && !videoFile && (
            <div className="mx-4 mt-2 p-3 bg-slate-100 dark:bg-white/[0.06] rounded-xl">
              {/* Tabs */}
              <div className="flex gap-2 mb-3 border-b border-slate-300 dark:border-white/[0.1]">
                {["solid", "gradient", "decorative"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setBgMenuTab(tab as BackgroundTab)}
                    className={`px-3 py-2 text-sm font-semibold rounded-t transition-colors ${
                      bgMenuTab === tab
                        ? "bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                    }`}
                  >
                    {tab === "solid"
                      ? "Solid"
                      : tab === "gradient"
                        ? "Gradients"
                        : "Decorative"}
                  </button>
                ))}
              </div>

              {/* Options grid */}
              <div className="grid grid-cols-5 gap-2">
                {BACKGROUND_OPTIONS[bgMenuTab].map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedBg(option);
                      setShowBgMenu(false);
                    }}
                    className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 flex items-center justify-center text-xs font-semibold cursor-pointer overflow-hidden ${
                      selectedBg?.value === option.value
                        ? "border-indigo-500 ring-2 ring-indigo-400/50"
                        : "border-slate-300 dark:border-white/[0.1]"
                    }`}
                    style={getPreviewStyle(option)}
                    title={option.label}
                  >
                    {bgMenuTab === "decorative" && (
                      <span className="rounded bg-black/25 px-1.5 py-0.5 text-[10px] text-white drop-shadow-sm">
                        {option.label.substring(0, 2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No background button when no bg selected */}
          {!hasBg && !imageFiles.length && !videoFile && (
            <div className="px-4 pt-2 pb-1">
              <button
                onClick={() => setShowBgMenu(!showBgMenu)}
                className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 transition-colors"
              >
                ✨ Pilih warna atau motif
              </button>
            </div>
          )}

          {/* Description when media attached */}
          {(imageFiles.length > 0 || videoFile) && (
            <RichTextarea
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Tulis deskripsi... #tag dan link otomatis berwarna."
              className="text-slate-900 dark:text-white text-[15px]"
            />
          )}

          {/* Image grid */}
          {imagePreviews.length > 0 && (
            <div className="mx-4 mt-2 rounded-xl overflow-hidden">
              {imagePreviews.length === 1 ? (
                /* Single image — tampil penuh tanpa crop */
                <div className="relative group bg-black rounded-xl overflow-hidden">
                  <img
                    src={imagePreviews[0]}
                    alt=""
                    className="w-full max-h-[420px] object-contain"
                  />
                  <button
                    onClick={() => removeImage(0)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Multiple images — tidak akan tercapai, tapi tetap aman */
                <div
                  className={`grid gap-1 ${
                    imagePreviews.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-3"
                  }`}
                >
                  {imagePreviews.map((url, idx) => (
                    <div key={idx} className="relative aspect-square group bg-slate-900 rounded overflow-hidden">
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Video preview — only for legacy video tab (old flow) */}
          {videoPreview && activeTab !== "video" && (
            <div className="mx-4 mt-2 relative aspect-video bg-black rounded-xl overflow-hidden group">
              <VideoPreview url={videoPreview} />
              <button
                onClick={removeVideo}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Video Upload Section */}
          {activeTab === "video" && (
            <div className="mx-4 mt-2">
              <VideoUploadSection
                onFileSelected={(file, thumbBlob) => {
                  setSelectedVideoFile(file);
                  setSelectedThumbBlob(thumbBlob);
                }}
                onFileRemoved={() => {
                  setSelectedVideoFile(null);
                  setSelectedThumbBlob(null);
                }}
                disabled={false}
              />
            </div>
          )}

          {/* Upload progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="px-4 pt-2 space-y-1">
              <div className="w-full h-1.5 bg-slate-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  style={{ width: `${uploadProgress}%` }}
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                {getUploadStageLabel()} {uploadProgress}%
              </p>
            </div>
          )}


          <div className="h-3" />
        </div>

        {/* Bottom toolbar - photo and video */}
        <div className="border-t border-slate-200 dark:border-white/[0.08] px-4 py-3 flex items-center justify-between">
          {/* Media actions */}
          <div className="flex items-center gap-2">
            {/* Photo button */}
            <button
              type="button"
              onClick={() => {
                if (hasBg) return;
                if (activeTab === "video") {
                  setActiveTab("image");
                  setSelectedVideoFile(null);
                }
                imageInputRef.current?.click();
              }}
              disabled={hasBg}
              className={`inline-flex h-10 px-4 items-center justify-center gap-2 rounded-lg transition-colors ${
                activeTab === "image" && imageFiles.length > 0
                  ? "bg-blue-100 text-blue-600"
                  : "text-slate-600 hover:bg-slate-100"
              } ${hasBg ? "opacity-40 cursor-not-allowed" : ""}`}
              title={hasBg ? "Hapus background dulu" : "Tambah foto"}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <rect x="3.25" y="5" width="17.5" height="13.5" rx="3.25" stroke="currentColor" strokeWidth="1.8" />
                <path d="M6 15.75L9.25 12.5L12 14.95L14.65 12.35L18 15.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9.25" cy="9.1" r="1.15" stroke="currentColor" strokeWidth="1.7" />
              </svg>
              <span className="text-sm font-medium">Foto</span>
            </button>

            {/* Video button */}
            <button
              type="button"
              onClick={() => {
                if (hasBg) return;
                if (activeTab !== "video") {
                  setActiveTab("video");
                  setImageFiles([]);
                  setImagePreviews([]);
                  setVideoFile(null);
                  setVideoPreview(null);
                }
              }}
              disabled={hasBg}
              className={`inline-flex h-10 px-4 items-center justify-center gap-2 rounded-lg transition-colors ${
                activeTab === "video"
                  ? "bg-blue-100 text-blue-600"
                  : "text-slate-600 hover:bg-slate-100"
              } ${hasBg ? "opacity-40 cursor-not-allowed" : ""}`}
              title={hasBg ? "Hapus background dulu" : "Tambah video"}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M8 7.5l8 4.5-8 4.5v-9Z" fill="currentColor" />
                <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.7" />
              </svg>
              <span className="text-sm font-medium">Video</span>
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleUnifiedSubmit}
            disabled={!canSubmit}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPostingVideo ? 'Mengunggah...' : 'Bagikan'}
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={imageInputRef}
          id="media-picker-input"
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          multiple
          className="hidden"
          onChange={handleImageChange}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          className="hidden"
          onChange={handleVideoChange}
        />
      </div>
    </div>
  );
}
