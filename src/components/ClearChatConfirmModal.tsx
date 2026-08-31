import React from 'react';
import { motion } from 'motion/react';
import { AlertOctagon, Trash2, X, ShieldAlert, ArrowLeft } from 'lucide-react';

interface ClearChatConfirmModalProps {
  chatName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ClearChatConfirmModal: React.FC<ClearChatConfirmModalProps> = ({
  chatName,
  onConfirm,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl bg-[#140c12]/95 border border-red-500/40 p-6 sm:p-7 shadow-[0_8px_40px_rgba(255,0,85,0.25)] text-center relative backdrop-blur-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 text-slate-400 hover:text-white p-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono group border border-transparent hover:border-white/10"
          title="Go Back"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">BACK</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/80 flex items-center justify-center mx-auto mb-4 text-red-400 shadow-[0_0_25px_rgba(255,0,85,0.4)] mt-4 sm:mt-2">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>

        <h3 className="text-xl font-display font-black text-white tracking-wide">
          CLEAR ALL CHAT HISTORY?
        </h3>

        <p className="text-xs font-mono text-red-200 mt-2 leading-relaxed">
          WARNING: You are about to initiate a global purge of all transmissions in{' '}
          <span className="text-white font-bold underline">"{chatName}"</span>.
        </p>

        <div className="my-4 p-3.5 rounded-2xl bg-red-950/40 border border-red-900/50 text-[11px] font-mono text-slate-300 text-left space-y-1.5">
          <div>• Purges all message records across Firestore for both parties.</div>
          <div>• Permanently wipes linked audio notes, videos, and media files.</div>
          <div>• Action is irreversible across the Kaminari grid.</div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer border border-white/10 flex items-center justify-center gap-1.5 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            BACK / CANCEL
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 hover:brightness-110 text-white text-xs font-mono font-bold transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] cursor-pointer flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            PURGE HISTORY
          </button>
        </div>
      </motion.div>
    </div>
  );
};
