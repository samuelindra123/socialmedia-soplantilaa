"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  Camera, 
  ArrowRight, 
  Loader2, 
  Check, 
  User, 
  AtSign, 
  AlignLeft,
  Calendar,
  MapPin
} from "lucide-react";
import { uploadFile, apiClient } from "@/lib/api/client";
import useAuthStore from "@/store/auth";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profile?.profileImageUrl || null);
  const [username, setUsername] = useState(user?.profile?.username || "");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [tempatKelahiran, setTempatKelahiran] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validation Helper
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!username.trim()) {
      newErrors.username = "Username wajib diisi";
    }

    if (!tempatKelahiran.trim()) {
      newErrors.tempatKelahiran = "Tempat kelahiran wajib diisi";
    }

    if (!tanggalLahir) {
      newErrors.tanggalLahir = "Tanggal lahir wajib diisi";
    } else {
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!isoDateRegex.test(tanggalLahir)) {
        newErrors.tanggalLahir = "Format tanggal tidak valid";
      } else {
        const birthDate = new Date(tanggalLahir);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 13) {
          newErrors.tanggalLahir = "Umur minimal 13 tahun";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- STEP 1: UPLOAD PHOTO ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran foto maksimal 2MB");
        return;
      }

      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleNextStep = async () => {
    // Jika tidak ada file yang dipilih, langsung ke step 2
    if (!avatarFile) {
      setStep(2);
      return;
    }

    // Jika ada file, upload dulu
    setIsLoading(true);
    try {
      const res = await uploadFile('/onboarding/upload-profile', avatarFile);
      
      updateUser({ 
        profile: { 
          ...user?.profile,
          profileImageUrl: res.data.profileImageUrl 
        } as any
      });
      
      toast.success("Foto profil diperbarui!");
      
      // FIX: Lanjut ke Step 2 setelah sukses upload
      setStep(2);
      
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunggah foto, silakan coba lagi atau lewati.");
      // Jangan setStep(2) jika gagal, biarkan user mencoba lagi atau memilih skip
    } finally {
      setIsLoading(false);
    }
  };

  // --- STEP 2: COMPLETE PROFILE ---
  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Mohon perbaiki error pada form");
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/onboarding/complete', {
        username,
        tanggalLahir: new Date(tanggalLahir).toISOString(),
        tempatKelahiran
      });

      updateUser({ 
        profile: { 
          ...user?.profile,
          username,
          isOnboardingComplete: true 
        } as any
      });
      
      toast.success("Profil selesai! Selamat datang.");
      router.push('/feed'); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan profil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      
      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/50">
        
        {/* --- STEP 1 VIEW --- */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Pasang Foto Terbaikmu</h1>
            <p className="text-slate-500 text-sm text-center mb-8">
              Biarkan orang lain mengenal wajah di balik pemikiran tersebut.
            </p>

            <div className="flex justify-center mb-8">
              <div className="relative group cursor-pointer">
                <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer shadow-md">
                  <Camera className="w-5 h-5" />
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleNextStep}
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {avatarFile ? "Upload & Lanjut" : "Lanjut"} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button 
                onClick={() => setStep(2)} // Tombol skip langsung ke step 2
                disabled={isLoading}
                className="w-full text-slate-500 font-medium text-sm hover:text-slate-900 py-2"
              >
                Lewati dulu
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2 VIEW --- */}
        {step === 2 && (
          <form onSubmit={handleComplete} className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Detail Profil</h1>
            <p className="text-slate-500 text-sm text-center mb-8">
              Lengkapi data diri Anda untuk melanjutkan.
            </p>

            <div className="space-y-4 mb-8">
              
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Username</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <AtSign className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="username_unik"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white outline-none transition-all ${
                      errors.username ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    }`}
                  />
                </div>
                {errors.username && <p className="text-xs text-red-500 mt-1 ml-1">{errors.username}</p>}
              </div>

              {/* Tempat Kelahiran Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tempat Kelahiran</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={tempatKelahiran}
                    onChange={(e) => setTempatKelahiran(e.target.value)}
                    placeholder="Kota kelahiran"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white outline-none transition-all ${
                      errors.tempatKelahiran ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    }`}
                  />
                </div>
                {errors.tempatKelahiran && <p className="text-xs text-red-500 mt-1 ml-1">{errors.tempatKelahiran}</p>}
              </div>

              {/* Tanggal Lahir Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tanggal Lahir</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input 
                    type="date" 
                    required
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white outline-none transition-all ${
                      errors.tanggalLahir ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    }`}
                  />
                </div>
                {errors.tanggalLahir && <p className="text-xs text-red-500 mt-1 ml-1">{errors.tanggalLahir}</p>}
              </div>

            </div>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Kembali
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Selesai <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
