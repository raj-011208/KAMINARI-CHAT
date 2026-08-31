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
  onOpenNewChat: () => void;
  onOpenStory: (storyIndex: number) => void;
  onOpenCreateStory: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
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
  onOpenNewChat,
  onOpenStory,
  onOpenCreateStory,
  onOpenProfile,
  onOpenAdmin,
  onLogout,
  onLockGate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'direct' | 'groups' | 'network'>('all');

  // Filtered Chats
  const filteredChats = chats.filter((chat) => {
    if (filterTab === 'direct' && chat.isGroup) return false;
    if (filterTab === 'groups' && !chat.isGroup) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();

    if (chat.isGroup) {
      return (
        chat.name?.toLowerCase().includes(q) ||
        chat.description?.toLowerCase().includes(q)
      );
    }

    // Direct chat: search by other participant name/username
    const otherId = chat.participants.find((p) => p !== currentUser.id);
    const detail = otherId ? chat.participantDetails[otherId] : null;
    return (
      detail?.fullName.toLowerCase().includes(q) ||
      detail?.username.toLowerCase().includes(q)
    );
  });

  // Filtered Network Directory Users
  const filteredUsers = allUsers.filter((u) => {
    if (u.id === currentUser.id) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.bio.toLowerCase().includes(q)
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
    <div className="w-full h-full flex flex-col bg-[#12121a]/80 border-r border-white/5 backdrop-blur-xl select-none">
      {/* Top App Brand Header */}
      <div className="px-4 pt-3.5 pb-2.5 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-cyan-400/40 shadow-[0_0_12px_rgba(0,243,255,0.3)] bg-[#0d0d12]">
            <img
              src="/kaminari-logo.jpg"
              alt="Kaminari Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="text-sm font-display font-black tracking-wider text-white">
              KAMINARI <span className="text-cyan-400">CHAT</span>
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-cyan-400/80 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30">
          GRID v2.4
        </span>
      </div>

      {/* Current User Profile Bar */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md">
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-3 cursor-pointer group"
          title="View & Edit Profile"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl p-[2px] bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] group-hover:shadow-[0_0_20px_rgba(0,243,255,0.5)] transition-all">
              <img
                src={currentUser.avatar}
                alt={currentUser.fullName}
                className="w-full h-full rounded-[9px] object-cover border border-[#0d0d12]"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0d0d12] animate-pulse" />
          </div>

          <div className="truncate">
            <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5 truncate">
              <span>{currentUser.fullName}</span>
              {currentUser.role === 'admin' && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                  ADMIN
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
              @{currentUser.username}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          {/* Admin Control Panel Button */}
          <button
            type="button"
            onClick={onOpenAdmin}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              currentUser.role === 'admin'
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 hover:bg-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10'
            }`}
            title="Admin Control Center"
          >
            <Shield className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenNewChat}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.15)]"
            title="Start New Chat or Channel"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Profile & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="p-2.5 rounded-xl hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Disconnect / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Center Quick Access Banner */}
      {currentUser.role === 'admin' && (
        <div className="px-4 py-2 bg-gradient-to-r from-fuchsia-950/40 to-cyan-950/40 border-b border-fuchsia-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-fuchsia-300 font-bold">
            <Shield className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
            <span>ADMIN CONTROL CENTER</span>
          </div>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/40 text-[10px] font-mono font-bold cursor-pointer transition-all hover:scale-105"
          >
            MANAGE APP →
          </button>
        </div>
      )}

      {/* 24-Hour Stories Tray */}
      <StoriesTray
        currentUser={currentUser}
        stories={stories}
        onOpenStory={onOpenStory}
        onOpenCreateStory={onOpenCreateStory}
      />

      {/* Search Input Bar */}
      <div className="p-3.5 border-b border-white/5 bg-black/10">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transmissions, operatives..."
            className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-white/5 text-xs font-mono text-white placeholder-slate-500 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none transition-all"
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

      {/* Tab Filter Switcher */}
      <div className="flex items-center px-3 py-2 border-b border-white/5 gap-1.5 bg-black/20 text-[11px] font-mono">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`flex-1 py-1.5 rounded-xl text-center font-bold transition-all cursor-pointer ${
            filterTab === 'all'
              ? 'bg-gradient-to-r from-[#00f3ff]/20 to-[#9d00ff]/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(0,243,255,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          ALL ({chats.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('direct')}
          className={`flex-1 py-1.5 rounded-xl text-center font-bold transition-all cursor-pointer ${
            filterTab === 'direct'
              ? 'bg-[#00f3ff]/20 text-cyan-300 border border-cyan-400/40'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          DIRECT
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('groups')}
          className={`flex-1 py-1.5 rounded-xl text-center font-bold transition-all cursor-pointer ${
            filterTab === 'groups'
              ? 'bg-[#00f3ff]/20 text-cyan-300 border border-cyan-400/40'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          CHANNELS
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('network')}
          className={`flex-1 py-1.5 rounded-xl text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            filterTab === 'network'
              ? 'bg-[#9d00ff]/20 text-purple-300 border border-purple-400/40'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe className="w-3 h-3" />
          GRID
        </button>
      </div>

      {/* Chat & User List Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/5 p-2 space-y-1">
        {/* Back option banner when filtered or searched */}
        {(filterTab !== 'all' || searchQuery.trim()) && (
          <div className="pb-1 px-1">
            <button
              type="button"
              onClick={() => {
                setFilterTab('all');
                setSearchQuery('');
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 text-[11px] font-mono flex items-center justify-between transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-cyan-400" />
                <span>BACK TO ALL TRANSMISSIONS</span>
              </span>
              <span className="text-[10px] text-slate-400">CLEAR FILTER</span>
            </button>
          </div>
        )}

        {filterTab === 'network' ? (
          /* Network Directory View */
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
              ONLINE OPERATIVES ON GRID ({filteredUsers.length})
            </div>
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={onOpenNewChat}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:border-cyan-400"
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0d12] ${
                        user.status === 'online'
                          ? 'bg-emerald-400'
                          : user.status === 'away'
                          ? 'bg-amber-400'
                          : 'bg-slate-600'
                      }`}
                    />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      @{user.username} • {user.bio}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-mono border border-cyan-500/30 shrink-0"
                >
                  Message
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Normal Chat Stream */
          <div className="space-y-1">
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 text-slate-600" />
                <p className="text-xs font-mono">No active transmissions found</p>
                <button
                  type="button"
                  onClick={onOpenNewChat}
                  className="mt-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#00f3ff] to-[#9d00ff] text-black text-xs font-mono font-bold hover:brightness-110 cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                >
                  + Start First Transmission
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
                  : otherDetail?.fullName || 'Operative';
                const displayAvatar = chat.isGroup
                  ? chat.avatar || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80'
                  : otherDetail?.avatar;
                const displayHandle = !chat.isGroup ? `@${otherDetail?.username}` : 'CHANNEL';

                const isOnline = otherId
                  ? allUsers.find((u) => u.id === otherId)?.status === 'online'
                  : true;

                return (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`flex items-center gap-3 p-3 transition-all cursor-pointer rounded-2xl border ${
                      isActive
                        ? 'bg-white/5 border-white/10 shadow-[0_4px_20px_rgba(0,243,255,0.06)]'
                        : 'border-transparent hover:bg-white/5 hover:border-white/5'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-12 h-12 rounded-2xl p-[2px] overflow-hidden transition-transform ${
                          isActive
                            ? 'bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] scale-105 shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                            : 'bg-white/10'
                        }`}
                      >
                        <img
                          src={displayAvatar}
                          alt={displayName}
                          className="w-full h-full rounded-[14px] object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Online dot for 1-on-1 */}
                      {!chat.isGroup && (
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0d0d12] ${
                            isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'
                          }`}
                        />
                      )}
                      {chat.isGroup && (
                        <span className="absolute -bottom-1 -right-1 p-0.5 rounded-lg bg-cyan-950 border border-cyan-500/50 text-[9px] font-mono text-cyan-300">
                          GRP
                        </span>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className={`text-xs sm:text-sm font-bold truncate ${
                              isActive ? 'text-cyan-300' : 'text-slate-100'
                            }`}
                          >
                            {displayName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 truncate">
                            {displayHandle}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-1">
                          {formatTimestamp(chat.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 truncate pr-2 font-mono">
                          {chat.lastMessage?.text || 'No transmissions yet'}
                        </p>
                        {chat.isGroup && (
                          <span className="text-[10px] font-mono text-purple-400 shrink-0">
                            {chat.participants.length} ops
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer Grid Security Badge */}
      <div className="p-3.5 border-t border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          KAMINARI MESH v1.0
        </span>
        <button
          type="button"
          onClick={onLockGate}
          className="text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer group py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
          title="Lock Grid & Return to Passcode Gate"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform text-slate-400 group-hover:text-cyan-400" />
          <span>BACK TO GATE</span>
        </button>
      </div>
    </div>
  );
};
