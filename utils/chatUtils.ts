import { io } from 'socket.io-client';
import api, { API_BASE_URL } from './api';

export interface ChatMessage {
    _id: string;
    text: string;
    createdAt: any;
    user: {
        _id: string;
        name: string;
        avatar?: string;
    };
    sent: boolean;
    received: boolean;
    read?: boolean;
}

// Ensure socket connects to the same base URL as API
const socketUrl = API_BASE_URL.replace('/api', '');

const socket = io(socketUrl, {
    autoConnect: true,
    transports: ['websocket'],
});

export const sendMessage = async (conversationId: string, text: string, user: { _id: string, name: string }, staffId?: string) => {
    try {
        await api.post(`/chats/${conversationId}/messages`, { text, staffId });
    } catch (error) {
        console.error("Error sending message:", error);
    }
};

export const emitTyping = (conversationId: string, user: { _id: string, name: string }) => {
    socket.emit('typing', { conversationId, user });
};

export const emitStopTyping = (conversationId: string) => {
    socket.emit('stopTyping', { conversationId });
};

export const subscribeToMessages = (
    conversationId: string,
    callback: (messages: ChatMessage[], partnerStatus?: { online: boolean, lastSeen: string | null }, partnerDetails?: any, realConvId?: string) => void,
    onNewMessage?: (msg: ChatMessage) => void,
    onTypingStatus?: (isTyping: boolean, user?: any) => void,
    staffId?: string
) => {
    let currentMessages: ChatMessage[] = [];
    let cleanupEvents: (() => void) | null = null;

    const handleEvents = (convId: string) => {
        socket.emit('joinChat', convId);

        const handleNewMessage = (newMsg: any) => {
            const msg: ChatMessage = {
                ...newMsg,
                createdAt: new Date(newMsg.createdAt),
                sent: true,
                received: true,
                read: false
            };

            if (!currentMessages.some((m) => m._id === msg._id)) {
                currentMessages = [msg, ...currentMessages];
                if (onNewMessage) onNewMessage(msg);
                else callback(currentMessages);
            }
        };

        const handleTyping = ({ user }: { user: any }) => {
            if (onTypingStatus) onTypingStatus(true, user);
        };

        const handleStopTyping = () => {
            if (onTypingStatus) onTypingStatus(false);
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('typing', handleTyping);
        socket.on('stopTyping', handleStopTyping);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('typing', handleTyping);
            socket.off('stopTyping', handleStopTyping);
        };
    };

    const fetchInitial = async () => {
        try {
            const response = await api.get(`/chats/${conversationId}/messages`, {
                params: { staffId }
            });
            let messagesData = [];
            let statusData = { online: false, lastSeen: null };
            let detailsData = null;
            let realConvId = conversationId;

            if (response.data.messages) {
                messagesData = response.data.messages;
                statusData = response.data.partnerStatus;
                detailsData = response.data.partnerDetails;
                realConvId = response.data.conversationId?.toString() || conversationId;
            } else if (Array.isArray(response.data)) {
                messagesData = response.data;
            }

            currentMessages = messagesData.map((msg: any) => ({
                ...msg,
                createdAt: new Date(msg.createdAt),
            }));

            callback(currentMessages, statusData, detailsData, realConvId);
            cleanupEvents = handleEvents(realConvId);
        } catch (error) {
            console.error("Error fetching initial messages:", error);
        }
    };

    fetchInitial();

    return () => {
        if (cleanupEvents) cleanupEvents();
    };
};

export const subscribeToChatList = (callback: () => void, staffUserId?: string) => {
    socket.emit('joinAdminChatList');
    // Also join staff-specific room for 1-on-1 DM updates
    if (staffUserId) {
        socket.emit('joinStaffChatList', staffUserId);
    }
    socket.on('updateChatList', callback);
    return () => {
        socket.off('updateChatList', callback);
    };
};


