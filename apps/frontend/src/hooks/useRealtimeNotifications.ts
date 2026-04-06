"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import useAuthStore from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getWsBaseUrl() {
  const upgraded =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? RAW_API_URL.replace(/^http:\/\//, "https://")
      : RAW_API_URL;

  return upgraded.replace(/\/api\/?$/, "");
}

export function useRealtimeNotifications() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const notifSocketRef = useRef<Socket | null>(null);
  const msgSocketRef = useRef<Socket | null>(null);
  
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
    });

    notifSocketRef.current = notifSocket;

    notifSocket.on("connect", () => {
      console.log("Notifications socket connected");
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
      console.log("Notifications socket disconnected");
    });

    // Connect to messages namespace
    const msgBaseUrl = getWsBaseUrl();
    const msgSocket = io(`${msgBaseUrl}/messages`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    msgSocketRef.current = msgSocket;

    msgSocket.on("connect", () => {
      console.log("Messages socket connected");
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
      console.log("Messages socket disconnected");
    });

    return () => {
      notifSocket.close();
      msgSocket.close();
      notifSocketRef.current = null;
      msgSocketRef.current = null;
    };
  }, [user?.id, queryClient, incrementUnreadMessages, incrementFollowRequests, decrementFollowRequests]);

  return { notifSocket: notifSocketRef.current, msgSocket: msgSocketRef.current };
}
