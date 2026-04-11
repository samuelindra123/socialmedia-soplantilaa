"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "@/components/ui/SmartImage";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, Info, X, ImageIcon, FileText, Mic, Video, Paperclip, Play, File, Download, Check, CheckCheck, Trash2, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import useAuthStore from "@/store/auth";
import { useThemeStore, resolveEffectiveTheme } from "@/store/theme";
import { useNotificationStore } from "@/store/notifications";
import { io, Socket } from "socket.io-client";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getBrowserApiBase() {
  if (typeof window === 'undefined') return RAW_API_URL;
  return window.location.protocol === 'https:'
    ? RAW_API_URL.replace(/^http:\/\//, 'https://')
    : RAW_API_URL;
}

function getBrowserWsBase() {
  return getBrowserApiBase().replace(/\/api\/?$/, '');
}

interface MessageItem {
  id: string;
  content: string | null;
  createdAt: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  senderId: string;
  mediaUrl?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | null;
  fileName?: string | null;
  isDeleted?: boolean;
  deletedForAll?: boolean;
  sender: {
    id: string;
    namaLengkap: string;
    profile?: {
      username: string;
      profileImageUrl: string | null;
    };
  };
}

interface ConversationData {
  conversation: {
    id: string;
    participants: {
      userId: string;
      namaLengkap: string;
      username: string | null;
      profileImageUrl: string | null;
    }[];
  };
  messages: MessageItem[];
}

async function fetchConversation(conversationId: string): Promise<ConversationData> {
  const response = await apiClient.get<ConversationData>(`/messages/${conversationId}`);
  return response.data;
}

function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${getBrowserApiBase()}${url}`;
}

export default function ChatPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const conversationId = params.conversationId as string;
  const setUnreadMessageCount = useNotificationStore((s) => s.setUnreadMessageCount);
  
  // Theme
  const preference = useThemeStore((s) => s.preference);
  const hasHydrated = useThemeStore((s) => s._hasHydrated);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const effectiveTheme = mounted && hasHydrated ? resolveEffectiveTheme(preference) : 'light';
  const isDark = effectiveTheme === 'dark';

  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversation(conversationId),
    enabled: !!conversationId && !!user?.id,
    refetchInterval: 30000,
  });

  const otherParticipant = data?.conversation?.participants?.find((p) => p.userId !== user?.id);
  const messages = data?.messages || [];

  // Socket connection
  useEffect(() => {
    const wsBase = getBrowserWsBase();
    const newSocket = io(`${wsBase}/messages`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('Messages socket connected');
    });

    newSocket.on('message:new', (payload) => {
      if (payload.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      }
    });

    newSocket.on('messages:read', (payload) => {
      if (payload.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      }
    });

    newSocket.on('message:deleted', (payload) => {
      if (payload.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [conversationId, queryClient]);

  // Update unread count when entering conversation
  useEffect(() => {
    const updateUnreadCount = async () => {
      try {
        const response = await apiClient.get<number>('/messages/unread-count');
        setUnreadMessageCount(response.data);
      } catch (e) {
        // ignore
      }
    };
    updateUnreadCount();
  }, [messages, setUnreadMessageCount]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup file preview
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, file }: { content: string; file?: File }) => {
      if (file) {
        const formData = new FormData();
        formData.append('conversationId', conversationId);
        formData.append('content', content || file.name);
        formData.append('file', file);
        const response = await apiClient.post("/messages/send-with-media", formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      }
      const response = await apiClient.post("/messages/send", {
        conversationId,
        content,
      });
      return response.data;
    },
    onSuccess: () => {
      setMessage("");
      setSelectedFile(null);
      setFilePreview(null);
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => {
      toast.error("Gagal mengirim pesan");
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async ({ messageId, forAll }: { messageId: string; forAll: boolean }) => {
      const response = await apiClient.delete(`/messages/${messageId}?forAll=${forAll}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      setSelectedMessageId(null);
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success(variables.forAll ? "Pesan dihapus untuk semua" : "Pesan dihapus");
    },
    onError: () => {
      toast.error("Gagal menghapus pesan");
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if ((!trimmed && !selectedFile) || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ content: trimmed, file: selectedFile || undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = (messageId: string, forAll: boolean) => {
    deleteMessageMutation.mutate({ messageId, forAll });
  };

  const handleFileSelect = (type: 'image' | 'video' | 'audio' | 'document') => {
    setShowAttachMenu(false);
    if (fileInputRef.current) {
      switch (type) {
        case 'image':
          fileInputRef.current.accept = 'image/*';
          break;
        case 'video':
          fileInputRef.current.accept = 'video/*';
          break;
        case 'audio':
          fileInputRef.current.accept = 'audio/*';
          break;
        case 'document':
          fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';
          break;
      }
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (file.type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (file.type.startsWith('audio/')) return <Mic className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className={isDark ? 'dark' : ''} style={{ colorScheme: effectiveTheme }}>
        <div className="h-screen w-screen bg-white dark:bg-slate-950 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={isDark ? 'dark' : ''} style={{ colorScheme: effectiveTheme }}>
      <div className="h-screen w-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <Link
              href="/messages"
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {/* User info - clickable to show modal */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
          >
            {otherParticipant?.profileImageUrl ? (
              <Image
                src={otherParticipant.profileImageUrl}
                alt={otherParticipant.namaLengkap}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                {otherParticipant?.namaLengkap
                  ?.split(" ")
                  .slice(0, 2)
                  .map((n) => n.charAt(0))
                  .join("")
                  .toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {otherParticipant?.namaLengkap || "Pengguna"}
              </p>
              {otherParticipant?.username && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  @{otherParticipant.username}
                </p>
              )}
            </div>
          </button>

          {/* Info button */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile card at top */}
          {otherParticipant && messages.length === 0 && (
            <div className="flex flex-col items-center py-8 mb-4">
              {otherParticipant.profileImageUrl ? (
                <Image
                  src={otherParticipant.profileImageUrl}
                  alt={otherParticipant.namaLengkap}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-cover mb-3"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-semibold mb-3">
                  {otherParticipant.namaLengkap
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n.charAt(0))
                    .join("")
                    .toUpperCase()}
                </div>
              )}
              <p className="font-bold text-lg text-slate-900 dark:text-white">
                {otherParticipant.namaLengkap}
              </p>
              {otherParticipant.username && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  @{otherParticipant.username}
                </p>
              )}
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                Mulai percakapan dengan {otherParticipant.namaLengkap.split(" ")[0]}
              </p>
            </div>
          )}

          {/* Message list */}
          <div className="space-y-3">
            {messages.map((msg, index) => {
              const isMe = msg.senderId === user?.id;
              const showDate = index === 0 || 
                new Date(msg.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();
              const isMessageDeleted = msg.isDeleted || msg.deletedForAll;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {new Date(msg.createdAt).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                    {/* Delete menu for my messages */}
                    {isMe && !isMessageDeleted && (
                      <div className="relative flex items-center mr-2">
                        <button
                          onClick={() => setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)}
                          className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </button>
                        {selectedMessageId === msg.id && (
                          <div className="absolute right-8 top-0 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[160px] z-10">
                            <button
                              onClick={() => handleDeleteMessage(msg.id, false)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                            >
                              <Trash2 className="h-4 w-4 text-slate-500" />
                              <span>Hapus untuk saya</span>
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id, true)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Hapus untuk semua</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[75%] rounded-2xl overflow-hidden ${
                        isMe
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md"
                      } ${isMessageDeleted ? 'opacity-60 italic' : ''}`}
                    >
                      {/* Deleted message */}
                      {isMessageDeleted ? (
                        <div className="px-4 py-2">
                          <p className="text-sm">🚫 Pesan telah dihapus</p>
                        </div>
                      ) : (
                        <>
                          {/* Media content */}
                          {msg.mediaUrl && msg.mediaType === 'IMAGE' && (
                            <div className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getMediaUrl(msg.mediaUrl)}
                                alt="Image"
                                className="w-full max-w-[300px] object-cover cursor-pointer"
                                onClick={() => window.open(getMediaUrl(msg.mediaUrl), '_blank')}
                              />
                            </div>
                          )}
                          {msg.mediaUrl && msg.mediaType === 'VIDEO' && (
                            <video
                              src={getMediaUrl(msg.mediaUrl)}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full max-w-[300px]"
                            />
                          )}
                          {msg.mediaUrl && msg.mediaType === 'AUDIO' && (
                            <div className="p-3">
                              <audio 
                                src={getMediaUrl(msg.mediaUrl)} 
                                controls 
                                className="w-full min-w-[200px]" 
                              />
                            </div>
                          )}
                          {msg.mediaUrl && msg.mediaType === 'DOCUMENT' && (
                            <a
                              href={getMediaUrl(msg.mediaUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={msg.fileName}
                              className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'text-white hover:bg-blue-600' : 'text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            >
                              <div className={`p-2 rounded-lg ${isMe ? 'bg-blue-400' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <File className="h-6 w-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{msg.fileName || 'Document'}</p>
                                <p className={`text-xs ${isMe ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>Klik untuk download</p>
                              </div>
                              <Download className="h-5 w-5 flex-shrink-0" />
                            </a>
                          )}
                          {/* Text content */}
                          {msg.content && (
                            <div className="px-4 py-2">
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                          )}
                        </>
                      )}
                      {/* Time and status */}
                      <div className={`flex items-center justify-end gap-1 px-4 pb-2 ${isMe ? "text-blue-200" : "text-slate-400 dark:text-slate-500"}`}>
                        <span className="text-[10px]">
                          {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {/* Status checkmarks - only for my messages */}
                        {isMe && !isMessageDeleted && (
                          <span className="flex items-center">
                            {msg.status === 'SENT' && (
                              <Check className="h-3 w-3" />
                            )}
                            {msg.status === 'DELIVERED' && (
                              <CheckCheck className="h-3 w-3" />
                            )}
                            {msg.status === 'READ' && (
                              <CheckCheck className="h-3 w-3 text-blue-300" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 px-4 py-2 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            {filePreview && selectedFile.type.startsWith('image/') ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={filePreview} alt="Preview" className="h-12 w-12 object-cover rounded-lg" />
            ) : filePreview && selectedFile.type.startsWith('video/') ? (
              <div className="relative h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <Play className="h-6 w-6 text-slate-500" />
              </div>
            ) : (
              <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                {getFileIcon(selectedFile)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={clearSelectedFile}
              className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-3 safe-area-bottom">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          {/* Attachment button */}
          <div className="relative">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            
            {/* Attachment menu */}
            {showAttachMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 min-w-[160px]">
                <button
                  onClick={() => handleFileSelect('image')}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <ImageIcon className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Foto</span>
                </button>
                <button
                  onClick={() => handleFileSelect('video')}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <Video className="h-5 w-5 text-purple-500" />
                  <span className="text-sm">Video</span>
                </button>
                <button
                  onClick={() => handleFileSelect('audio')}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <Mic className="h-5 w-5 text-orange-500" />
                  <span className="text-sm">Audio</span>
                </button>
                <button
                  onClick={() => handleFileSelect('document')}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">Dokumen</span>
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <input
            ref={inputRef}
            type="text"
            placeholder="Tulis pesan..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={(!message.trim() && !selectedFile) || sendMessageMutation.isPending}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && otherParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInfoModal(false)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white">Info Kontak</h2>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                {otherParticipant.profileImageUrl ? (
                  <Image
                    src={otherParticipant.profileImageUrl}
                    alt={otherParticipant.namaLengkap}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-full object-cover mb-3"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-semibold mb-3">
                    {otherParticipant.namaLengkap
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n.charAt(0))
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {otherParticipant.namaLengkap}
                </h3>
                {otherParticipant.username && (
                  <p className="text-slate-500 dark:text-slate-400">@{otherParticipant.username}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap</p>
                  <p className="text-slate-900 dark:text-white font-medium">{otherParticipant.namaLengkap}</p>
                </div>
                {otherParticipant.username && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Username</p>
                    <p className="text-slate-900 dark:text-white font-medium">@{otherParticipant.username}</p>
                  </div>
                )}
              </div>

              <Link
                href={`/profile/${otherParticipant.username || otherParticipant.userId}`}
                className="mt-6 block w-full text-center py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                onClick={() => setShowInfoModal(false)}
              >
                Lihat Profil Lengkap
              </Link>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
