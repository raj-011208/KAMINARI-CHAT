import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  User as UserIcon,
  AtSign,
  Mail,
  Lock,
  FileText,
  Camera,
  Upload,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
  LogIn,
  ArrowLeft,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { kaminariBackend } from '../services/kaminariBackend';
import { CYBERPUNK_AVATARS } from '../services/mockData';
import { User } from '../types';

interface AuthPortalProps {
  onSuccess: (user: User) => void;
  onLockGate?: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onSuccess, onLockGate }) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(CYBERPUNK_AVATARS[0].url);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [justRegisteredUser, setJustRegisteredUser] = useState<User | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle custom avatar upload
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCustomAvatarPreview(result);
        setSelectedAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }
    if (!username.trim()) {
      setErrorMessage('Please enter a Unique Username.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid Email address.');
      return;
    }

    setLoading(true);
    try {
      const user = await kaminariBackend.registerUser({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password || 'kaminari_pass_123',
        avatar: customAvatarPreview || selectedAvatar,
        bio: bio.trim() || '⚡ High-voltage operative on Kaminari Chat.',
        autoLogin: true,
      });

      // Show options after creating account: Login or Direct Enter
      setJustRegisteredUser(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() && !email.trim()) {
      setErrorMessage('Please enter your Username or Email.');
      return;
    }

    setLoading(true);
    try {
      const user = await kaminariBackend.loginUser(
        username.trim() || email.trim(),
        password
      );
      onSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Switch to login tab with pre-filled registered user details
  const handleSwitchToLoginWithUser = (user: User) => {
    setUsername(user.username);
    setEmail(user.email);
    setJustRegisteredUser(null);
    setMode('login');
    setErrorMessage('');
  };

  // Reset local user database
  const handleResetLocalData = () => {
    kaminariBackend.resetAllLocalData();
    setShowResetConfirm(false);
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setBio('');
    setJustRegisteredUser(null);
    setErrorMessage('Account cache cleared. You can now register or log in anew.');
  };

  return (
    <div className="relative z-10 w-full max-w-xl mx-auto p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-[#101018]/90 border border-white/10 shadow-[0_8px_40px_rgba(0,243,255,0.15)]"
      >
        {/* Top Back Navigation */}
        {onLockGate && (
          <div className="mb-4">
            <button
              type="button"
              onClick={onLockGate}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-cyan-400" />
              <span>Back to Passcode Screen</span>
            </button>
          </div>
        )}

        {/* Header with Title and Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-white/5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-cyan-400/50 shadow-[0_0_20px_rgba(0,243,255,0.4)] bg-[#0d0d12]">
              <img
                src="/kaminari-logo.jpg"
                alt="Kaminari Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-wide flex items-center gap-2">
                KAMINARI <span className="text-cyan-400">CHAT</span>
              </h2>
              <p className="text-xs text-slate-300">
                {mode === 'register' ? 'Create a free account' : 'Sign in to your account'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
                setJustRegisteredUser(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setJustRegisteredUser(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-tr from-[#9d00ff] to-[#00f3ff] text-black shadow-[0_0_15px_rgba(157,0,255,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Error / Info Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-200 flex items-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.15)]">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Modal / Card After Creating Account */}
        <AnimatePresence>
          {justRegisteredUser && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6 p-6 rounded-3xl bg-gradient-to-b from-[#141424] to-[#0b0b14] border border-cyan-400/40 shadow-[0_0_30px_rgba(0,243,255,0.2)] text-center"
            >
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                <CheckCircle2 className="w-8 h-8 text-cyan-300" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                Account Created Successfully!
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Welcome, <span className="text-cyan-400 font-bold">{justRegisteredUser.fullName}</span> (@{justRegisteredUser.username})
              </p>

              {/* Action Buttons: Log in vs Direct Enter */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSwitchToLoginWithUser(justRegisteredUser)}
                  className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-cyan-400/40 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <LogIn className="w-4 h-4 text-cyan-400" />
                  <span>Sign In Manually</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSuccess(justRegisteredUser)}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black text-xs font-extrabold shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Chatting Directly</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Body (when not showing post-register card) */}
        {!justRegisteredUser && (
          <>
            {mode === 'register' ? (
              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                {/* Avatar Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      Choose Profile Picture
                    </span>
                    <label className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFile}
                        className="hidden"
                      />
                    </label>
                  </label>

                  {/* Avatar Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    {CYBERPUNK_AVATARS.map((av) => {
                      const isSelected = selectedAvatar === av.url && !customAvatarPreview;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => {
                            setSelectedAvatar(av.url);
                            setCustomAvatarPreview(null);
                          }}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group cursor-pointer ${
                            isSelected
                              ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105 shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                              : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                          }`}
                          title={av.name}
                        >
                          <img
                            src={av.url}
                            alt={av.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                              <Check className="w-4 h-4 text-cyan-300 drop-shadow-md" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {customAvatarPreview && (
                    <div className="mt-2 flex items-center gap-3 p-2.5 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl">
                      <img
                        src={customAvatarPreview}
                        alt="Custom Upload"
                        className="w-10 h-10 rounded-xl object-cover border border-cyan-400"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs text-cyan-300">
                        Custom photo attached
                      </span>
                    </div>
                  )}
                </div>

                {/* Name and Username Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 text-white text-sm border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <AtSign className="w-3.5 h-3.5 text-cyan-400" />
                      Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '_').toLowerCase())}
                        placeholder="e.g. johndoe"
                        className="w-full pl-8 pr-4 py-3 rounded-2xl bg-white/5 text-white text-sm font-mono border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none transition-all"
                      />
                      <span className="absolute left-3 top-3 text-slate-500 font-mono text-sm">
                        @
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email and Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 text-white text-sm border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      Password (optional)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password..."
                      className="w-full px-4 py-3 rounded-2xl bg-white/5 text-white text-sm font-mono border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    Status / About You
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Available to chat..."
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 text-white text-sm border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none transition-all"
                  />
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 rounded-2xl text-sm font-bold bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] hover:brightness-110 text-black font-extrabold shadow-[0_0_20px_rgba(0,243,255,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </div>
                  ) : (
                    <>
                      <span>Create Account & Start Chatting</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switcher Link to Login */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className="text-xs text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Already have an account?</span>
                    <span className="text-cyan-400 font-bold underline">Sign In →</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-purple-400" />
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username or email..."
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 text-white text-sm border border-white/10 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password..."
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 text-white text-sm font-mono border border-white/10 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 rounded-2xl text-sm font-bold bg-gradient-to-tr from-[#9d00ff] to-[#00f3ff] hover:brightness-110 text-black font-extrabold shadow-[0_0_20px_rgba(157,0,255,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </div>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>

                {/* Switcher to Register */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage('');
                    }}
                    className="text-xs text-slate-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Need an account?</span>
                    <span className="text-purple-400 font-bold underline">Create One Now →</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Reset Accounts Confirmation Dialog */}
        {showResetConfirm ? (
          <div className="mt-4 p-3 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-center">
            <p className="text-xs text-rose-200 mb-2">
              Clear saved accounts and start fresh?
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleResetLocalData}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Yes, Reset All
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Reset Saved Data</span>
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/5">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            End-to-End Encrypted
          </span>
          {onLockGate && (
            <button
              type="button"
              onClick={onLockGate}
              className="text-slate-400 hover:text-cyan-300 hover:underline cursor-pointer"
            >
              🔒 Lock Screen
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
