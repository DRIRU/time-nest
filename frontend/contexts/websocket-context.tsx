/**
 * WebSocket context for real-time chat functionality
 */

"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";

interface WebSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    joinConversation: (conversationId: number) => void;
    leaveConversation: (conversationId: number) => void;
    sendTypingStart: (conversationId: number) => void;
    sendTypingStop: (conversationId: number) => void;
    onNewMessage: (callback: (message: any) => void) => void;
    onTypingStart: (callback: (data: any) => void) => void;
    onTypingStop: (callback: (data: any) => void) => void;
    onUserStatus: (callback: (data: any) => void) => void;
    removeAllListeners: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
    undefined
);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }
    return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { currentUser, isLoggedIn } = useAuth();

    useEffect(() => {
        if (isLoggedIn && currentUser?.accessToken) {
            // Initialize socket connection
            const newSocket = io("http://localhost:8000", {
                auth: {
                    token: currentUser.accessToken,
                },
                transports: ["websocket", "polling"],
                upgrade: true,
                rememberUpgrade: true,
            });

            newSocket.on("connect", () => {
                console.log("✅ Connected to WebSocket server");
                console.log("Socket ID:", newSocket.id);
                setIsConnected(true);
            });

            newSocket.on("disconnect", (reason) => {
                console.log(
                    "❌ Disconnected from WebSocket server. Reason:",
                    reason
                );
                setIsConnected(false);
            });

            newSocket.on("connect_error", (error: any) => {
                console.error("❌ WebSocket connection error:", error);
                console.error("Error type:", error.type);
                console.error("Error description:", error.description);
                setIsConnected(false);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
                setSocket(null);
                setIsConnected(false);
            };
        } else {
            // Clean up connection if user logs out
            if (socket) {
                socket.close();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [isLoggedIn, currentUser]);

    const joinConversation = useCallback(
        (conversationId: number) => {
            if (socket) {
                socket.emit("join_conversation", {
                    conversation_id: conversationId,
                });
            }
        },
        [socket]
    );

    const leaveConversation = useCallback(
        (conversationId: number) => {
            if (socket) {
                socket.emit("leave_conversation", {
                    conversation_id: conversationId,
                });
            }
        },
        [socket]
    );

    const sendTypingStart = useCallback(
        (conversationId: number) => {
            if (socket) {
                socket.emit("typing_start", {
                    conversation_id: conversationId,
                });
            }
        },
        [socket]
    );

    const sendTypingStop = useCallback(
        (conversationId: number) => {
            if (socket) {
                socket.emit("typing_stop", { conversation_id: conversationId });
            }
        },
        [socket]
    );

    const onNewMessage = useCallback(
        (callback: (message: any) => void) => {
            if (socket) {
                socket.on("new_message", callback);
            }
        },
        [socket]
    );

    const onTypingStart = useCallback(
        (callback: (data: any) => void) => {
            if (socket) {
                socket.on("typing_start", callback);
            }
        },
        [socket]
    );

    const onTypingStop = useCallback(
        (callback: (data: any) => void) => {
            if (socket) {
                socket.on("typing_stop", callback);
            }
        },
        [socket]
    );

    const onUserStatus = useCallback(
        (callback: (data: any) => void) => {
            if (socket) {
                socket.on("user_status", callback);
            }
        },
        [socket]
    );

    const removeAllListeners = useCallback(() => {
        if (socket) {
            socket.removeAllListeners("new_message");
            socket.removeAllListeners("typing_start");
            socket.removeAllListeners("typing_stop");
            socket.removeAllListeners("user_status");
        }
    }, [socket]);

    const value = {
        socket,
        isConnected,
        joinConversation,
        leaveConversation,
        sendTypingStart,
        sendTypingStop,
        onNewMessage,
        onTypingStart,
        onTypingStop,
        onUserStatus,
        removeAllListeners,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
