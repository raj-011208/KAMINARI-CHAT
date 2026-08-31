export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  bio: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: number;
  createdAt: number;
  customStatus?: string;
  role?: 'admin' | 'user';
  isBanned?: boolean;
  isMuted?: boolean;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'lightning';
  createdAt: number;
  active: boolean;
  authorName: string;
}

export interface SystemSettings {
  accessPasscode: string;
  adminPassword?: string;
  allowNewRegistrations: boolean;
  maintenanceMode: boolean;
  globalBroadcast?: SystemAnnouncement | null;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file' | 'call';
  mediaName?: string;
  audioDuration?: number; // in seconds
  callDuration?: number; // in seconds for call logs
  createdAt: number;
  readBy: string[]; // user IDs who have seen the message
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  isDeleted?: boolean;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
}

export interface Chat {
  id: string;
  isGroup: boolean;
  name?: string;
  avatar?: string;
  description?: string;
  createdBy?: string;
  participants: string[];
  participantDetails: Record<string, {
    username: string;
    fullName: string;
    avatar: string;
  }>;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: number;
    type?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'call';
  };
  updatedAt: number;
  unreadCount?: Record<string, number>;
  typingUsers?: Record<string, boolean>; // userId -> isTyping
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  userFullName: string;
  userAvatar: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: number;
  expiresAt: number; // 24 hours from creation
  viewers: string[]; // user IDs
  likes: string[]; // user IDs
}

export interface CallSession {
  id: string;
  chatId?: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  isVideo: boolean;
  status: 'calling' | 'incoming' | 'connected' | 'ended' | 'rejected' | 'busy';
  startTime?: number;
  duration?: number;
}
