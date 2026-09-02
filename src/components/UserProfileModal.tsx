import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, User as UserIcon, Camera, Upload, Check, Zap, Shield, Key, Sparkles, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { kaminariBackend } from '../services/kaminariBackend';
import { CYBERPUNK_AVATARS } from '../services/mockData';

interface UserProfileModalProps {
  currentUser: User;
  onClose: () => void;
  onProfileUpdated: (user: User) => void;
  onOpenAdmin?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  onClose,
  onProfileUpdated,
  onOpenAdmin,
}) => {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [bio, setBio] = useState(currentUser.bio);
  const [customStatus, setCustomStatus] = useState(currentUser.customStatus || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await kaminariBackend.updateProfile({
        fullName: fullName.trim(),
        bio: bio.trim(),
        customStatus: customStatus.trim(),
        avatar: selectedAvatar,
      });
      onProfileUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Update profile error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl bg-[#12121e]/95 border border-white/10 p-6 sm:p-7 shadow-[0_8px_40px_rgba(0,243,255,0.15)] backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold group"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] p-[2px] shadow-[0_0_20px_rgba(0,243,255,0.4)]">
              <div className="w-full h-full bg-[#0d0d12] rounded-[14px] flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Profile Settings
              </h3>
              <p className="text-xs text-slate-400">
                Update your name, bio, and avatar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {/* Avatar Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                Profile Picture
              </span>
              <label className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer hover:underline font-medium">
                <Upload className="w-3.5 h-3.5" />
                Upload New Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2.5 rounded-2xl bg-white/5 border border-white/10">
              {CYBERPUNK_AVATARS.map((av) => {
                const isSelected = selectedAvatar === av.url;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.url)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105 shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                        : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-cyan-300 drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white/5 text-white text-sm border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                disabled
                value={`@${currentUser.username}`}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/40 text-slate-400 text-sm border border-white/5 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Status Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Status Message
            </label>
            <input
              type="text"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              placeholder="e.g. Available, Busy, In a meeting"
              className="w-full px-4 py-2.5 rounded-2xl bg-white/5 text-white text-sm border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              About / Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others a bit about yourself"
              className="w-full px-4 py-2.5 rounded-2xl bg-white/5 text-white text-sm border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none resize-none"
            />
          </div>

          {/* Node Security Meta */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Account: <span className="text-fuchsia-400 font-bold">{currentUser.role === 'admin' ? 'Administrator' : 'Standard Member'}</span>
            </span>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/40 text-xs font-semibold cursor-pointer transition-colors"
              >
                Admin Panel
              </button>
            )}
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl text-sm font-bold bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Profile Saved</span>
              </>
            ) : loading ? (
              <span>Saving...</span>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
