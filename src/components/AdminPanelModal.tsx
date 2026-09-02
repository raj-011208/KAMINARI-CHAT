import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Users,
  MessageSquare,
  Radio,
  Sparkles,
  Zap,
  Lock,
  Unlock,
  Trash2,
  Edit3,
  UserCheck,
  UserX,
  AlertTriangle,
  Send,
  X,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Database,
  Search,
  KeyRound,
  Sliders,
  Bell,
  Power,
} from 'lucide-react';
import { User, Chat, Story, SystemSettings, SystemAnnouncement } from '../types';
import { kaminariBackend } from '../services/kaminariBackend';
import { CYBERPUNK_AVATARS } from '../services/mockData';

interface AdminPanelModalProps {
  currentUser: User;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  currentUser,
  onClose,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'chats' | 'stories' | 'security'>('overview');
  const [stats, setStats] = useState(kaminariBackend.getSystemStats());
  const [settings, setSettings] = useState<SystemSettings>(kaminariBackend.getSystemSettings());
  const [usersList, setUsersList] = useState<User[]>(kaminariBackend.getUsers());
  const [chatsList, setChatsList] = useState<Chat[]>(kaminariBackend.getAllChats());
  const [storiesList, setStoriesList] = useState<Story[]>(kaminariBackend.getActiveStories());

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user' | 'banned'>('all');
  const [chatSearch, setChatSearch] = useState('');

  // Announcement Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'critical' | 'lightning'>('lightning');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals inside Admin Panel
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingChat, setEditingChat] = useState<Chat | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{ type: 'user' | 'chat' | 'story' | 'all'; id?: string; name?: string } | null>(null);

  // New User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [newAvatar, setNewAvatar] = useState(CYBERPUNK_AVATARS[0].url);

  // New Channel Form State
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  // Admin Password Gate State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Passcode & Admin Password update state
  const [newPasscode, setNewPasscode] = useState(settings.accessPasscode || 'kaminari69');
  const [newAdminPassword, setNewAdminPassword] = useState(settings.adminPassword || 'admin69');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshAll = () => {
    setStats(kaminariBackend.getSystemStats());
    const currentSettings = kaminariBackend.getSystemSettings();
    setSettings(currentSettings);
    setNewPasscode(currentSettings.accessPasscode || 'kaminari69');
    setNewAdminPassword(currentSettings.adminPassword || 'admin69');
    setUsersList([...kaminariBackend.getUsers()]);
    setChatsList([...kaminariBackend.getAllChats()]);
    setStoriesList([...kaminariBackend.getActiveStories()]);
    if (onRefreshData) onRefreshData();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Handler for Admin Password Authentication
  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setAuthError('Please enter the admin password.');
      return;
    }

    const isValid = kaminariBackend.verifyAdminPassword(passwordInput);
    if (isValid) {
      setIsAuthenticated(true);
      setAuthError(null);
      setPasswordInput('');
      showToast('⚡ Admin Clearance Granted. Terminal Unlocked.');
    } else {
      setAuthError('ACCESS DENIED: Invalid Admin Password.');
    }
  };

  // Handlers for Global Broadcast
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    kaminariBackend.createAdminAnnouncement(broadcastTitle.trim(), broadcastMessage.trim(), broadcastType);
    setBroadcastTitle('');
    setBroadcastMessage('');
    refreshAll();
    showToast('⚡ Global Network Announcement broadcasted successfully!');
  };

  const handleClearBroadcast = () => {
    kaminariBackend.clearAdminAnnouncement();
    refreshAll();
    showToast('Broadcast banner removed.');
  };

  // Handlers for User Actions
  const handleToggleAdmin = async (user: User) => {
    const isNowAdmin = user.role !== 'admin';
    await kaminariBackend.toggleAdminRole(user.id, isNowAdmin);
    refreshAll();
    showToast(`User @${user.username} is now ${isNowAdmin ? 'an Administrator' : 'a Standard Operative'}.`);
  };

  const handleToggleBan = async (user: User) => {
    const isNowBanned = !user.isBanned;
    await kaminariBackend.toggleBanUser(user.id, isNowBanned);
    refreshAll();
    showToast(`User @${user.username} access ${isNowBanned ? 'RESTRICTED / BANNED' : 'RESTORED'}.`);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await kaminariBackend.updateUserByAdmin(editingUser.id, editingUser);
      setEditingUser(null);
      refreshAll();
      showToast(`User @${editingUser.username} profile updated.`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newUsername.trim() || !newEmail.trim()) return;
    try {
      await kaminariBackend.createUserByAdmin({
        fullName: newFullName.trim(),
        username: newUsername.trim(),
        email: newEmail.trim(),
        role: newRole,
        avatar: newAvatar,
      });
      setShowCreateUserModal(false);
      setNewFullName('');
      setNewUsername('');
      setNewEmail('');
      refreshAll();
      showToast('⚡ New Operative provisioned successfully!');
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Handlers for Chat Actions
  const handleSaveEditChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChat) return;
    try {
      await kaminariBackend.updateChatByAdmin(editingChat.id, editingChat);
      setEditingChat(null);
      refreshAll();
      showToast(`Channel "${editingChat.name || 'Chat'}" updated.`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleCreateOfficialChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      const allUserIds = usersList.map((u) => u.id);
      await kaminariBackend.createGroupChat({
        name: newChannelName.trim(),
        description: newChannelDesc.trim() || '⚡ Official Kaminari Admin Channel',
        participantIds: allUserIds,
      });
      setShowNewChannelModal(false);
      setNewChannelName('');
      setNewChannelDesc('');
      refreshAll();
      showToast(`⚡ Channel "${newChannelName}" broadcast to all operatives!`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Confirm delete handler
  const handleExecuteDelete = async () => {
    if (!confirmDeleteTarget) return;

    if (confirmDeleteTarget.type === 'user' && confirmDeleteTarget.id) {
      await kaminariBackend.deleteUserAccount(confirmDeleteTarget.id);
      showToast('Operative account permanently deleted.');
    } else if (confirmDeleteTarget.type === 'chat' && confirmDeleteTarget.id) {
      await kaminariBackend.deleteChatByAdmin(confirmDeleteTarget.id);
      showToast('Channel permanently deleted.');
    } else if (confirmDeleteTarget.type === 'story' && confirmDeleteTarget.id) {
      await kaminariBackend.deleteStoryByAdmin(confirmDeleteTarget.id);
      showToast('Story removed from network.');
    } else if (confirmDeleteTarget.type === 'all') {
      kaminariBackend.resetAllLocalData();
      showToast('All app data and cache reset to default factory state.');
    }

    setConfirmDeleteTarget(null);
    refreshAll();
  };

  // Passcode & System Toggles
  const handleUpdatePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode.trim()) return;
    kaminariBackend.updateSystemSettings({ accessPasscode: newPasscode.trim() });
    refreshAll();
    showToast(`⚡ Access Gate Passcode updated to: "${newPasscode.trim()}"`);
  };

  const handleUpdateAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword.trim()) return;
    kaminariBackend.updateSystemSettings({ adminPassword: newAdminPassword.trim() });
    refreshAll();
    showToast(`⚡ Admin Panel Master Password updated to: "${newAdminPassword.trim()}"`);
  };

  const handleToggleRegistration = () => {
    const newVal = !settings.allowNewRegistrations;
    kaminariBackend.updateSystemSettings({ allowNewRegistrations: newVal });
    refreshAll();
    showToast(`New registrations are now ${newVal ? 'ALLOWED' : 'LOCKED'}.`);
  };

  const handleToggleMaintenance = () => {
    const newVal = !settings.maintenanceMode;
    kaminariBackend.updateSystemSettings({ maintenanceMode: newVal });
    refreshAll();
    showToast(`Maintenance mode is now ${newVal ? 'ENABLED' : 'DISABLED'}.`);
  };

  // Filtered lists
  const filteredUsers = usersList.filter((u) => {
    if (userRoleFilter === 'admin' && u.role !== 'admin') return false;
    if (userRoleFilter === 'user' && u.role === 'admin') return false;
    if (userRoleFilter === 'banned' && !u.isBanned) return false;

    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const filteredChats = chatsList.filter((c) => {
    if (!chatSearch.trim()) return true;
    const q = chatSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      Object.values(c.participantDetails || {}).some((p: any) =>
        p?.fullName?.toLowerCase()?.includes(q)
      )
    );
  });

  // If not authenticated, show high-security Admin Password Gate
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-md bg-[#0f0f17] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,243,255,0.25)] flex flex-col text-slate-100 overflow-hidden">
          {/* Subtle Background Glow Accent */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-fuchsia-500 to-cyan-400 p-[2px] shadow-[0_0_25px_rgba(0,243,255,0.4)] mb-4">
              <div className="w-full h-full bg-[#0d0d14] rounded-[14px] flex items-center justify-center">
                <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 font-mono text-[10px] font-bold uppercase tracking-wider mb-2">
              <Lock className="w-3 h-3 text-fuchsia-400" />
              <span>CLEARANCE AUTHENTICATION</span>
            </div>

            <h2 className="text-xl font-bold text-white tracking-wide">
              Admin Login
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Enter the admin password to access system settings, moderation controls, and user management.
            </p>
          </div>

          {/* Password Form */}
          <form onSubmit={handleAuthenticate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Admin Password</span>
                <span className="text-xs text-cyan-400 font-medium">Default: admin69</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  required
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Enter admin master password..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-black/50 border border-white/15 text-cyan-300 text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-black font-bold text-xs uppercase tracking-wider transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-[0_0_20px_rgba(0,243,255,0.35)] flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Admin Panel</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
              >
                Cancel & Return
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-[#0f0f17] border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(0,243,255,0.2)] flex flex-col overflow-hidden text-slate-100">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-fuchsia-600 p-[2px] shadow-[0_0_20px_rgba(0,243,255,0.4)]">
              <div className="w-full h-full bg-[#0d0d12] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Admin Panel
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Administrator
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as: <span className="text-cyan-400 font-semibold">{currentUser.fullName}</span> (@{currentUser.username})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAuthenticated(false);
                showToast('Admin session locked.');
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer border border-white/5"
              title="Lock Admin Terminal"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={refreshAll}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/5"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-950/50 text-slate-400 hover:text-red-400 transition-colors cursor-pointer border border-white/5"
              title="Close Admin Center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-black/20 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: '📊 Dashboard & Broadcast', icon: Sliders },
            { id: 'users', label: `👥 Users (${usersList.length})`, icon: Users },
            { id: 'chats', label: `💬 Chats & Groups (${chatsList.length})`, icon: MessageSquare },
            { id: 'stories', label: `⚡ Stories (${storiesList.length})`, icon: Sparkles },
            { id: 'security', label: '🛡️ Passwords & Settings', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,243,255,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toast Notification Banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 text-xs font-mono flex items-center justify-between shadow-[0_0_20px_rgba(0,243,255,0.2)]"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-cyan-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Tab Content Viewport */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB 1: OVERVIEW & TELEMETRY */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[11px] font-mono text-slate-400">Total Operatives</span>
                  <span className="text-2xl font-bold font-display text-white mt-1">{stats.totalUsers}</span>
                  <span className="text-[10px] font-mono text-cyan-400 mt-auto pt-1">{stats.onlineUsers} online now</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[11px] font-mono text-slate-400">Admin Staff</span>
                  <span className="text-2xl font-bold font-display text-fuchsia-400 mt-1">{stats.adminCount}</span>
                  <span className="text-[10px] font-mono text-slate-500 mt-auto pt-1">{stats.bannedCount} restricted</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[11px] font-mono text-slate-400">Total Channels</span>
                  <span className="text-2xl font-bold font-display text-cyan-400 mt-1">{stats.totalChats}</span>
                  <span className="text-[10px] font-mono text-slate-500 mt-auto pt-1">{stats.groupChatsCount} groups</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[11px] font-mono text-slate-400">Messages Logged</span>
                  <span className="text-2xl font-bold font-display text-emerald-400 mt-1">{stats.totalMessages}</span>
                  <span className="text-[10px] font-mono text-emerald-500 mt-auto pt-1">Encrypted Relay</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[11px] font-mono text-slate-400">24h Stories</span>
                  <span className="text-2xl font-bold font-display text-amber-400 mt-1">{stats.activeStories}</span>
                  <span className="text-[10px] font-mono text-amber-500 mt-auto pt-1">Active ephemeral</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[11px] font-mono text-slate-400">Cloud Sync</span>
                  <span className="text-lg font-bold font-display text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 mt-auto pt-1">Firestore Mesh</span>
                </div>
              </div>

              {/* Global System Broadcast Module */}
              <div className="p-5 rounded-2xl bg-black/40 border border-cyan-500/20 shadow-[0_0_30px_rgba(0,243,255,0.05)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider">
                      Global Live Broadcast Announcement
                    </h3>
                  </div>
                  {settings.globalBroadcast && (
                    <button
                      type="button"
                      onClick={handleClearBroadcast}
                      className="text-xs font-mono text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Clear Active Broadcast
                    </button>
                  )}
                </div>

                {settings.globalBroadcast && (
                  <div className="mb-4 p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-400/40 flex items-start gap-3">
                    <Bell className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-bounce" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                        <span>ACTIVE BANNER: {settings.globalBroadcast.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400">
                          {settings.globalBroadcast.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{settings.globalBroadcast.message}</p>
                      <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                        Broadcast by {settings.globalBroadcast.authorName} • Visible to all online clients
                      </span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendBroadcast} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        Broadcast Headline / Title
                      </label>
                      <input
                        type="text"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="e.g. ⚡ SYSTEM OVERHAUL COMPLETED"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        Banner Style
                      </label>
                      <select
                        value={broadcastType}
                        onChange={(e) => setBroadcastType(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#12121a] border border-white/10 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none cursor-pointer"
                      >
                        <option value="lightning">⚡ Lightning Cyber</option>
                        <option value="info">ℹ️ System Info</option>
                        <option value="warning">⚠️ Warning Notice</option>
                        <option value="critical">🚨 Critical Security</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Broadcast Message Content
                    </label>
                    <textarea
                      rows={2}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Write your network-wide alert or message here..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!broadcastTitle.trim() || !broadcastMessage.trim()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-black font-bold font-mono text-xs hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>DISPATCH BROADCAST</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Quick Network Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold font-display text-white">Allow Public Registration</h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      Enable or lock new operative account creations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleRegistration}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      settings.allowNewRegistrations
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {settings.allowNewRegistrations ? 'ALLOWED' : 'LOCKED'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold font-display text-white">System Maintenance Shield</h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      Toggle high-voltage system maintenance mode.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleMaintenance}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      settings.maintenanceMode
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-700/40 text-slate-400 border border-slate-600'
                    }`}
                  >
                    {settings.maintenanceMode ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPERATIVES & USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search operatives by name, @username, email..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-[#12121a] border border-white/10 text-xs font-mono text-slate-300 focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Roles ({usersList.length})</option>
                    <option value="admin">Admins Only</option>
                    <option value="user">Standard Operatives</option>
                    <option value="banned">Restricted / Banned</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 text-black font-bold font-mono text-xs hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,243,255,0.3)] whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Operative</span>
                  </button>
                </div>
              </div>

              {/* Users Table / List */}
              <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        <th className="p-3.5 pl-4">Operative</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Joined</th>
                        <th className="p-3.5 text-right pr-4">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs font-mono">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">
                            No operatives found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const isAdmin = user.role === 'admin';
                          const isSelf = user.id === currentUser.id;

                          return (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3.5 pl-4 flex items-center gap-3">
                                <div className="relative">
                                  <img
                                    src={user.avatar}
                                    alt={user.fullName}
                                    className="w-9 h-9 rounded-xl object-cover border border-white/10"
                                    referrerPolicy="no-referrer"
                                  />
                                  {user.isBanned && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border border-black flex items-center justify-center text-[8px] text-white font-bold">
                                      ✕
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{user.fullName}</span>
                                    {isSelf && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                    <span className="text-cyan-400">@{user.username}</span>
                                    <span>•</span>
                                    <span>{user.email}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    isAdmin
                                      ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40'
                                      : 'bg-slate-700/30 text-slate-300 border-slate-600'
                                  }`}
                                >
                                  {isAdmin ? '👑 ADMIN' : 'OPERATIVE'}
                                </span>
                              </td>

                              <td className="p-3.5">
                                {user.isBanned ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                                    ⛔ BANNED
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Active
                                  </span>
                                )}
                              </td>

                              <td className="p-3.5 text-[10px] text-slate-400">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>

                              <td className="p-3.5 pr-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Toggle Admin */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAdmin(user)}
                                    disabled={isSelf}
                                    title={isAdmin ? 'Demote to Operative' : 'Promote to Admin'}
                                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                      isAdmin
                                        ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30 hover:bg-fuchsia-500/20'
                                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                                    } disabled:opacity-30`}
                                  >
                                    <Shield className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Toggle Ban */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBan(user)}
                                    disabled={isSelf}
                                    title={user.isBanned ? 'Unban Operative' : 'Ban Operative'}
                                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                      user.isBanned
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                                        : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                    } disabled:opacity-30`}
                                  >
                                    {user.isBanned ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Edit Profile */}
                                  <button
                                    type="button"
                                    onClick={() => setEditingUser(user)}
                                    title="Edit Profile"
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 border border-white/10 transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete User */}
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteTarget({ type: 'user', id: user.id, name: user.fullName })}
                                    disabled={isSelf}
                                    title="Permanently Delete User"
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-950/50 text-slate-400 hover:text-red-400 border border-white/10 transition-colors cursor-pointer disabled:opacity-30"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHANNELS & CHATS */}
          {activeTab === 'chats' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative w-full max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder="Search channels or participants..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewChannelModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 text-black font-bold font-mono text-xs hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,243,255,0.3)] whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create Official Channel</span>
                </button>
              </div>

              {/* Chats List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredChats.map((chat) => {
                  const msgs = kaminariBackend.getMessages(chat.id);
                  const isGroup = chat.isGroup;

                  return (
                    <div
                      key={chat.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:border-cyan-500/30 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-400/40 p-1 flex items-center justify-center overflow-hidden">
                              {chat.avatar ? (
                                <img
                                  src={chat.avatar}
                                  alt={chat.name || 'Chat'}
                                  className="w-full h-full object-cover rounded-lg"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <MessageSquare className="w-5 h-5 text-cyan-400" />
                              )}
                            </div>

                            <div>
                              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                <span>{chat.name || 'Direct Encrypted Link'}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${
                                  isGroup
                                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                    : 'bg-slate-700/30 text-slate-300 border-slate-600'
                                }`}>
                                  {isGroup ? 'GROUP' : 'DIRECT DM'}
                                </span>
                              </div>
                              <p className="text-[11px] font-mono text-slate-400 mt-0.5 line-clamp-1">
                                {chat.description || `${chat.participants.length} Operatives connected`}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center gap-3">
                          <span>📦 {msgs.length} messages</span>
                          <span>👥 {chat.participants.length} participants</span>
                          <span>🕒 {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={async () => {
                            await kaminariBackend.clearAllChatHistory(chat.id);
                            refreshAll();
                            showToast(`Purged all ${msgs.length} messages from this channel.`);
                          }}
                          className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Purge History</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingChat(chat)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 border border-white/10 transition-colors cursor-pointer"
                            title="Edit Channel Settings"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTarget({ type: 'chat', id: chat.id, name: chat.name || 'Chat' })}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-950/50 text-slate-400 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
                            title="Delete Channel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: STORIES MODERATION */}
          {activeTab === 'stories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-display text-white">24-Hour Ephemeral Stories Relay</h3>
                  <p className="text-xs font-mono text-slate-400">
                    Review and moderate live media uploads across the network.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                  {storiesList.length} Active Stories
                </span>
              </div>

              {storiesList.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-white/5 rounded-2xl border border-white/10">
                  <Sparkles className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-mono">No active 24h stories currently posted on the grid.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storiesList.map((story) => (
                    <div
                      key={story.id}
                      className="rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex flex-col justify-between"
                    >
                      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                        {story.mediaType === 'video' ? (
                          <video
                            src={story.mediaUrl}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={story.mediaUrl}
                            alt="Story preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                          <img
                            src={story.userAvatar}
                            alt={story.username}
                            className="w-4 h-4 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[10px] font-mono text-white">@{story.username}</span>
                        </div>
                      </div>

                      <div className="p-3.5">
                        <p className="text-xs font-sans text-slate-200 line-clamp-2">
                          {story.caption || '⚡ Visual transmission story'}
                        </p>
                        <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                          <span>👁️ {story.viewers.length} views</span>
                          <span>❤️ {story.likes.length} likes</span>
                          <span>Expires: {new Date(story.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white/5 border-t border-white/5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteTarget({ type: 'story', id: story.id, name: `Story by @${story.username}` })}
                          className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Story</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SECURITY & DATABASE CONTROLS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Admin Panel Password Configuration */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-fuchsia-950/30 to-cyan-950/20 border border-fuchsia-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-fuchsia-400" />
                  <h3 className="text-sm font-bold font-display text-white">
                    Admin Panel Master Password Configuration
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                    MASTER KEY
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mb-4">
                  Set the master clearance password required to unlock and open this Admin Control Center.
                </p>

                <form onSubmit={handleUpdateAdminPassword} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter new admin password (default: admin69)..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-fuchsia-500/30 text-fuchsia-300 font-mono text-xs focus:border-fuchsia-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-black font-bold font-mono text-xs hover:brightness-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(217,70,239,0.3)] whitespace-nowrap"
                  >
                    Save Admin Password
                  </button>
                </form>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-2">
                  <span>Current Default: <span className="text-fuchsia-400 font-bold">admin69</span></span>
                  <span>•</span>
                  <span>Stored instantly in system configuration</span>
                </div>
              </div>

              {/* Access Passcode Configuration */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold font-display text-white">
                    Access Gate Passcode Configuration
                  </h3>
                </div>
                <p className="text-xs font-mono text-slate-400 mb-4">
                  Set the secret security passcode operatives must type to enter Kaminari Chat.
                </p>

                <form onSubmit={handleUpdatePasscode} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    placeholder="Enter new access passcode..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-cyan-300 font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-bold font-mono text-xs hover:brightness-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.3)] whitespace-nowrap"
                  >
                    Save Passcode
                  </button>
                </form>
                <span className="text-[10px] font-mono text-slate-500 mt-2 block">
                  Default: <span className="text-cyan-400">kaminari69</span> (Also accepts custom code entered above)
                </span>
              </div>

              {/* Database & Local Cache Management */}
              <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="text-sm font-bold font-display text-white">
                    Nuclear Database & Factory Reset
                  </h3>
                </div>
                <p className="text-xs font-mono text-slate-400 mb-4">
                  Wipes all local accounts, messages, active chats, and stories back to fresh clean state.
                </p>

                <button
                  type="button"
                  onClick={() => setConfirmDeleteTarget({ type: 'all', name: 'ALL CHATS, MESSAGES & USERS' })}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-xs transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>RESET ENTIRE APP & CACHE</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL: Edit Operative Profile */}
        <AnimatePresence>
          {editingUser && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="w-full max-w-md bg-[#12121a] border border-cyan-400/40 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,243,255,0.3)] text-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold font-display text-white">Edit Operative Profile</h3>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditUser} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editingUser.fullName}
                      onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Username</label>
                    <input
                      type="text"
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Email</label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Bio / Status</label>
                    <input
                      type="text"
                      value={editingUser.bio}
                      onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold hover:brightness-110"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: Provision New Operative */}
        <AnimatePresence>
          {showCreateUserModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="w-full max-w-md bg-[#12121a] border border-cyan-400/40 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,243,255,0.3)] text-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold font-display text-white">Provision New Operative</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g. Victor Stone"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. victor_cyborg"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. victor@kaminari.net"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">System Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0f0f17] border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="user">Standard Operative</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateUserModal(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold hover:brightness-110"
                    >
                      Provision Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: Create Official Channel */}
        <AnimatePresence>
          {showNewChannelModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="w-full max-w-md bg-[#12121a] border border-cyan-400/40 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,243,255,0.3)] text-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold font-display text-white">Create Official Network Channel</h3>
                  <button
                    type="button"
                    onClick={() => setShowNewChannelModal(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateOfficialChannel} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Channel Name</label>
                    <input
                      type="text"
                      required
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="e.g. ⚡ SECURITY ANNOUNCEMENTS"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Channel Description</label>
                    <input
                      type="text"
                      value={newChannelDesc}
                      onChange={(e) => setNewChannelDesc(e.target.value)}
                      placeholder="Description for operatives..."
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <p className="text-[10px] text-cyan-400">
                    * This channel will automatically invite all registered operatives.
                  </p>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowNewChannelModal(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold hover:brightness-110"
                    >
                      Launch Channel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: Confirmation Delete Target */}
        <AnimatePresence>
          {confirmDeleteTarget && (
            <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
              <div className="w-full max-w-sm bg-[#15121e] border border-red-500/50 rounded-3xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.3)] text-center text-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center mb-3">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold font-display text-white">CONFIRM DELETION</h3>
                <p className="text-xs font-mono text-slate-300 mt-2">
                  Are you sure you want to permanently delete{' '}
                  <span className="text-red-400 font-bold">"{confirmDeleteTarget.name}"</span>?
                </p>
                <p className="text-[10px] font-mono text-slate-500 mt-1">This operation cannot be undone.</p>

                <div className="flex items-center justify-center gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteTarget(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-mono hover:bg-white/20 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteDelete}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  >
                    Delete Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
