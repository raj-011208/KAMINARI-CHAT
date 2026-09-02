import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Zap, Shield, Sparkles, MessageSquare, Radio, Phone, Video, Download } from 'lucide-react';
import { LightningCanvas3D } from './components/LightningCanvas3D';
import { AccessGate } from './components/AccessGate';
import { AuthPortal } from './components/AuthPortal';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { StoriesModal } from './components/StoriesModal';
import { CreateStoryModal } from './components/CreateStoryModal';
import { CallScreen } from './components/CallScreen';
import { NewChatModal } from './components/NewChatModal';
import { ClearChatConfirmModal } from './components/ClearChatConfirmModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { kaminariBackend } from './services/kaminariBackend';
import { User, Chat, Story, CallSession } from './types';

export default function App() {
  const [accessGranted, setAccessGranted] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Modal states
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [clearChatTargetId, setClearChatTargetId] = useState<string | null>(null);
  const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Initialize Access Gate & Auth
  useEffect(() => {
    const isPassed = kaminariBackend.isAccessGatePassed();
    setAccessGranted(isPassed);

    const user = kaminariBackend.getCurrentUser();
    setCurrentUser(user);

    // Subscribe to reactive backend updates
    const unsubAuth = kaminariBackend.subscribe('auth', (u: User | null) => {
      setCurrentUser(u);
    });

    const unsubAccess = kaminariBackend.subscribe('access', (granted: boolean) => {
      setAccessGranted(granted);
    });

    const unsubUsers = kaminariBackend.subscribe('users', (usersList: User[]) => {
      setAllUsers(usersList || []);
    });

    const unsubChats = kaminariBackend.subscribe('chats', (chatsList: Chat[]) => {
      setChats(chatsList || []);
      // Auto-select first chat if none selected ONLY on desktop screens
      if (window.innerWidth >= 1024 && chatsList?.length > 0 && !activeChatId) {
        setActiveChatId((prev) => prev || chatsList[0].id);
      }
    });

    const unsubStories = kaminariBackend.subscribe('stories', (storiesList: Story[]) => {
      setStories(storiesList || []);
    });

    return () => {
      unsubAuth();
      unsubAccess();
      unsubUsers();
      unsubChats();
      unsubStories();
    };
  }, []);

  // Handlers
  const handleAccessGranted = () => {
    kaminariBackend.verifyAccessCode('kaminari69');
    setAccessGranted(true);
  };

  const handleLockGate = () => {
    kaminariBackend.revokeAccessGate();
    setAccessGranted(false);
  };

  const handleLogout = async () => {
    await kaminariBackend.logout();
    setCurrentUser(null);
  };

  const handleStartCall = async (isVideo: boolean) => {
    if (!currentUser || !activeChat) return;
    const otherId = activeChat.participants.find((p) => p !== currentUser.id);
    if (!otherId) return;

    const otherDetail = activeChat.participantDetails[otherId];
    const otherUser = allUsers.find((u) => u.id === otherId);

    // Send calling notification message in chatbox
    const callType = isVideo ? 'Video Call' : 'Voice Call';
    const icon = isVideo ? '📹' : '📞';

    await kaminariBackend.sendMessage({
      chatId: activeChat.id,
      text: `${icon} ${callType} Started`,
      mediaType: 'call',
    });

    const session: CallSession = {
      id: `call_${Date.now()}`,
      chatId: activeChat.id,
      callerId: currentUser.id,
      callerName: currentUser.fullName,
      callerAvatar: currentUser.avatar,
      receiverId: otherId,
      receiverName: otherDetail?.fullName || otherUser?.fullName || 'Operative',
      receiverAvatar: otherDetail?.avatar || otherUser?.avatar || '',
      isVideo,
      status: 'calling',
      startTime: Date.now(),
    };

    setActiveCallSession(session);
  };

  const handleEndCall = async (durationSec?: number) => {
    if (activeCallSession && currentUser) {
      const isVideo = activeCallSession.isVideo;
      const callType = isVideo ? 'Video Call' : 'Voice Call';
      const icon = isVideo ? '📹' : '📞';

      const formatDuration = (sec: number) => {
        const mins = Math.floor(sec / 60);
        const remaining = sec % 60;
        return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
      };

      const durationText = durationSec && durationSec > 0 ? ` (${formatDuration(durationSec)})` : '';

      await kaminariBackend.sendMessage({
        chatId: activeCallSession.chatId,
        text: `${icon} ${callType} Ended${durationText}`,
        mediaType: 'call',
        callDuration: durationSec,
      });
    }

    setActiveCallSession(null);
  };

  const handleClearHistory = async (chatId: string) => {
    await kaminariBackend.clearAllChatHistory(chatId);
    setClearChatTargetId(null);
  };

  const handleSelectUser = async (userId: string) => {
    if (!currentUser) return;
    try {
      const directChat = await kaminariBackend.createDirectChat(userId);
      setActiveChatId(directChat.id);
      setMobileSidebarOpen(false);
    } catch (err) {
      console.error('Select user chat error:', err);
    }
  };

  const handleStoryReply = async (recipientId: string, replyText: string) => {
    if (!currentUser) return;
    const directChat = await kaminariBackend.createDirectChat(recipientId);
    setActiveChatId(directChat.id);
    await kaminariBackend.sendMessage({
      chatId: directChat.id,
      text: replyText,
    });
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <BrowserRouter>
      <div className="relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#0d0d12] text-slate-100 flex flex-col font-sans">
        {/* Background 3D Lightning Canvas with interactive particle cloud */}
        <LightningCanvas3D intensity={1.0} interactive={true} />

        {/* Global Grid scanline & radial overlay for cyberpunk atmosphere */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0d0d12]/60 to-[#0d0d12]/95 pointer-events-none z-1" />

        {/* Main Content Router / State Machine */}
        <div className="relative z-10 w-full h-full flex flex-col min-h-0">
          <div className="flex-1 min-h-0 w-full flex flex-col">
            {!accessGranted ? (
              /* STATE 1: ACCESS PASSCODE GATE */
              <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
                <AccessGate onAccessGranted={handleAccessGranted} />
              </div>
            ) : !currentUser ? (
              /* STATE 2: USER REGISTRATION / LOGIN PORTAL */
              <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
                <AuthPortal
                  onSuccess={(u) => setCurrentUser(u)}
                  onLockGate={handleLockGate}
                />
              </div>
            ) : (
              /* STATE 3: MAIN CHAT & STORIES APPLICATION WORKSPACE */
              <div className="w-full h-full flex overflow-hidden">
                {/* Sidebar: On mobile, visible when no active chat is open; on desktop, always docked on left */}
                <div
                  className={`${
                    activeChatId ? 'hidden lg:flex' : 'flex'
                  } w-full lg:w-80 xl:w-96 h-full flex-col shrink-0 lg:border-r lg:border-white/5 z-20`}
                >
                  <Sidebar
                    currentUser={currentUser}
                    chats={chats}
                    allUsers={allUsers}
                    stories={stories}
                    activeChatId={activeChatId}
                    onSelectChat={(id) => {
                      setActiveChatId(id);
                      setMobileSidebarOpen(false);
                    }}
                    onSelectUser={handleSelectUser}
                    onOpenNewChat={() => setShowNewChatModal(true)}
                    onOpenStory={(idx) => setActiveStoryIndex(idx)}
                    onOpenCreateStory={() => setShowCreateStoryModal(true)}
                    onOpenProfile={() => setShowProfileModal(true)}
                    onOpenAdmin={() => setShowAdminModal(true)}
                    onOpenInstallApp={() => setShowInstallModal(true)}
                    onLogout={handleLogout}
                    onLockGate={handleLockGate}
                  />
                </div>

                {/* Main Chat View: On mobile, visible when activeChatId is set; on desktop, fills remaining width */}
                <div
                  className={`${
                    activeChatId ? 'flex' : 'hidden lg:flex'
                  } flex-1 h-full flex flex-col min-w-0`}
                >
                  {activeChat ? (
                    <ChatArea
                      key={activeChat.id}
                      chat={activeChat}
                      currentUser={currentUser}
                      allUsers={allUsers}
                      onStartCall={handleStartCall}
                      onClearChatHistory={(cid) => setClearChatTargetId(cid)}
                      onOpenSidebar={() => {
                        setActiveChatId(null);
                      }}
                      onBack={() => {
                        setActiveChatId(null);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-2 border-cyan-400/50 shadow-[0_0_35px_rgba(0,243,255,0.4)] bg-[#0d0d12] mb-4">
                        <img
                          src="/kaminari-logo.jpg"
                          alt="Kaminari Logo"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        Welcome to Kaminari Chat
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Select a chat from the sidebar or start a new conversation.
                      </p>
                      <div className="flex items-center gap-3 mt-5">
                        <button
                          type="button"
                          onClick={() => setShowNewChatModal(true)}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black font-bold text-xs hover:brightness-110 hover:scale-105 transition-transform cursor-pointer shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                        >
                          + New Conversation
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowInstallModal(true)}
                          className="px-5 py-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold text-xs hover:bg-cyan-900/60 hover:scale-105 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.2)] flex items-center gap-2"
                        >
                          <Download className="w-4 h-4 text-cyan-400" />
                          <span>Install App</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer with Creator Name & App Download button */}
          <footer className="w-full shrink-0 py-1.5 px-4 bg-[#0d0d12]/90 border-t border-white/5 backdrop-blur-md flex items-center justify-between text-[11px] font-mono text-slate-400 z-30">
            <div className="flex items-center gap-1.5">
              <span>Created by</span>
              <span className="text-cyan-400 font-bold tracking-wider uppercase">
                RAJ
              </span>
            </div>

            <button
              onClick={() => setShowInstallModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/5 hover:bg-cyan-950/50 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Install App</span>
            </button>
          </footer>
        </div>

        {/* MODAL: Active WebRTC Audio / Video Call */}
        <AnimatePresence>
          {activeCallSession && currentUser && (
            <CallScreen
              session={activeCallSession}
              currentUser={currentUser}
              onEndCall={handleEndCall}
            />
          )}
        </AnimatePresence>

        {/* MODAL: 24h Stories Viewer */}
        <AnimatePresence>
          {activeStoryIndex !== null && currentUser && stories.length > 0 && (
            <StoriesModal
              stories={stories}
              initialIndex={activeStoryIndex}
              currentUser={currentUser}
              onClose={() => setActiveStoryIndex(null)}
              onReplyToStory={handleStoryReply}
            />
          )}
        </AnimatePresence>

        {/* MODAL: Create 24h Story */}
        <AnimatePresence>
          {showCreateStoryModal && (
            <CreateStoryModal
              onClose={() => setShowCreateStoryModal(false)}
              onStoryCreated={() => {
                setStories(kaminariBackend.getActiveStories());
              }}
            />
          )}
        </AnimatePresence>

        {/* MODAL: New Chat / Lightning Channel */}
        <AnimatePresence>
          {showNewChatModal && currentUser && (
            <NewChatModal
              currentUser={currentUser}
              allUsers={allUsers}
              onClose={() => setShowNewChatModal(false)}
              onChatCreated={(newChat) => {
                setActiveChatId(newChat.id);
                setMobileSidebarOpen(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* MODAL: Clear All Chat History Warning */}
        <AnimatePresence>
          {clearChatTargetId && (
            <ClearChatConfirmModal
              chatName={chats.find((c) => c.id === clearChatTargetId)?.name || 'Direct Chat'}
              onConfirm={() => handleClearHistory(clearChatTargetId)}
              onClose={() => setClearChatTargetId(null)}
            />
          )}
        </AnimatePresence>

        {/* MODAL: User Profile Settings */}
        <AnimatePresence>
          {showProfileModal && currentUser && (
            <UserProfileModal
              currentUser={currentUser}
              onClose={() => setShowProfileModal(false)}
              onProfileUpdated={(updated) => setCurrentUser(updated)}
              onOpenAdmin={() => setShowAdminModal(true)}
            />
          )}
        </AnimatePresence>

        {/* MODAL: Admin Control Panel */}
        <AnimatePresence>
          {showAdminModal && currentUser && (
            <AdminPanelModal
              currentUser={currentUser}
              onClose={() => setShowAdminModal(false)}
              onRefreshData={() => {
                setAllUsers(kaminariBackend.getAllUsers());
                setChats(kaminariBackend.getChats());
                setStories(kaminariBackend.getActiveStories());
              }}
            />
          )}
        </AnimatePresence>
        {/* MODAL: Install PWA App */}
        <InstallPwaModal
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
        />
      </div>
    </BrowserRouter>
  );
}
