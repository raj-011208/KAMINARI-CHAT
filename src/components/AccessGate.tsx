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
      
      // Trigger festive celebration confetti
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
        `Incorrect passcode. Please try again (Attempt ${attempts + 1}).`
      );
      
      // Auto-clear shake state after animation
      setTimeout(() => {
        setError(false);
      }, 1200);
    }
  };

  return (
    <div className="relative z-10 w-full min-h-[100dvh] sm:min-h-0 sm:max-w-md mx-auto p-4 sm:p-6 flex flex-col items-center justify-center">
      {/* Central Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: error ? [-12, 12, -10, 10, -6, 6, 0] : 0,
        }}
        transition={{ duration: error ? 0.5 : 0.6 }}
        className={`w-full rounded-3xl p-6 sm:p-8 backdrop-blur-xl border transition-all duration-300 ${
          error
            ? 'neon-glow-red bg-red-950/30 border-red-500'
            : isSuccess
            ? 'neon-border-cyan bg-cyan-950/30 border-cyan-400'
            : 'bg-[#12121a]/95 border-white/10 shadow-[0_8px_40px_rgba(0,243,255,0.15)]'
        }`}
      >
        {/* Header Icon & Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(0,243,255,0.4)] bg-[#0d0d12]">
              <img
                src="/kaminari-logo.jpg"
                alt="Kaminari Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-white">
            Kaminari Chat
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simple, Fast & Secure Messaging
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                Security Passcode
              </span>
              <span className="text-xs text-cyan-400 font-mono">
                Default: kaminari69
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
                placeholder="Enter passcode..."
                autoFocus
                className={`w-full px-4 py-3.5 rounded-2xl bg-white/5 text-white text-sm outline-none border transition-all duration-200 ${
                  error
                    ? 'border-red-500 ring-2 ring-red-500/40 text-red-200'
                    : isSuccess
                    ? 'border-cyan-400 ring-2 ring-cyan-400/40 text-cyan-200'
                    : 'border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30'
                }`}
              />
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-rose-400 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-500/30"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick autofill button */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() => setCode('kaminari69')}
              className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Fill default passcode (kaminari69)
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!code.trim() || isSuccess}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#00f3ff] via-cyan-400 to-[#9d00ff] text-black font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(0,243,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-black animate-bounce" />
                <span>Opening Messenger...</span>
              </>
            ) : (
              <>
                <span>Enter Messenger</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            End-to-End Encrypted
          </span>
          <span className="text-slate-400 text-xs">Kaminari</span>
        </div>
      </motion.div>
    </div>
  );
};
