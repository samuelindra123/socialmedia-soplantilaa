"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useUploadTaskStore } from '@/store/uploadTasks';
import { resolveSocketBaseUrl } from '@/lib/socket-url';

type UploadSocketPayload = {
  taskId: string;
  sessionId?: string;
  status?:
    | 'queued'
    | 'creating-session'
    | 'uploading'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'canceled';
  progress?: number;
  uploadedChunks?: number;
  totalChunks?: number;
  message?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
};

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/verify',
  '/forgot-password',
  '/privacy',
  '/terms',
  '/manifesto',
  '/roadmap',
  '/changelog',
  '/early-access',
  '/pricing',
  '/features',
  '/cookies',
  '/blog',
  '/post',
  '/oauth/callback',
  '/oauth/consent',
];

const PREFIX_ROUTES = ['/blog', '/features', '/pricing', '/post', '/forgot-password'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (PREFIX_ROUTES.includes(route)) {
      return pathname === route || pathname.startsWith(`${route}/`);
    }
    return pathname === route;
  });
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();
  const applyUploadStatus = useUploadTaskStore((state) => state.dismissTask);
  void applyUploadStatus; // unused — kept for socket event compatibility
  const socketEnabled = !isPublicRoute(pathname);

  useEffect(() => {
    if (!socketEnabled) {
      return;
    }

    const socketUrl = resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    let socketInstance: ReturnType<typeof io> | null = null;

    // Small delay to avoid connect/disconnect race on fast navigation
    const connectTimer = setTimeout(() => {
    socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
    });

    let lastErrorLogAt = 0;
    let lastErrorMessage = '';

    socketInstance.on('connect', () => {
      setSocket(socketInstance);
      if (process.env.NODE_ENV === 'development') {
        console.log('[Socket] Connected:', socketInstance!.id);
      }
      setIsConnected(true);

      // Join feed room to receive updates
      socketInstance!.emit('join-feed');

      // If user is logged in, join their personal room
      if (user?.id) {
        socketInstance!.emit('join', { userId: user.id });
      }
    });

    socketInstance.on('disconnect', () => {
      setSocket(null);
      if (process.env.NODE_ENV === 'development') {
        console.log('[Socket] Disconnected');
      }
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      const now = Date.now();
      const sameMessage = error.message === lastErrorMessage;
      const withinThrottleWindow = now - lastErrorLogAt < 10000;
      if (!sameMessage || !withinThrottleWindow) {
        console.warn('[Socket] Connection error:', error.message);
        lastErrorLogAt = now;
        lastErrorMessage = error.message;
      }
    });

    socketInstance.on('reconnect_failed', () => {
      console.warn('[Socket] Failed to reconnect after max attempts');
    });
    }, 300); // delay to avoid race on fast navigation

    return () => {
      clearTimeout(connectTimer);
      if (socketInstance) {
        socketInstance.emit('leave-feed');
        socketInstance.disconnect();
      }
    };
  }, [socketEnabled, user?.id]);

  // Re-join user room when user changes
  useEffect(() => {
    if (socket && isConnected && user?.id) {
      socket.emit('join', { userId: user.id });
    }
  }, [socket, isConnected, user?.id]);

  useEffect(() => {
    if (!isConnected || !socket) return;
    // upload:status socket event removed — no longer needed
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

// Hook for listening to specific socket events
export function useSocketEvent<T>(event: string, callback: (data: T) => void) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handler = (data: T) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Socket] Event '${event}' received:`, data);
      }
      callback(data);
    };

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, callback]);
}
