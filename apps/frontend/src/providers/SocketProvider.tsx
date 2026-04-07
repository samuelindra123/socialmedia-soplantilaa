"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useUploadTaskStore } from '@/store/uploadTasks';

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
  const applyUploadStatus = useUploadTaskStore((state) => state.applyServerStatus);
  const socketEnabled = !isPublicRoute(pathname);

  useEffect(() => {
    if (!socketEnabled) {
      setIsConnected(false);
      setSocket((prevSocket) => {
        if (prevSocket) {
          prevSocket.emit('leave-feed');
          prevSocket.disconnect();
        }
        return null;
      });
      return;
    }

    const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const baseUrl =
      typeof window !== 'undefined' && window.location.protocol === 'https:'
        ? raw.replace(/^http:\/\//, 'https://')
        : raw;

    const socketUrl = baseUrl.replace('/api', '');

    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id);
      setIsConnected(true);
      
      // Join feed room to receive updates
      socketInstance.emit('join-feed');
      
      // If user is logged in, join their personal room
      if (user?.id) {
        socketInstance.emit('join', { userId: user.id });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.log('[Socket] Connection error:', error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit('leave-feed');
      socketInstance.disconnect();
    };
  }, [socketEnabled, user?.id]);

  // Re-join user room when user changes
  useEffect(() => {
    if (socket && isConnected && user?.id) {
      socket.emit('join', { userId: user.id });
    }
  }, [socket, isConnected, user?.id]);

  useEffect(() => {
    if (!socket) return;

    const onUploadStatus = (payload: UploadSocketPayload) => {
      applyUploadStatus(payload);
    };

    socket.on('upload:status', onUploadStatus);

    return () => {
      socket.off('upload:status', onUploadStatus);
    };
  }, [socket, applyUploadStatus]);

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
      console.log(`[Socket] Event '${event}' received:`, data);
      callback(data);
    };

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, callback]);
}
