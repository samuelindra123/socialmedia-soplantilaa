"use client";

import { ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import { Notification } from "@/types";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { resolveSocketBaseUrl } from "@/lib/socket-url";

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
    return resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const instance = io(`${baseUrl}/notifications`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
    });

    connectionRef.current = instance;

    let lastErrorLogAt = 0;
    let lastErrorMessage = "";

    instance.on("connect", () => {
      setSocket(instance);
      setIsConnected(true);
    });

    instance.on("disconnect", () => {
      setSocket(null);
      setIsConnected(false);
    });

    instance.on("connect_error", (error) => {
      const now = Date.now();
      const sameMessage = error.message === lastErrorMessage;
      const withinThrottleWindow = now - lastErrorLogAt < 10000;
      if (!sameMessage || !withinThrottleWindow) {
        console.warn("[NotificationsSocket] Connection error", error.message);
        lastErrorLogAt = now;
        lastErrorMessage = error.message;
      }
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
      if (connectionRef.current === instance) {
        connectionRef.current = null;
      }
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
