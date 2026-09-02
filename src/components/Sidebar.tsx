import React, { useState } from 'react';
import {
  Zap,
  Search,
  Plus,
  Users,
  MessageSquare,
  Radio,
  Settings,
  LogOut,
  Sparkles,
  Phone,
  Video,
  Lock,
  Globe,
  ArrowLeft,
  Shield,
  Download,
  Camera,
  Edit,
  UserCheck,
  Flame,
  Bell,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { Chat, User, Story } from '../types';
import { StoriesTray } from './StoriesTray';

interface SidebarProps {
  currentUser: User;
  chats: Chat[];
  allUsers: User[];
  stories: Story[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onSelectUser?: (userId: string) => void;
  onOpenNewChat: () => void;
  onOpenStory: (storyIndex: number) => void;
  onOpenCreateStory: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenInstallApp?: () => void;
  onLogout: () => void;
  onLockGate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  chats,
  allUsers,
  stories,
  activeChatId,
  onSelectChat,
  onSelectUser,
  onOpenNewChat,
  onOpenStory,
  onOpenCreateStory,
  onOpenProfile,
  onOpenAdmin,
  onOpenInstallApp,
  onLogout,
  onLockGate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState<'chats' | 'people' | 'stories' | 'settings'>('chats');
  const [chatCategory, setChatCategory] = useState<'all' | 'direct' | 'groups'>('all');

  // Filtered Chats
  const filteredChats = chats.filter((chat) => {
    if (chatCategory === 'direct' && chat.isGroup) return false;
    if (chatCategory === 'groups' && !chat.isGroup) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();

    if (chat.isGroup) {
      return (
        chat.name?.toLowerCase().includes(q) ||
        chat.description?.toLowerCase().includes(q)
      );
    }

    const otherId = chat.participants.find((p) => p !== currentUser.id);
    const detail = otherId ? chat.participantDetails[otherId] : null;
    return (
      detail?.fullName.toLowerCase().includes(q) ||
      detail?.username.toLowerCase().includes(q)
    );
  });

  // Filtered People / Contacts
  const filteredUsers = allUsers.filter((u) => {
    if (u.id === currentUser.id) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.bio?.toLowerCase().includes(q)
    );
  });

  const formatTimestamp = (time?: number) => {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#101018]/95 border-r border-white/5 backdrop-blur-2xl select-none">
      {/* 1. Messenger Top Header */}
      <div className="px-4 py-3.5 border-b border-white/5 bg-black/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* User Profile Avatar (Tap to open Settings/Me) */}
          <div
            onClick={() => setActiveNavTab('settings')}
            className="relative cursor-pointer group shrink-0"
            title="My Profile & Settings"
          >
            <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] group-hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)]">
              <img
                src={currentUser.avatar}
                alt={currentUser.fullName}
                className="w-full h-full rounded-full object-cover border border-[#0d0d12]"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0d0d12]" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              {activeNavTab === 'chats' && 'Chats'}
              {activeNavTab === 'people' && 'People'}
              {activeNavTab === 'stories' && 'Stories'}
              {activeNavTab === 'settings' && 'Me'}
            </h1>
          </div>
        </div>

        {/* Top Right Action Icons */}
        <div className="flex items-center gap-1.5">
          {/* Add Story Camera */}
          <button
            type="button"
            onClick={onOpenCreateStory}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer"
            title="Post a Story"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* New Message / Compose */}
          <button
            type="button"
            onClick={onOpenNewChat}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black hover:brightness-110 flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.4)] transition-all cursor-pointer"
            title="New Chat"
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Install PWA button */}
          {onOpenInstallApp && (
            <button
              type="button"
              onClick={onOpenInstallApp}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-900/60 transition-all cursor-pointer"
              title="Install App"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Install</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Content Area Switcher based on Bottom Nav Tab */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col min-h-0">
        {/* ===================== TAB 1: CHATS ===================== */}
        {activeNavTab === 'chats' && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search Bar */}
            <div className="p-3 pb-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Messenger..."
                  className="w-full pl-10 pr-8 py-2.5 rounded-full bg-white/5 text-xs sm:text-sm text-white placeholder-slate-400 border border-white/10 focus:border-cyan-400 focus:bg-white/10 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-2.5 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Stories Tray Carousel (Always at top of Chats tab, Messenger style) */}
            {!searchQuery && (
              <div className="border-b border-white/5 pb-2">
                <StoriesTray
                  currentUser={currentUser}
                  stories={stories}
                  onOpenStory={onOpenStory}
                  onOpenCreateStory={onOpenCreateStory}
                />
              </div>
            )}

            {/* Quick Filter Pills (All / Direct / Groups) */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setChatCategory('all')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                  chatCategory === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                All Chats ({chats.length})
              </button>
              <button
                type="button"
                onClick={() => setChatCategory('direct')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                  chatCategory === 'direct'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Direct
              </button>
              <button
                type="button"
                onClick={() => setChatCategory('groups')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                  chatCategory === 'groups'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Groups
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/5 p-2 space-y-0.5">
              {filteredChats.length === 0 ? (
                <div className="py-12 px-4 text-center text-slate-400 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">No Conversations Found</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Start a new message to begin chatting.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenNewChat}
                    className="mt-1 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#00f3ff] to-[#9d00ff] text-black text-xs font-bold hover:brightness-110 cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                  >
                    + New Message
                  </button>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isActive = chat.id === activeChatId;
                  const otherId = !chat.isGroup
                    ? chat.participants.find((p) => p !== currentUser.id)
                    : null;
                  const otherDetail = otherId ? chat.participantDetails[otherId] : null;

                  const displayName = chat.isGroup
                    ? chat.name
                    : otherDetail?.fullName || 'User';
                  const displayAvatar = chat.isGroup
                    ? chat.avatar || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80'
                    : otherDetail?.avatar;

                  const isOnline = otherId
                    ? allUsers.find((u) => u.id === otherId)?.status === 'online'
                    : true;

                  return (
                    <div
                      key={chat.id}
                      onClick={() => onSelectChat(chat.id)}
                      className={`flex items-center gap-3 p-3 transition-all cursor-pointer rounded-2xl ${
                        isActive
                          ? 'bg-white/10 border border-cyan-400/30 shadow-[0_2px_15px_rgba(0,243,255,0.08)]'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-13 h-13 rounded-full overflow-hidden p-[2px] ${
                            isActive
                              ? 'bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff]'
                              : 'bg-white/10'
                          }`}
                        >
                          <img
                            src={displayAvatar}
                            alt={displayName}
                            className="w-full h-full rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Online Dot */}
                        {!chat.isGroup && (
                          <span
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#101018] ${
                              isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'
                            }`}
                          />
                        )}
                        {chat.isGroup && (
                          <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded-md bg-purple-950 border border-purple-500/50 text-[9px] font-bold text-purple-300">
                            Group
                          </span>
                        )}
                      </div>

                      {/* Chat Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`text-sm font-bold truncate ${
                              isActive ? 'text-cyan-300' : 'text-slate-100'
                            }`}
                          >
                            {displayName}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0 ml-2 font-medium">
                            {formatTimestamp(chat.updatedAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-300 truncate pr-2">
                            {chat.lastMessage?.text || 'Tap to send a message'}
                          </p>
                          {chat.isGroup && (
                            <span className="text-[10px] text-purple-400 shrink-0">
                              {chat.participants.length} members
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 2: PEOPLE ===================== */}
        {activeNavTab === 'people' && (
          <div className="flex flex-col flex-1 min-h-0 p-3">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-8 py-2.5 rounded-full bg-white/5 text-xs sm:text-sm text-white placeholder-slate-400 border border-white/10 focus:border-cyan-400 outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-1 py-1 mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Online Now ({filteredUsers.filter((u) => u.status === 'online').length})
              </span>
            </div>

            <div className="space-y-1 overflow-y-auto no-scrollbar flex-1">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    if (onSelectUser) {
                      onSelectUser(user.id);
                    } else {
                      onOpenNewChat();
                    }
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 truncate min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-white/10 group-hover:border-cyan-400"
                        referrerPolicy="no-referrer"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#101018] ${
                          user.status === 'online'
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                            : 'bg-slate-600'
                        }`}
                      />
                    </div>
                    <div className="truncate min-w-0">
                      <div className="text-sm font-bold text-white group-hover:text-cyan-300 truncate">
                        {user.fullName}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        @{user.username} {user.bio ? `• ${user.bio}` : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-semibold shrink-0 ml-2"
                  >
                    Chat
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: STORIES ===================== */}
        {activeNavTab === 'stories' && (
          <div className="flex flex-col flex-1 min-h-0 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">24-Hour Stories</h3>
                <p className="text-xs text-slate-400">Photos and updates from friends</p>
              </div>
              <button
                type="button"
                onClick={onOpenCreateStory}
                className="px-4 py-2 rounded-full bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black text-xs font-bold hover:brightness-110 flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Story</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 overflow-y-auto no-scrollbar flex-1">
              {/* Add Story Card */}
              <div
                onClick={onOpenCreateStory}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-dashed border-cyan-400/40 bg-cyan-950/20 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-cyan-950/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white">Your Story</span>
                <span className="text-[11px] text-cyan-400 mt-0.5">Share a photo</span>
              </div>

              {/* Existing Stories */}
              {stories.map((story, index) => (
                <div
                  key={story.id}
                  onClick={() => onOpenStory(index)}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-md"
                >
                  <img
                    src={story.mediaUrl}
                    alt={story.caption || 'Story'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                  {/* Top user badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                    <img
                      src={story.userAvatar}
                      alt={story.userName}
                      className="w-7 h-7 rounded-full object-cover border-2 border-cyan-400"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-xs font-bold text-white drop-shadow-md truncate max-w-[80px]">
                      {story.userName}
                    </span>
                  </div>

                  {/* Caption */}
                  {story.caption && (
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-xs text-white drop-shadow-md truncate">
                      {story.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: ME / SETTINGS ===================== */}
        {activeNavTab === 'settings' && (
          <div className="flex flex-col flex-1 min-h-0 p-4 space-y-4">
            {/* Profile Overview Card */}
            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff]">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.fullName}
                    className="w-full h-full rounded-full object-cover border border-[#101018]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#101018]" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white truncate">
                  {currentUser.fullName}
                </h3>
                <p className="text-xs text-slate-400 truncate">@{currentUser.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  {currentUser.role === 'admin' && (
                    <span className="px-2 py-0.5 rounded-md bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 text-[10px] font-bold">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Options List */}
            <div className="space-y-1.5">
              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="w-full p-3.5 rounded-2xl bg-fuchsia-950/30 hover:bg-fuchsia-950/50 border border-fuchsia-500/30 text-fuchsia-200 text-xs font-bold flex items-center justify-between cursor-pointer transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-fuchsia-400" />
                    <span>Admin Control Dashboard</span>
                  </span>
                  <span>→</span>
                </button>
              )}

              {onOpenInstallApp && (
                <button
                  type="button"
                  onClick={onOpenInstallApp}
                  className="w-full p-3.5 rounded-2xl bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-500/30 text-cyan-200 text-xs font-bold flex items-center justify-between cursor-pointer transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-cyan-400 animate-bounce" />
                    <span>Install App on Home Screen</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">PWA</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenProfile}
                className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium flex items-center justify-between cursor-pointer transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Account & Privacy</span>
                </span>
                <span className="text-slate-500">›</span>
              </button>

              <button
                type="button"
                onClick={onLockGate}
                className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium flex items-center justify-between cursor-pointer transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Lock with Passcode</span>
                </span>
                <span className="text-slate-500">›</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full p-3.5 rounded-2xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between cursor-pointer transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Messenger Bottom Navigation Bar (Fixed at bottom, standard mobile Messenger layout) */}
      <div className="px-3 py-2 border-t border-white/5 bg-black/60 backdrop-blur-xl flex items-center justify-around shrink-0 z-30">
        {/* Tab 1: Chats */}
        <button
          type="button"
          onClick={() => setActiveNavTab('chats')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeNavTab === 'chats'
              ? 'text-cyan-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {chats.length > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </div>
          <span className="text-[11px] font-semibold">Chats</span>
        </button>

        {/* Tab 2: People */}
        <button
          type="button"
          onClick={() => setActiveNavTab('people')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeNavTab === 'people'
              ? 'text-cyan-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[11px] font-semibold">People</span>
        </button>

        {/* Tab 3: Stories */}
        <button
          type="button"
          onClick={() => setActiveNavTab('stories')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeNavTab === 'stories'
              ? 'text-cyan-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Sparkles className="w-5 h-5" />
            {stories.length > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-purple-400" />
            )}
          </div>
          <span className="text-[11px] font-semibold">Stories</span>
        </button>

        {/* Tab 4: Me / Settings */}
        <button
          type="button"
          onClick={() => setActiveNavTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeNavTab === 'settings'
              ? 'text-cyan-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] font-semibold">Me</span>
        </button>
      </div>

      {/* Floating Action Button (FAB) on mobile for Compose */}
      {activeNavTab === 'chats' && (
        <button
          type="button"
          onClick={onOpenNewChat}
          className="lg:hidden fixed bottom-18 right-4 w-13 h-13 rounded-full bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black flex items-center justify-center shadow-[0_4px_25px_rgba(0,243,255,0.5)] active:scale-95 transition-transform cursor-pointer z-40"
          title="New Message"
        >
          <Edit className="w-6 h-6 text-black" />
        </button>
      )}
    </div>
  );
};
