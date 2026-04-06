"use client";

import { useState, useRef, useCallback } from "react";
import { X, Image as ImageIcon, Video, Upload, Loader2, Plus, Check, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import toast from "react-hot-toast";
import axios from "axios";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: "IMAGE" | "VIDEO";
  uploadStatus: "pending" | "uploading" | "completed" | "error";
  uploadProgress: number;
  uploadedUrl?: string;
}

interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export default function CreateStoryModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateStoryModalProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [uploadStage, setUploadStage] = useState<"idle" | "uploading" | "creating">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      const newMediaFiles: MediaFile[] = [];
      const maxTotal = 10 - mediaFiles.length;
      const filesToProcess = Math.min(selectedFiles.length, maxTotal);

      if (filesToProcess < selectedFiles.length) {
        toast.error(`Maksimal 10 file. Hanya ${filesToProcess} file yang ditambahkan.`);
      }

      for (let i = 0; i < filesToProcess; i++) {
        const selectedFile = selectedFiles[i];
        
        // Validate file type
        const isImage = selectedFile.type.startsWith("image/");
        const isVideo = selectedFile.type.startsWith("video/");

        if (!isImage && !isVideo) {
          toast.error(`File "${selectedFile.name}" bukan gambar atau video`);
          continue;
        }

        // Validate file size (max 100MB for video, 10MB for image)
        const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
          toast.error(
            `File "${selectedFile.name}" terlalu besar. Maksimal ${isVideo ? "100MB" : "10MB"}`
          );
          continue;
        }

        const mediaFile: MediaFile = {
          id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          file: selectedFile,
          preview: URL.createObjectURL(selectedFile),
          type: isVideo ? "VIDEO" : "IMAGE",
          uploadStatus: "pending",
          uploadProgress: 0,
        };

        newMediaFiles.push(mediaFile);
      }

      if (newMediaFiles.length > 0) {
        setMediaFiles((prev) => [...prev, ...newMediaFiles]);
        setCurrentPreviewIndex(mediaFiles.length); // Show the first new file
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [mediaFiles.length]
  );

  const handleRemoveFile = useCallback((id: string) => {
    // Cancel any ongoing upload for this file
    const controller = abortControllersRef.current.get(id);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(id);
    }

    setMediaFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== id);
      const removedIndex = prev.findIndex((f) => f.id === id);
      
      // Revoke object URL
      const removed = prev.find((f) => f.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }

      // Adjust current preview index
      if (newFiles.length === 0) {
        setCurrentPreviewIndex(0);
      } else if (removedIndex <= currentPreviewIndex) {
        setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1));
      }

      return newFiles;
    });
  }, [currentPreviewIndex]);

  // Upload a single file directly to S3 using presigned URL
  const uploadFileToS3 = async (
    file: File,
    uploadUrl: string,
    fileId: string,
  ): Promise<void> => {
    const controller = new AbortController();
    abortControllersRef.current.set(fileId, controller);

    try {
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setMediaFiles((prev) =>
              prev.map((mf) =>
                mf.id === fileId
                  ? { ...mf, uploadProgress: percent }
                  : mf
              )
            );
          }
        },
      });
    } finally {
      abortControllersRef.current.delete(fileId);
    }
  };

  // Fallback: Upload via backend when presigned URL fails (CORS issues)
  // This endpoint already creates the story, so returns true if successful
  const uploadViaBackend = async (
    file: File,
    fileId: string,
    mediaType: "IMAGE" | "VIDEO",
    captionText?: string,
  ): Promise<boolean> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mediaType", mediaType);
    if (captionText) {
      formData.append("caption", captionText);
    }

    await apiClient.post("/stories", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 600000, // 10 minutes
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setMediaFiles((prev) =>
            prev.map((mf) =>
              mf.id === fileId ? { ...mf, uploadProgress: percent } : mf
            )
          );
        }
      },
    });

    return true;
  };

  const handleSubmit = async () => {
    if (mediaFiles.length === 0) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    setIsUploading(true);
    setUploadStage("uploading");

    try {
      // Try presigned URL upload first, fallback to backend if CORS fails
      let useBackendFallback = false;
      let presignedData: { urls: PresignedUrlResponse[] } | null = null;

      try {
        // Step 1: Get presigned URLs for all files
        const filesInfo = mediaFiles.map((mf) => ({
          fileName: mf.file.name,
          contentType: mf.file.type,
        }));

        const response = await apiClient.post<{ urls: PresignedUrlResponse[] }>(
          "/stories/presigned-urls",
          { files: filesInfo }
        );
        presignedData = response.data;

        // Test first file upload to check CORS
        const testFile = mediaFiles[0];
        const testPresigned = presignedData.urls[0];
        
        setMediaFiles((prev) =>
          prev.map((f) =>
            f.id === testFile.id ? { ...f, uploadStatus: "uploading" } : f
          )
        );

        try {
          await uploadFileToS3(testFile.file, testPresigned.uploadUrl, testFile.id);
          
          setMediaFiles((prev) =>
            prev.map((f) =>
              f.id === testFile.id
                ? { ...f, uploadStatus: "completed", uploadedUrl: testPresigned.fileUrl }
                : f
            )
          );
        } catch (corsError: any) {
          // CORS or network error - fallback to backend upload
          console.warn("Presigned URL failed (likely CORS), falling back to backend upload");
          useBackendFallback = true;
          
          // Reset first file status
          setMediaFiles((prev) =>
            prev.map((f) =>
              f.id === testFile.id ? { ...f, uploadStatus: "pending", uploadProgress: 0 } : f
            )
          );
        }
      } catch {
        useBackendFallback = true;
      }

      let successfulUploads: Array<{ fileUrl: string; type: "IMAGE" | "VIDEO" }> = [];
      let backendUploadCount = 0;

      if (useBackendFallback) {
        // Fallback: Upload all files via backend (sequentially to avoid overload)
        // Each call to /stories creates the story directly
        const captionText = caption.trim() || undefined;
        
        for (const mf of mediaFiles) {
          setMediaFiles((prev) =>
            prev.map((f) =>
              f.id === mf.id ? { ...f, uploadStatus: "uploading" } : f
            )
          );

          try {
            await uploadViaBackend(mf.file, mf.id, mf.type, captionText);
            
            setMediaFiles((prev) =>
              prev.map((f) =>
                f.id === mf.id
                  ? { ...f, uploadStatus: "completed" }
                  : f
              )
            );

            backendUploadCount++;
          } catch (error: any) {
            console.error(`Failed to upload ${mf.file.name}:`, error);
            
            setMediaFiles((prev) =>
              prev.map((f) =>
                f.id === mf.id ? { ...f, uploadStatus: "error" } : f
              )
            );
          }
        }
      } else {
        // Presigned URL worked - upload remaining files in parallel
        const firstFile = mediaFiles[0];
        const firstPresigned = presignedData!.urls[0];
        successfulUploads.push({ fileUrl: firstPresigned.fileUrl, type: firstFile.type });

        if (mediaFiles.length > 1) {
          const remainingFiles = mediaFiles.slice(1);
          const remainingPresigned = presignedData!.urls.slice(1);

          const uploadPromises = remainingFiles.map(async (mf, index) => {
            const presigned = remainingPresigned[index];
            
            setMediaFiles((prev) =>
              prev.map((f) =>
                f.id === mf.id ? { ...f, uploadStatus: "uploading" } : f
              )
            );

            try {
              await uploadFileToS3(mf.file, presigned.uploadUrl, mf.id);
              
              setMediaFiles((prev) =>
                prev.map((f) =>
                  f.id === mf.id
                    ? { ...f, uploadStatus: "completed", uploadedUrl: presigned.fileUrl }
                    : f
                )
              );

              return { success: true, fileUrl: presigned.fileUrl, type: mf.type };
            } catch (error: any) {
              if (error.name === "CanceledError" || error.name === "AbortError") {
                throw error;
              }
              
              setMediaFiles((prev) =>
                prev.map((f) =>
                  f.id === mf.id ? { ...f, uploadStatus: "error" } : f
                )
              );

              return { success: false, error };
            }
          });

          const results = await Promise.all(uploadPromises);
          
          for (const result of results) {
            if (result.success) {
              successfulUploads.push({ fileUrl: result.fileUrl!, type: result.type! });
            }
          }
        }
      }

      // Check results
      const totalSuccess = useBackendFallback ? backendUploadCount : successfulUploads.length;
      
      if (totalSuccess === 0) {
        throw new Error("Semua upload gagal");
      }

      const failedCount = mediaFiles.length - totalSuccess;
      if (failedCount > 0) {
        toast.error(`${failedCount} file gagal diupload`);
      }

      // Step 3: Create stories from uploaded URLs (only if using presigned)
      // Backend upload already creates the story, so skip this for fallback
      if (!useBackendFallback) {
        setUploadStage("creating");
        
        const media = successfulUploads.map((r) => ({
          mediaUrl: r.fileUrl,
          mediaType: r.type,
        }));

        await apiClient.post("/stories/from-urls", {
          media,
          caption: caption.trim() || undefined,
        });
      }

      toast.success(`${totalSuccess} story berhasil dibuat!`);
      handleReset();
      onSuccess();
    } catch (error: any) {
      if (error.name === "CanceledError" || error.name === "AbortError") {
        toast.error("Upload dibatalkan");
      } else {
        console.error("Error creating story:", error);
        toast.error(error.response?.data?.message || error.message || "Gagal membuat story");
      }
    } finally {
      setIsUploading(false);
      setUploadStage("idle");
    }
  };

  const handleReset = () => {
    // Cancel all ongoing uploads
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();
    
    // Revoke all object URLs
    mediaFiles.forEach((mf) => {
      URL.revokeObjectURL(mf.preview);
    });
    setMediaFiles([]);
    setCaption("");
    setCurrentPreviewIndex(0);
    setUploadStage("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  const currentMedia = mediaFiles[currentPreviewIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Buat Story {mediaFiles.length > 0 && `(${mediaFiles.length})`}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={mediaFiles.length === 0 || isUploading}
            className="px-4 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadStage === "creating" ? "Menyimpan..." : "Upload..."}</span>
              </>
            ) : (
              "Bagikan"
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {mediaFiles.length === 0 ? (
            // File picker
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-slate-900 dark:text-white font-medium">
                    Pilih foto atau video
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Bisa pilih beberapa file sekaligus (max 10)
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Max 10MB
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Video className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Max 100MB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Preview
            <div className="space-y-4">
              {/* Main Preview */}
              <div className="relative aspect-[9/16] max-h-[40vh] bg-black rounded-xl overflow-hidden mx-auto">
                {currentMedia?.type === "VIDEO" ? (
                  <video
                    key={currentMedia.id}
                    src={currentMedia.preview}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : currentMedia ? (
                  <img
                    key={currentMedia.id}
                    src={currentMedia.preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : null}

                {/* Upload progress overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 p-4">
                    {uploadStage === "creating" ? (
                      <>
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                        <p className="text-white text-center text-sm font-medium">
                          Menyimpan story...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-full max-w-xs space-y-2">
                          {mediaFiles.map((mf, idx) => (
                            <div key={mf.id} className="flex items-center gap-2">
                              <span className="text-white text-xs w-6">{idx + 1}.</span>
                              <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    mf.uploadStatus === "completed"
                                      ? "bg-green-500"
                                      : mf.uploadStatus === "error"
                                      ? "bg-red-500"
                                      : "bg-blue-500"
                                  }`}
                                  style={{ width: `${mf.uploadProgress}%` }}
                                />
                              </div>
                              <div className="w-6">
                                {mf.uploadStatus === "completed" ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : mf.uploadStatus === "error" ? (
                                  <AlertCircle className="w-4 h-4 text-red-400" />
                                ) : mf.uploadStatus === "uploading" ? (
                                  <span className="text-white text-xs">{mf.uploadProgress}%</span>
                                ) : (
                                  <span className="text-white/50 text-xs">-</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-white text-center text-sm font-medium mt-2">
                          Mengupload {mediaFiles.filter(f => f.uploadStatus === "completed").length}/{mediaFiles.length} file
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Thumbnails row */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mediaFiles.map((mf, index) => (
                  <div
                    key={mf.id}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      index === currentPreviewIndex
                        ? "border-blue-500 ring-2 ring-blue-500/30"
                        : mf.uploadStatus === "completed"
                        ? "border-green-500"
                        : mf.uploadStatus === "error"
                        ? "border-red-500"
                        : "border-transparent hover:border-slate-400"
                    }`}
                    onClick={() => setCurrentPreviewIndex(index)}
                  >
                    {mf.type === "VIDEO" ? (
                      <video
                        src={mf.preview}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={mf.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {mf.type === "VIDEO" && (
                      <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded px-1">
                        <Video className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {/* Upload status indicator */}
                    {mf.uploadStatus === "uploading" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      </div>
                    )}
                    {mf.uploadStatus === "completed" && (
                      <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white drop-shadow-lg" />
                      </div>
                    )}
                    {mf.uploadStatus === "error" && (
                      <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-white drop-shadow-lg" />
                      </div>
                    )}
                    {/* Remove button */}
                    {!isUploading && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(mf.id);
                        }}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add more button */}
                {mediaFiles.length < 10 && !isUploading && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-6 h-6 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Caption input */}
              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tambahkan caption... (opsional)"
                  maxLength={200}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-slate-500 text-right mt-1">
                  {caption.length}/200
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
        </div>

        {/* Info */}
        <div className="px-4 pb-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Story akan hilang setelah 24 jam
          </p>
        </div>
      </div>
    </div>
  );
}
