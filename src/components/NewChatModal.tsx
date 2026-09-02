import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Users, MessageSquare, Plus, Check, Zap, Sparkles, ArrowLeft, Search } from 'lucide-react';
import { User, Chat } from '../types';
import { kaminariBackend } from '../services/kaminariBackend';

interface NewChatModalProps {
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onChatCreated: (chat: Chat) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  currentUser,
  allUsers,
  onClose,
  onChatCreated,
}) => {
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [searchingRemote, setSearchingRemote] = useState(false);
  const [loading, setLoading] = useState(false);

  // Trigger remote Firestore user search
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(async () => {
      try {
        setSearchingRemote(true);
        await kaminariBackend.searchUsersLive(searchQuery);
      } catch (err) {
        console.warn('Remote search error:', err);
      } finally {
        setSearchingRemote(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const availableUsers = allUsers.filter((u) => u.id !== currentUser.id);

  // Filtered direct message contacts
  const filteredDirectUsers = availableUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim().replace(/^@/, '');
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.bio?.toLowerCase().includes(q)
    );
  });

  // Filtered group member candidates
  const filteredGroupCandidates = availableUsers.filter((u) => {
    if (!groupSearchQuery.trim()) return true;
    const q = groupSearchQuery.toLowerCase().trim().replace(/^@/, '');
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  // Create Direct Chat
  const handleStartDirectChat = async (otherUserId: string) => {
    setLoading(true);
    try {
      const chat = await kaminariBackend.createDirectChat(otherUserId);
      onChatCreated(chat);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle user for group
  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // Create Group Chat
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0) return;

    setLoading(true);
    try {
      const chat = await kaminariBackend.createGroupChat({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        participantIds: selectedUserIds,
      });
      onChatCreated(chat);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (tab === 'group') {
      setTab('direct');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full sm:h-auto sm:max-h-[90dvh] sm:max-w-lg overflow-y-auto sm:rounded-3xl rounded-none bg-[#12121e]/95 border-0 sm:border sm:border-white/10 p-4 sm:p-6 shadow-[0_8px_40px_rgba(0,243,255,0.15)] backdrop-blur-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold group"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="inline">Back</span>
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] p-[2px] shadow-[0_0_20px_rgba(0,243,255,0.4)] shrink-0">
              <div className="w-full h-full bg-[#0d0d12] rounded-[14px] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white truncate">
                New Message
              </h3>
              <p className="text-xs text-slate-400 truncate">
                Direct chat or group
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 p-1.5 bg-white/5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setTab('direct')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'direct'
                ? 'bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Direct Message
          </button>
          <button
            type="button"
            onClick={() => setTab('group')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'group'
                ? 'bg-gradient-to-tr from-[#9d00ff] to-[#00f3ff] text-black shadow-[0_0_15px_rgba(157,0,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            New Group
          </button>
        </div>

        {/* Tab Body */}
        {tab === 'direct' ? (
          <div className="mt-4 flex flex-col min-h-0 flex-1 space-y-3">
            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, @username, or email..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/5 text-sm text-white placeholder-slate-400 border border-white/10 focus:border-cyan-400 focus:bg-white/10 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-medium">
              <span>Available Accounts ({filteredDirectUsers.length})</span>
              {searchingRemote && (
                <span className="text-cyan-400 flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Searching database...
                </span>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {filteredDirectUsers.length === 0 ? (
                <div className="py-10 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Users className="w-8 h-8 text-slate-500" />
                  <p className="text-sm font-semibold text-white">
                    {searchQuery ? `No user found for "${searchQuery}"` : 'No other users registered yet'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {searchQuery
                      ? 'Try searching by exact @username or email address.'
                      : 'Invite others or sign in from another browser window to chat.'}
                  </p>
                </div>
              ) : (
                filteredDirectUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleStartDirectChat(user.id)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 truncate min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="w-11 h-11 rounded-xl object-cover border border-white/10 group-hover:border-cyan-400 transition-colors"
                          referrerPolicy="no-referrer"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0d0d12] ${
                            user.status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'
                          }`}
                        />
                      </div>
                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-sm font-bold text-white group-hover:text-cyan-300 truncate">
                            {user.fullName}
                          </span>
                          {user.isAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-[9px] font-bold text-cyan-300 uppercase">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          @{user.username} {user.bio ? `• ${user.bio}` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={loading}
                      className="px-4 py-2 rounded-xl bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black text-xs font-bold group-hover:scale-105 transition-transform shrink-0 ml-2 shadow-[0_0_12px_rgba(0,243,255,0.2)]"
                    >
                      Message
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Group Name
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Project Team, Family, Friends"
                className="w-full px-4 py-2.5 rounded-2xl bg-white/5 text-white text-sm border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description (Optional)
              </label>
              <input
                type="text"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="What is this group about?"
                className="w-full px-4 py-2.5 rounded-2xl bg-white/5 text-white text-sm border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Add Members ({selectedUserIds.length} selected)
                </label>
              </div>

              {/* Group Member Search */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  placeholder="Filter members..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white/5 text-xs text-white placeholder-slate-400 border border-white/10 focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 bg-white/5 p-2.5 rounded-2xl border border-white/10 no-scrollbar">
                {filteredGroupCandidates.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No members matching filter
                  </p>
                ) : (
                  filteredGroupCandidates.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleUserSelection(user.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-950/40 border border-purple-500/40'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="w-8 h-8 rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="text-xs font-semibold text-white">
                              {user.fullName}
                            </div>
                            <div className="text-xs text-slate-400">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!groupName.trim() || selectedUserIds.length === 0 || loading}
              className="w-full py-3.5 px-4 rounded-2xl text-sm font-bold bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black disabled:opacity-40 shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Users className="w-4 h-4" />
              <span>Create Group ({selectedUserIds.length + 1} members)</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
