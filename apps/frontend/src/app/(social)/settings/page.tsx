"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import SocialThemeWrapper from "@/components/SocialThemeWrapper";
import SocialShell from "@/components/layouts/SocialShell";
import { apiClient } from "@/lib/api/client";
import { Loader2, Camera, Save, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";

// Schema validasi
const updateProfileSchema = z.object({
  namaLengkap: z.string().min(1, "Nama lengkap wajib diisi"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  bio: z.string().max(500, "Bio maksimal 500 karakter").optional().or(z.literal("")),
  tempatKelahiran: z.string().max(50, "Lokasi maksimal 50 karakter").optional().or(z.literal("")),
  website1: z.string().optional().or(z.literal("")),
  website2: z.string().optional().or(z.literal("")),
  website3: z.string().optional().or(z.literal("")),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewBackground, setPreviewBackground] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  // Fetch current profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const res = await apiClient.get("/users/profile");
      return res.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      namaLengkap: "",
      username: "",
      bio: "",
      tempatKelahiran: "",
      website1: "",
      website2: "",
      website3: "",
    },
    values: profile ? {
      namaLengkap: profile.namaLengkap,
      username: profile.profile?.username,
      bio: profile.profile?.bio || "",
      tempatKelahiran: profile.profile?.tempatKelahiran || "",
      website1: profile.profile?.websites?.[0] || "",
      website2: profile.profile?.websites?.[1] || "",
      website3: profile.profile?.websites?.[2] || "",
    } : undefined,
  });

  // Mutation for updating profile
  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiClient.put("/users/profile", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profil berhasil diperbarui");
      router.push(`/profile/${profile.profile.username}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui profil");
    },
  });

  // Mutation untuk upload background
  const backgroundMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("backgroundFile", file);
      return apiClient.put("/users/profile/background", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Background profil berhasil diperbarui");
      setPreviewBackground(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengupload background");
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewBackground(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload langsung
      backgroundMutation.mutate(file);
    }
  };

  const onSubmit = (data: UpdateProfileForm) => {
    const file = fileInputRef.current?.files?.[0];
    
    // Build websites array from website1, website2, website3
    const websites = [data.website1, data.website2, data.website3]
      .filter((w): w is string => Boolean(w?.trim()))
      .slice(0, 3);

    const formData = new FormData();
    formData.append("namaLengkap", data.namaLengkap || "");
    formData.append("username", data.username || "");
    if (data.bio) formData.append("bio", data.bio);
    if (data.tempatKelahiran) formData.append("tempatKelahiran", data.tempatKelahiran);
    
    // Send websites as JSON string to handle array in FormData
    if (websites.length > 0) {
      formData.append("websites", JSON.stringify(websites));
    }
    
    if (file) formData.append("profileImage", file);

    updateMutation.mutate(formData as any);
  };

  if (isLoading) {
    return (
      <SocialThemeWrapper className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </SocialThemeWrapper>
    );
  }

  return (
    <SocialShell
      mobileTitle="Pengaturan"
      mobileDescription="Perbarui profil dan preferensi"
      contentClassName="px-0 sm:px-4 md:px-6"
    >
      <div className="w-full max-w-3xl mx-auto py-8">
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Profil</h1>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Background Cover Section */}
              <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 group cursor-pointer overflow-hidden" onClick={() => backgroundInputRef.current?.click()}>
                {(previewBackground || profile?.profile?.backgroundProfileUrl) && (
                  <Image
                    src={previewBackground || profile?.profile?.backgroundProfileUrl || ""}
                    alt="Background"
                    fill
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <div className="bg-black/70 p-3 rounded-full text-white">
                    <Camera className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <input
                type="file"
                ref={backgroundInputRef}
                onChange={handleBackgroundChange}
                accept="image/*"
                className="hidden"
              />

              <div className="p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Profile Image Section */}
                  <div className="flex flex-col items-center gap-4 -mt-20 relative z-10">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 ring-2 ring-slate-200 dark:ring-slate-600 shadow-md">
                        <Image
                          src={previewImage || profile?.profile?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.namaLengkap)}&background=random`}
                          alt="Profile"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/50 p-2 rounded-full text-white">
                          <Camera className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Klik gambar untuk mengubah</p>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-6 pt-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">Nama Lengkap</label>
                        <input
                          {...register("namaLengkap")}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all"
                          placeholder="Nama Lengkap"
                        />
                        {errors.namaLengkap && (
                          <p className="text-xs text-red-500">{errors.namaLengkap.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">Username</label>
                        <input
                          {...register("username")}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all"
                          placeholder="username"
                        />
                        {errors.username && (
                          <p className="text-xs text-red-500">{errors.username.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-900 dark:text-white">Bio</label>
                      <textarea
                        {...register("bio")}
                        rows={3}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all resize-none"
                        placeholder="Ceritakan sedikit tentang dirimu..."
                      />
                      {errors.bio && (
                        <p className="text-xs text-red-500">{errors.bio.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-900 dark:text-white">Lokasi</label>
                      <input
                        {...register("tempatKelahiran")}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all"
                        placeholder="Jakarta, Indonesia"
                      />
                      {errors.tempatKelahiran && (
                        <p className="text-xs text-red-500">{errors.tempatKelahiran.message}</p>
                      )}
                    </div>

                    {/* Websites Section */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-900 dark:text-white">Websites (Maksimal 3)</label>
                      <div className="space-y-2">
                        <input
                          {...register("website1")}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all"
                          placeholder="Website 1 (opsional)"
                        />
                        <input
                          {...register("website2")}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all"
                          placeholder="Website 2 (opsional)"
                        />
                        <input
                          {...register("website3")}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all"
                          placeholder="Website 3 (opsional)"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
        </div>
      </div>
    </SocialShell>
  );
}
