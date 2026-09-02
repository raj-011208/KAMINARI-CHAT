import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Mic,
  Smile,
  Trash2,
  Reply,
  Check,
  CheckCheck,
  Zap,
  Shield,
  Search,
  Download,
  X,
  Volume2,
  Image as ImageIcon,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { Chat, Message, User, SystemAnnouncement } from '../types';
import { kaminariBackend } from '../services/kaminariBackend';
import { VoiceRecorder } from './VoiceRecorder';
import { AudioPlayer } from './AudioPlayer';

interface ChatAreaProps {
  chat: Chat;
  currentUser: User;
  allUsers: User[];
  onStartCall: (isVideo: boolean) => void;
  onClearChatHistory: (chatId: string) => void;
  onOpenSidebar?: () => void;
  onBack?: () => void;
}

const EMOJI_REACTIONS = ['⚡', '❤️', '🔥', '😂', '😮', '👏'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  currentUser,
  allUsers,
  onStartCall,
  onClearChatHistory,
  onOpenSidebar,
  onBack,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [deleteConfirmMsgId, setDeleteConfirmMsgId] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [globalBroadcast, setGlobalBroadcast] = useState<SystemAnnouncement | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [inspectUser, setInspectUser] = useState<User | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const otherId = !chat.isGroup
    ? chat.participants.find((p) => p !== currentUser.id)
    : null;
  const otherUser = otherId ? allUsers.find((u) => u.id === otherId) : null;
  const otherDetail = otherId ? chat.participantDetails?.[otherId] : null;

  const chatTitle = chat.isGroup
    ? chat.name
    : otherUser?.fullName || otherDetail?.fullName || 'Operative';
  const chatAvatar = chat.isGroup
    ? chat.avatar || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80'
    : otherUser?.avatar || otherDetail?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80';
  const chatUsername = !chat.isGroup
    ? otherUser?.username || otherDetail?.username || 'operative'
    : '';
  const isPeerOnline = otherUser ? otherUser.status === 'online' : true;

  // Real-time messages & settings listener
  useEffect(() => {
    const unsubscribe = kaminariBackend.subscribe(
      `messages_${chat.id}`,
      (latestMessages: Message[]) => {
        setMessages(latestMessages || []);
        kaminariBackend.markMessagesAsRead(chat.id);
      }
    );

    const unsubSettings = kaminariBackend.subscribe('settings', (s) => {
      setGlobalBroadcast(s?.globalBroadcast || null);
    });

    // Initial fetch
    setMessages(kaminariBackend.getMessages(chat.id));
    kaminariBackend.markMessagesAsRead(chat.id);
    setGlobalBroadcast(kaminariBackend.getSystemSettings().globalBroadcast || null);

    // Typing listener
    const unsubTyping = kaminariBackend.subscribe(`typing_${chat.id}`, (data: any) => {
      if (data?.userId && data.userId !== currentUser.id) {
        if (data.isTyping) {
          setTypingUsers((prev) => Array.from(new Set([...prev, data.userId])));
        } else {
          setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
        }
      }
    });

    return () => {
      unsubscribe();
      unsubSettings();
      unsubTyping();
    };
  }, [chat.id, currentUser.id]);

  // Auto-scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      kaminariBackend.setTyping(chat.id, currentUser.id, true);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      kaminariBackend.setTyping(chat.id, currentUser.id, false);
    }, 1800);
  };

  // Send Text Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || uploadingMedia) return;

    const textToSend = inputText.trim();
    setInputText('');

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setIsTyping(false);
    kaminariBackend.setTyping(chat.id, currentUser.id, false);

    const replyData = replyingTo
      ? {
          id: replyingTo.id,
          text: replyingTo.text || (replyingTo.mediaType ? `[${replyingTo.mediaType.toUpperCase()}]` : ''),
          senderName: replyingTo.senderName,
        }
      : undefined;

    setReplyingTo(null);

    await kaminariBackend.sendMessage({
      chatId: chat.id,
      text: textToSend,
      replyTo: replyData,
    });
  };

  // Handle File Upload (Image / Video)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const isVideo = file.type.startsWith('video/');
      const mediaType = isVideo ? 'video' : 'image';
      const mediaUrl = await kaminariBackend.uploadMedia(file, 'chat_media');

      await kaminariBackend.sendMessage({
        chatId: chat.id,
        text: inputText.trim() || (isVideo ? '🎥 Sent a video' : '📷 Sent an image'),
        mediaUrl,
        mediaType,
        mediaName: file.name,
      });

      setInputText('');
    } catch (err) {
      console.error('Media upload failed', err);
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Voice Audio Message
  const handleVoiceRecorded = async (audioBlob: Blob, durationSec: number) => {
    setIsRecordingVoice(false);
    setUploadingMedia(true);
    try {
      const mediaUrl = await kaminariBackend.uploadMedia(audioBlob, 'voice_notes');
      await kaminariBackend.sendMessage({
        chatId: chat.id,
        text: `🎤 Voice Message (${durationSec}s)`,
        mediaUrl,
        mediaType: 'audio',
        audioDuration: durationSec,
      });
    } catch (err) {
      console.error('Voice send error', err);
    } finally {
      setUploadingMedia(false);
    }
  };

  // Delete Message for Everyone
  const handleDeleteMessage = async (messageId: string) => {
    await kaminariBackend.deleteMessageForEveryone(chat.id, messageId);
    setDeleteConfirmMsgId(null);
  };

  // Reaction Toggle
  const handleReaction = async (messageId: string, emoji: string) => {
    await kaminariBackend.toggleReaction(chat.id, messageId, emoji);
  };

  const formatMessageTime = (time: number) => {
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0d0d12]/95 backdrop-blur-xl">
      {/* Top Chat Header */}
      <div className="h-16 sm:h-20 px-3 sm:px-6 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Back Button (Mobile and Desktop) */}
          {(onBack || onOpenSidebar) && (
            <button
              type="button"
              onClick={() => {
                if (onBack) onBack();
                else if (onOpenSidebar) onOpenSidebar();
              }}
              className="p-2 sm:p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold group shrink-0"
              title="Back to all chats"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-cyan-400" />
              <span className="font-bold text-xs text-cyan-300">Chats</span>
            </button>
          )}

          {/* Participant Avatar & Info (Clickable for Profile Modal) */}
          <div
            onClick={() => {
              if (!chat.isGroup) {
                if (otherUser) {
                  setInspectUser(otherUser);
                } else if (otherDetail && otherId) {
                  setInspectUser({
                    id: otherId,
                    username: otherDetail.username,
                    fullName: otherDetail.fullName,
                    avatar: otherDetail.avatar,
                    email: `${otherDetail.username}@kaminari.net`,
                    bio: 'Hey there! I am using Kaminari Chat.',
                    status: isPeerOnline ? 'online' : 'offline',
                    lastSeen: Date.now(),
                    createdAt: Date.now(),
                    role: 'user',
                  });
                }
                setShowPartnerModal(true);
              }
            }}
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 cursor-pointer group/user p-1 rounded-2xl hover:bg-white/5 transition-colors"
            title="Tap to view user profile"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl p-[2px] bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] shadow-[0_0_15px_rgba(0,243,255,0.4)] group-hover/user:scale-105 transition-transform">
                <img
                  src={chatAvatar}
                  alt={chatTitle}
                  className="w-full h-full rounded-[14px] object-cover border border-[#0d0d12]"
                  referrerPolicy="no-referrer"
                />
              </div>
              {!chat.isGroup && (
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0d12] ${
                    isPeerOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'
                  }`}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 truncate">
                <span className="truncate group-hover/user:text-cyan-300 transition-colors">{chatTitle}</span>
                {!chat.isGroup && chatUsername && (
                  <span className="text-xs text-cyan-400/80 font-normal shrink-0">
                    @{chatUsername}
                  </span>
                )}
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-1 truncate">
                {typingUsers.length > 0 ? (
                  <span className="text-cyan-400 flex items-center gap-1 font-semibold animate-pulse">
                    typing...
                  </span>
                ) : chat.isGroup ? (
                  <span>{chat.participants.length} members</span>
                ) : isPeerOnline ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Online
                  </span>
                ) : (
                  <span>Offline</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls: Audio Call, Video Call, Dropdown Menu */}
        <div className="flex items-center gap-1 sm:gap-2">
          {!chat.isGroup && (
            <>
              <button
                type="button"
                onClick={() => onStartCall(false)}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-cyan-400 border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.15)]"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onStartCall(true)}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-purple-400 border border-white/10 hover:border-purple-400/50 transition-all cursor-pointer shadow-[0_0_15px_rgba(157,0,255,0.15)]"
                title="Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
              className="p-2 sm:p-2.5 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10"
              title="Chat Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showOptionsDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-12 w-56 rounded-2xl bg-[#12121e] border border-white/10 p-1.5 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 backdrop-blur-2xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsDropdown(false);
                      onClearChatHistory(chat.id);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-950/40 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Chat History
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOptionsDropdown(false)}
                    className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    End-to-End Encrypted
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Global Broadcast Announcement Banner (from Admin) */}
      {globalBroadcast && (
        <div
          className={`px-4 py-2.5 flex items-center justify-between border-b z-10 ${
            globalBroadcast.priority === 'urgent'
              ? 'bg-rose-950/70 border-rose-500/40 text-rose-200'
              : globalBroadcast.priority === 'warning'
              ? 'bg-amber-950/70 border-amber-500/40 text-amber-200'
              : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs">
            <Zap
              className={`w-4 h-4 shrink-0 ${
                globalBroadcast.priority === 'urgent'
                  ? 'text-rose-400 animate-bounce'
                  : 'text-cyan-400'
              }`}
            />
            <div>
              <span className="font-bold mr-2">
                [{globalBroadcast.title}]
              </span>
              <span className="opacity-90">{globalBroadcast.content}</span>
            </div>
          </div>
          <span className="text-[11px] opacity-70 ml-2 shrink-0">
            By {globalBroadcast.authorName}
          </span>
        </div>
      )}

      {/* Messages Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
              <Zap className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white">
              No messages yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Send a text message, photo, video, or voice note to start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSelf = msg.senderId === currentUser.id;
            const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`group relative flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                {/* Replying banner if present */}
                {msg.replyTo && (
                  <div
                    className={`text-xs mb-1 px-3 py-1 rounded-t-xl max-w-[85%] sm:max-w-md border-l-2 ${
                      isSelf
                        ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 self-end'
                        : 'bg-[#151522] border-purple-400 text-purple-300 self-start'
                    }`}
                  >
                    <span className="font-semibold">Replying to {msg.replyTo.senderName}:</span>{' '}
                    <span className="truncate inline-block max-w-[200px] align-bottom">
                      {msg.replyTo.text}
                    </span>
                  </div>
                )}

                {/* Main Message Bubble */}
                <div className="relative flex items-start gap-2 max-w-[90%] sm:max-w-lg">
                  {/* Participant avatar if not self */}
                  {!isSelf && (
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      onClick={() => {
                        const found = allUsers.find((u) => u.id === msg.senderId);
                        if (found) {
                          setInspectUser(found);
                        } else {
                          setInspectUser({
                            id: msg.senderId,
                            username: msg.senderName.toLowerCase().replace(/\s+/g, '_'),
                            fullName: msg.senderName,
                            avatar: msg.senderAvatar,
                            email: `${msg.senderName.toLowerCase()}@kaminari.net`,
                            bio: 'Hey there! I am using Kaminari Chat.',
                            status: 'online',
                            lastSeen: Date.now(),
                            createdAt: Date.now(),
                            role: 'user',
                          });
                        }
                        setShowPartnerModal(true);
                      }}
                      className="w-8 h-8 rounded-xl object-cover border border-white/10 mt-1 shrink-0 cursor-pointer hover:border-cyan-400 transition-colors"
                      title={`View ${msg.senderName}'s Profile`}
                      referrerPolicy="no-referrer"
                    />
                  )}

                  <div
                    className={`relative p-3.5 transition-all shadow-md ${
                      isSelf
                        ? 'bg-gradient-to-br from-[#00f3ff] to-[#9d00ff] text-white rounded-t-2xl rounded-bl-2xl shadow-[0_4px_20px_rgba(0,243,255,0.25)]'
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-t-2xl rounded-br-2xl'
                    }`}
                  >
                    {/* Group sender name badge */}
                    {chat.isGroup && !isSelf && (
                      <div className="text-xs font-bold text-cyan-400 mb-1">
                        {msg.senderName}
                      </div>
                    )}

                    {/* Image Attachment */}
                    {msg.mediaType === 'image' && msg.mediaUrl && (
                      <div
                        onClick={() => setLightboxImage(msg.mediaUrl!)}
                        className="mb-2 rounded-2xl overflow-hidden border border-white/20 cursor-pointer max-h-72 group/img relative"
                      >
                        <img
                          src={msg.mediaUrl}
                          alt="Media"
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1.5 rounded-full bg-black/70 text-white text-xs font-semibold">
                            Click to View
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Video Attachment */}
                    {msg.mediaType === 'video' && msg.mediaUrl && (
                      <div className="mb-2 rounded-2xl overflow-hidden border border-purple-500/30 max-h-72">
                        <video
                          src={msg.mediaUrl}
                          controls
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Voice Audio Message */}
                    {msg.mediaType === 'audio' && msg.mediaUrl && (
                      <div className="mb-1">
                        <AudioPlayer
                          src={msg.mediaUrl}
                          duration={msg.audioDuration}
                          isSelf={isSelf}
                        />
                      </div>
                    )}

                    {/* Call Event Notification Card */}
                    {msg.mediaType === 'call' || (msg.text && (msg.text.startsWith('📞') || msg.text.startsWith('📹'))) ? (
                      <div className="flex items-center gap-3 p-1">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                            msg.text?.includes('Video')
                              ? 'bg-purple-950/60 border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(157,0,255,0.25)]'
                              : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.25)]'
                          }`}
                        >
                          {msg.text?.includes('Video') ? (
                            <Video className="w-5 h-5" />
                          ) : (
                            <Phone className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-[130px]">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{msg.text?.includes('Video') ? 'Video Call' : 'Voice Call'}</span>
                          </div>
                          <div className="text-xs text-cyan-300/90 mt-0.5">
                            {msg.text}
                          </div>
                        </div>
                        {!chat.isGroup && (
                          <button
                            type="button"
                            onClick={() => onStartCall(msg.text?.includes('Video') || false)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-all cursor-pointer hover:scale-105 shrink-0"
                          >
                            Call Back
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Text Message */
                      msg.text && (
                        <p className="text-sm font-sans whitespace-pre-wrap break-words leading-relaxed">
                          {msg.text}
                        </p>
                      )
                    )}

                    {/* Footer with Timestamp and Read Receipt */}
                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[11px] opacity-80">
                      <span>{formatMessageTime(msg.createdAt)}</span>
                      {isSelf && (
                        <span>
                          {msg.readBy.length > 1 ? (
                            <CheckCheck className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-white/70" />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Message Action Hover Toolbar */}
                    <div
                      className={`absolute top-2 ${
                        isSelf ? '-left-20' : '-right-20'
                      } hidden group-hover:flex items-center gap-1 p-1 bg-[#10101a] border border-white/10 rounded-xl shadow-lg z-10`}
                    >
                      <button
                        type="button"
                        onClick={() => setReplyingTo(msg)}
                        className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg cursor-pointer"
                        title="Reply"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReaction(msg.id, '❤️')}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg cursor-pointer"
                        title="Love"
                      >
                        ❤️
                      </button>

                      {isSelf && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmMsgId(msg.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg cursor-pointer"
                          title="Delete for Everyone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reactions Pill Display */}
                {hasReactions && (
                  <div
                    className={`flex items-center gap-1 mt-1 ${
                      isSelf ? 'mr-2' : 'ml-10'
                    }`}
                  >
                    {Object.entries(msg.reactions!).map(([emoji, ids]) => {
                      const userIds = (ids || []) as string[];
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border transition-all cursor-pointer ${
                            userIds.includes(currentUser.id)
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="text-xs">{userIds.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Replying Preview Banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-[#141424] border-t border-cyan-500/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-xs text-cyan-300 truncate">
              <Reply className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Replying to {replyingTo.senderName}: </span>
              <span className="text-slate-300 truncate">"{replyingTo.text}"</span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recorder Overlay or Standard Input Bar */}
      <div className="p-3 sm:p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
        {isRecordingVoice ? (
          <VoiceRecorder
            onAudioRecorded={handleVoiceRecorded}
            onCancel={() => setIsRecordingVoice(false)}
          />
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,video/*"
              className="hidden"
            />
            <button
              type="button"
              disabled={uploadingMedia}
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-cyan-300 hover:bg-white/10 border border-white/10 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,243,255,0.05)]"
              title="Attach Photo or Video"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Recording Button */}
            <button
              type="button"
              disabled={uploadingMedia}
              onClick={() => setIsRecordingVoice(true)}
              className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-purple-400 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              title="Record Voice Note"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Text Input Field */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={uploadingMedia ? 'Uploading media...' : 'Type a message...'}
                disabled={uploadingMedia}
                className="w-full px-4 sm:px-5 py-3 rounded-3xl bg-white/5 text-white text-sm placeholder-slate-400 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none transition-all"
              />

              {/* Emoji Trigger */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Reaction Emojis"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Quick Emoji Picker Popover */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute right-0 bottom-14 p-2 bg-[#12121e] border border-white/10 rounded-2xl shadow-2xl flex items-center gap-1.5 z-30 backdrop-blur-xl"
                  >
                    {EMOJI_REACTIONS.map((emo) => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => {
                          setInputText((prev) => prev + emo);
                          setShowEmojiPicker(false);
                        }}
                        className="p-2 hover:bg-white/10 rounded-xl text-lg hover:scale-125 transition-transform cursor-pointer"
                      >
                        {emo}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || uploadingMedia}
              className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black font-bold disabled:opacity-40 disabled:scale-100 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)] cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Lightbox Zoom for Images */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Enlarged media"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl border border-cyan-500/40 shadow-[0_0_60px_rgba(0,243,255,0.3)]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmMsgId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-[#12121c] border border-red-500/40 p-6 shadow-[0_0_40px_rgba(255,0,85,0.3)] text-center">
              <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto mb-3 text-red-400">
                <Trash2 className="w-6 h-6 animate-bounce" />
              </div>
              <h4 className="text-base font-bold text-white">
                Delete message?
              </h4>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                This message will be permanently deleted for everyone in this chat.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmMsgId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(deleteConfirmMsgId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(244,63,94,0.4)] cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showPartnerModal && inspectUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPartnerModal(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-[#12121e]/95 border border-cyan-500/30 p-6 shadow-[0_0_40px_rgba(0,243,255,0.25)] backdrop-blur-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowPartnerModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/10"
                title="Close Profile"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pt-2 pb-4">
                <div className="relative inline-block mb-3">
                  <div className="w-20 h-20 rounded-2xl p-[3px] bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] shadow-[0_0_25px_rgba(0,243,255,0.4)]">
                    <img
                      src={inspectUser.avatar}
                      alt={inspectUser.fullName}
                      className="w-full h-full rounded-[13px] object-cover border-2 border-[#0d0d12]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0d0d12] ${
                      inspectUser.status === 'online'
                        ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'
                        : inspectUser.status === 'away'
                        ? 'bg-amber-400'
                        : 'bg-slate-600'
                    }`}
                  />
                </div>

                <h3 className="text-lg font-bold text-white flex items-center justify-center gap-1.5">
                  <span>{inspectUser.fullName}</span>
                </h3>
                <div className="text-xs text-cyan-400 mt-0.5">
                  @{inspectUser.username}
                </div>

                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300">
                  <span className={`w-2 h-2 rounded-full ${inspectUser.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  {inspectUser.status === 'online' ? 'Online' : 'Offline'}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/10 text-xs">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">
                    About
                  </div>
                  <p className="text-slate-200 bg-white/5 p-3 rounded-2xl border border-white/5 leading-relaxed">
                    {inspectUser.bio || 'Hey there! I am using Kaminari Chat.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Account Type</div>
                    <div className="text-xs font-bold text-purple-300 mt-0.5">
                      {inspectUser.role === 'admin' ? '🛡️ Administrator' : 'Member'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Email</div>
                    <div className="text-xs text-cyan-300 truncate mt-0.5">
                      {inspectUser.email}
                    </div>
                  </div>
                </div>

                {/* Call Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPartnerModal(false);
                      onStartCall(false);
                    }}
                    className="py-2.5 px-3 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Phone className="w-4 h-4" />
                    Voice Call
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPartnerModal(false);
                      onStartCall(true);
                    }}
                    className="py-2.5 px-3 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Video className="w-4 h-4" />
                    Video Call
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
