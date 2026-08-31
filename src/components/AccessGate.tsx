import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ShieldAlert, KeyRound, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { kaminariBackend } from '../services/kaminariBackend';

interface AccessGateProps {
  onAccessGranted: () => void;
}

export const AccessGate: React.FC<AccessGateProps> = ({ onAccessGranted }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = kaminariBackend.verifyAccessCode(code);
    if (isValid) {
      setIsSuccess(true);
      setError(false);
      
      // Trigger electric cyan/purple confetti
      try {
        confetti({
          particleCount: 80,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#00f3ff', '#9d00ff', '#ffffff', '#38bdf8'],
        });
      } catch (err) {
        // ignore
      }

      setTimeout(() => {
        onAccessGranted();
      }, 700);
    } else {
      setError(true);
      setAttempts((prev) => prev + 1);
      setErrorMessage(
        `High-Voltage Defense Triggered! Invalid Passcode (${attempts + 1} failed ${
          attempts === 0 ? 'attempt' : 'attempts'
        }).`
      );
      
      // Auto-clear shake state after animation
      setTimeout(() => {
        setError(false);
      }, 1200);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md mx-auto p-6 sm:p-8 flex flex-col items-center justify-center">
      {/* Central Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: error ? [-12, 12, -10, 10, -6, 6, 0] : 0,
        }}
        transition={{ duration: error ? 0.5 : 0.6 }}
        className={`w-full rounded-3xl p-7 sm:p-8 backdrop-blur-xl border transition-all duration-300 ${
          error
            ? 'neon-glow-red bg-red-950/30 border-red-500'
            : isSuccess
            ? 'neon-border-cyan bg-cyan-950/30 border-cyan-400'
            : 'bg-[#12121a]/85 border-white/10 shadow-[0_8px_40px_rgba(0,243,255,0.15)]'
        }`}
      >
        {/* Header Icon & Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-cyan-400/50 shadow-[0_0_35px_rgba(0,243,255,0.4)] bg-[#0d0d12]">
              <img
                src="/kaminari-logo.jpg"
                alt="Kaminari Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Pulsing ring */}
            <div className="absolute -inset-1 rounded-2xl bg-cyan-500/20 blur-md -z-10 animate-ping opacity-40" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-400">
            KAMINARI CHAT
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono tracking-wide">
            RESTRICTED HIGH-VOLTAGE NETWORK
          </p>
        </div>

        {/* Security Alert Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
          <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            Please enter your designated access key to establish an encrypted handshake with the Kaminari grid.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                ACCESS PASSCODE
              </span>
              <span className="text-[10px] text-cyan-400/70 uppercase tracking-wider">
                ENCRYPTED GATEWAY
              </span>
            </label>

            <div className="relative">
              <input
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Enter access code..."
                autoFocus
                className={`w-full px-4 py-3 rounded-2xl bg-white/5 text-white font-mono text-sm tracking-widest outline-none border transition-all duration-200 ${
                  error
                    ? 'border-red-500 ring-2 ring-red-500/40 text-red-200'
                    : isSuccess
                    ? 'border-cyan-400 ring-2 ring-cyan-400/40 text-cyan-200'
                    : 'border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30'
                }`}
              />
            </div>
          </div>

          {/* Error Message with Red Glow Animation */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="p-3 rounded-2xl bg-red-950/80 border border-red-500/70 text-xs text-red-200 flex items-center gap-2 shadow-[0_0_15px_rgba(255,0,85,0.4)]"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span className="font-mono">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Banner */}
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-400/70 text-xs text-cyan-200 flex items-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.4)]"
              >
                <Zap className="w-4 h-4 text-cyan-300 shrink-0 animate-bounce" />
                <span className="font-mono font-semibold">
                  Access Code Verified! Decrypting Gateway...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!code.trim() || isSuccess}
            className={`w-full py-3.5 px-4 rounded-2xl font-display text-sm font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
              isSuccess
                ? 'bg-cyan-400 text-black shadow-cyan-400/50'
                : !code.trim()
                ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                : 'bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black font-extrabold shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSuccess ? (
              <>
                <Zap className="w-4 h-4" />
                UNLOCKED
              </>
            ) : (
              <>
                <span>VERIFY & UNLOCK</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security badge footer */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            GRID ACTIVE
          </span>
          <span className="text-slate-500 font-mono">ENCRYPTED PROTOCOL</span>
        </div>
      </motion.div>
    </div>
  );
};
