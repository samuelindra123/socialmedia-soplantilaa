"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import useAuthStore from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import { resolveSocketBaseUrl } from "@/lib/socket-url";

function getWsBaseUrl() {
  return resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL);
}

export function useRealtimeNotifications() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [notifSocket, setNotifSocket] = useState<Socket | null>(null);
  const [msgSocket, setMsgSocket] = useState<Socket | null>(null);
  
  const incrementUnreadMessages = useNotificationStore((s) => s.incrementUnreadMessages);
  const incrementFollowRequests = useNotificationStore((s) => s.incrementFollowRequests);
  const decrementFollowRequests = useNotificationStore((s) => s.decrementFollowRequests);

  useEffect(() => {
    if (!user?.id) return;

    const baseUrl = getWsBaseUrl();

    // Connect to notifications namespace
    const notifSocket = io(`${baseUrl}/notifications`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
    });

    notifSocket.on("connect", () => {
      setNotifSocket(notifSocket);
      console.log("Notifications socket connected");
    });

    notifSocket.on("connect_error", (error) => {
      console.log("Notifications socket error:", error.message);
      // Silently handle errors
    });

    // New follow request
    notifSocket.on("follow:request", () => {
      incrementFollowRequests();
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["follow-requests", "count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    // Follow request accepted
    notifSocket.on("follow:accepted", () => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    // Follow request rejected
    notifSocket.on("follow:rejected", () => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
    });

    // Generic notification
    notifSocket.on("notification", () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    notifSocket.on("disconnect", () => {
      setNotifSocket(null);
      console.log("Notifications socket disconnected");
    });

    // Connect to messages namespace
    const msgBaseUrl = getWsBaseUrl();
    const msgSocket = io(`${msgBaseUrl}/messages`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
    });

    msgSocket.on("connect", () => {
      setMsgSocket(msgSocket);
      console.log("Messages socket connected");
    });

    msgSocket.on("connect_error", (error) => {
      console.log("Messages socket error:", error.message);
      // Silently handle errors
    });

    // New message notification
    msgSocket.on("message:new", () => {
      incrementUnreadMessages();
      queryClient.invalidateQueries({ queryKey: ["messages", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    // Messages read
    msgSocket.on("messages:read", () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    msgSocket.on("disconnect", () => {
      setMsgSocket(null);
      console.log("Messages socket disconnected");
    });

    return () => {
      notifSocket.close();
      msgSocket.close();
      setNotifSocket(null);
      setMsgSocket(null);
    };
  }, [user?.id, queryClient, incrementUnreadMessages, incrementFollowRequests, decrementFollowRequests]);

  return { notifSocket, msgSocket };
}
