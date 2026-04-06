"use client";

import { ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import { Notification } from "@/types";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface NotificationsSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const NotificationsSocketContext = createContext<NotificationsSocketContextValue>({
  socket: null,
  isConnected: false,
});

export function NotificationsSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const incrementUnreadMessages = useNotificationStore((state) => state.incrementUnreadMessages);
  const resetUnreadMessages = useNotificationStore((state) => state.resetUnreadMessages);
  const connectionRef = useRef<Socket | null>(null);

  const baseUrl = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const normalized =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? raw.replace(/^http:\/\//, "https://")
        : raw;
    return normalized.replace(/\/?api$/, "");
  }, []);

  useEffect(() => {
    if (!user?.id) {
      connectionRef.current?.disconnect();
      connectionRef.current = null;
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const instance = io(`${baseUrl}/notifications`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
    });

    connectionRef.current = instance;
    setSocket(instance);

    instance.on("connect", () => {
      setIsConnected(true);
    });

    instance.on("disconnect", () => {
      setIsConnected(false);
    });

    instance.on("connect_error", (error) => {
      console.warn("[NotificationsSocket] Connection error", error.message);
    });

    instance.on("notification", (payload: Notification) => {
      addNotification(payload);

      if (payload.type === "FOLLOW_REQUEST") {
        queryClient.invalidateQueries({ queryKey: ["follow-requests"] }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["follow-requests", "sidebar"] }).catch(() => {});
      }

      if (payload.type === "MESSAGE") {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/chat")) {
          incrementUnreadMessages();
          toast("Pesan baru dari " + (payload.actor?.namaLengkap ?? "pengguna"));
        }
        queryClient.invalidateQueries({ queryKey: ["message-notifications"] }).catch(() => {});
      }
    });

    return () => {
      instance.disconnect();
      setSocket(null);
      setIsConnected(false);
      connectionRef.current = null;
    };
  }, [addNotification, baseUrl, incrementUnreadMessages, queryClient, user?.id]);

  useEffect(() => {
    if (pathname.startsWith("/chat")) {
      resetUnreadMessages();
    }
  }, [pathname, resetUnreadMessages]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
    }),
    [socket, isConnected],
  );

  return (
    <NotificationsSocketContext.Provider value={value}>
      {children}
    </NotificationsSocketContext.Provider>
  );
}

export function useNotificationsSocket() {
  return useContext(NotificationsSocketContext);
}
