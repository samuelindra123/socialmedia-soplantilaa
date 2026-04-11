"use client";

import { useAuthStore } from "@/store/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Clock3, MessageCircle, UserMinus, UserPlus, Check,
  Pencil, Camera, X, Plus, Loader2,
} from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/api/client";
import { uploadToAppwrite } from "@/lib/appwrite-storage";

type ProfileUser = {
  id: string;
  username?: string;
  namaLengkap: string;
  profileImageUrl?: string;
  backgroundProfileUrl?: string;
  bio?: string;
  tempatKelahiran?: string;
  tanggalLahir?: string;
  memberSince?: string;
  websites?: string[];
  profile?: {
    username?: string;
    profileImageUrl?: string | null;
    backgroundProfileUrl?: string | null;
    bio?: string | null;
    tempatKelahiran?: string | null;
    tanggalLahir?: string | null;
    websites?: string[];
  };
};

type ProfileHeaderProps = {
  user: ProfileUser;
  stats: { postsCount: number; followersCount: number; followingCount: number };
};

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ user, onClose }: { user: ProfileUser; onClose: () => void }) {
  const qc = useQueryClient();
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const profile = user.profile;
  const [form, setForm] = useState({
    namaLengkap: user.namaLengkap || "",
    username: profile?.username || user.username || "",
    bio: profile?.bio || user.bio || "",
    tempatKelahiran: profile?.tempatKelahiran || user.tempatKelahiran || "",
    tanggalLahir: profile?.tanggalLahir
      ? profile.tanggalLahir.slice(0, 10)
      : user.tanggalLahir
        ? user.tanggalLahir.slice(0, 10)
        : "",
    websites: (profile?.websites || user.websites || []).join(", "),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      if (form.namaLengkap) fd.append("namaLengkap", form.namaLengkap);
      if (form.username) fd.append("username", form.username);
      if (form.bio) fd.append("bio", form.bio);
      if (form.tempatKelahiran) fd.append("tempatKelahiran", form.tempatKelahiran);
      if (form.tanggalLahir) fd.append("tanggalLahir", form.tanggalLahir);
      const sites = form.websites.split(",").map((s) => s.trim()).filter(Boolean);
      if (sites.length) fd.append("websites", JSON.stringify(sites));
      if (avatarFile) fd.append("profileImage", avatarFile);
      return apiClient.put("/users/profile", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("Profil berhasil diperbarui");
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Gagal memperbarui profil"),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const currentAvatar = avatarPreview || profile?.profileImageUrl || user.profileImageUrl;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#242526] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/[0.08]">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Profil</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.07]">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-100 ring-2 ring-indigo-200 dark:ring-indigo-500/30">
                {currentAvatar ? (
                  <SmartImage src={currentAvatar} alt="Avatar" width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white font-bold text-xl">
                    {user.namaLengkap?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => avatarRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white dark:border-[#242526]"
              >
                <Pencil className="w-3 h-3 text-white" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.namaLengkap}</p>
              <button onClick={() => avatarRef.current?.click()} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5">
                Ganti foto profil
              </button>
            </div>
          </div>

          {/* Fields */}
          {[
            { label: "Nama Lengkap", key: "namaLengkap", type: "text", placeholder: "Nama lengkap kamu" },
            { label: "Username", key: "username", type: "text", placeholder: "username_kamu" },
            { label: "Tempat Lahir", key: "tempatKelahiran", type: "text", placeholder: "Jakarta" },
            { label: "Tanggal Lahir", key: "tanggalLahir", type: "date", placeholder: "" },
            { label: "Website (pisahkan dengan koma)", key: "websites", type: "text", placeholder: "https://example.com" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                {label}
              </label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-transparent focus:border-indigo-500 focus:outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
              />
            </div>
          ))}

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Ceritakan sedikit tentang dirimu..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-transparent focus:border-indigo-500 focus:outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none transition-colors"
            />
            <p className="text-xs text-slate-400 text-right mt-1">{form.bio.length}/500</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-white/[0.08] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors">
            Batal
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  const router = useRouter();
  const { user: currentUser, token } = useAuthStore();
  const qc = useQueryClient();
  const coverRef = useRef<HTMLInputElement>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const isOwnProfile = currentUser?.id === user.id;

  const profile = user.profile;
  const profileImageUrl = profile?.profileImageUrl || user.profileImageUrl;
  const backgroundProfileUrl = profile?.backgroundProfileUrl || user.backgroundProfileUrl;

  // ── Relationship ──
  const { data: relationship = { isFollowing: false, isPending: false } } = useQuery({
    queryKey: ["relationship", user.id],
    queryFn: async () => {
      if (!token || isOwnProfile) return { isFollowing: false, isPending: false };
      const res = await apiClient.get(`/users/${user.id}/relationship-status`);
      return res.data;
    },
    enabled: !!token && !isOwnProfile,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const endpoint = relationship.isFollowing
        ? `/users/${user.id}/unfollow`
        : `/users/${user.id}/follow`;
      return (await apiClient.post(endpoint)).data;
    },
    onSuccess: (data) => {
      const next = { isFollowing: data.status === "following", isPending: data.status === "pending" };
      if (next.isFollowing) toast.success(`Mengikuti ${user.namaLengkap}`);
      else if (next.isPending) toast.success("Permintaan dikirim");
      else toast.success(`Berhenti mengikuti ${user.namaLengkap}`);
      qc.setQueryData(["relationship", user.id], next);
      qc.invalidateQueries({ queryKey: ["follow-stats"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Cover upload — browser → Appwrite langsung, lalu kirim URL ke backend ──
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { toast.error("Ukuran file maksimal 10MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("File harus berupa gambar"); return; }

    // Optimistic preview — tampilkan langsung
    const localUrl = URL.createObjectURL(file);
    setCoverPreview(localUrl);
    setCoverUploading(true);

    try {
      // 1. Upload ke Appwrite dari browser (cepat, tidak lewat backend)
      const { fileUrl } = await uploadToAppwrite(file);

      // 2. Simpan URL ke backend
      await apiClient.patch("/users/profile/background-url", { url: fileUrl });

      toast.success("Cover photo diperbarui");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      setCoverPreview(null);
      toast.error(err?.response?.data?.message || "Gagal upload cover, coba lagi");
    } finally {
      setCoverUploading(false);
      URL.revokeObjectURL(localUrl);
      e.target.value = "";
    }
  };

  return (
    <>
      {isEditOpen && <EditProfileModal user={user} onClose={() => setIsEditOpen(false)} />}

      <div className="bg-white dark:bg-[#0F0F10] w-full border-b border-slate-200 dark:border-white/[0.06]">
        {/* Cover */}
        <div className="relative w-full max-w-[1090px] mx-auto h-[200px] sm:h-[300px] md:h-[380px] bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950 dark:to-violet-950 sm:rounded-b-2xl overflow-hidden">
          {(coverPreview || backgroundProfileUrl) && (
            <SmartImage src={coverPreview || backgroundProfileUrl!} alt="Cover" fill className="object-cover" priority />
          )}

          {isOwnProfile && (
            <>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              <button
                onClick={() => coverRef.current?.click()}
                disabled={coverUploading}
                className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 dark:bg-black/60 hover:bg-white dark:hover:bg-black/80 text-slate-800 dark:text-white px-3 py-2 rounded-xl text-sm font-semibold shadow transition-all disabled:opacity-60"
              >
                {coverUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{coverUploading ? "Mengupload..." : "Edit cover"}</span>
              </button>
            </>
          )}
        </div>

        {/* Profile info */}
        <div className="w-full max-w-[1040px] mx-auto px-4 pb-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-10 sm:-mt-16 md:-mt-10 mb-4">

            {/* Avatar + name */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-5 z-10 w-full md:w-auto">
              <div className="relative flex-shrink-0">
                <div className="w-36 h-36 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-[#0F0F10] bg-indigo-100 shadow-md">
                  <SmartImage
                    src={profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.namaLengkap)}&background=6366f1&color=fff`}
                    alt={user.namaLengkap}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="absolute bottom-2 right-2 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0F0F10] shadow transition-colors"
                    title="Edit foto profil"
                  >
                    <Pencil className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>

              <div className="flex flex-col items-center md:items-start text-center md:text-left mb-2 md:mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                  {user.namaLengkap}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  @{profile?.username || user.username}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{stats.followersCount.toLocaleString()}</span> pengikut
                  {" · "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{stats.followingCount.toLocaleString()}</span> mengikuti
                </p>
                {(profile?.bio || user.bio) && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 max-w-sm line-clamp-2">
                    {profile?.bio || user.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:mb-4 z-10 w-full md:w-auto">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-800 dark:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit profil
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (!token) { toast.error("Silakan login"); router.push("/auth/login"); return; }
                      followMutation.mutate();
                    }}
                    disabled={followMutation.isPending}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                      relationship.isFollowing
                        ? "bg-slate-100 dark:bg-white/[0.07] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/[0.12]"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {followMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> :
                      relationship.isFollowing ? <><UserMinus className="w-4 h-4" /> Mengikuti</> :
                      relationship.isPending ? <><Clock3 className="w-4 h-4" /> Diminta</> :
                      <><UserPlus className="w-4 h-4" /> Ikuti</>}
                  </button>
                  <button
                    onClick={() => {
                      if (!token) { toast.error("Silakan login"); router.push("/auth/login"); return; }
                      router.push(`/messages?userId=${user.id}`);
                    }}
                    className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-800 dark:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Pesan
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-white/[0.06] mt-2" />
        </div>
      </div>
    </>
  );
}
