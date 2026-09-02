import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, PhoneOff, Video, Mic, Volume2 } from 'lucide-react';
import { CallSession } from '../types';
import { callSoundEffects } from '../services/callSoundEffects';

interface IncomingCallModalProps {
  call: CallSession;
  onAccept: (isVideo: boolean) => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onDecline,
}) => {
  // Start ringtone on mount, stop on unmount
  useEffect(() => {
    callSoundEffects.startIncomingRingtone();
    return () => {
      callSoundEffects.stopIncomingRingtone();
    };
  }, []);

  const handleAcceptAudio = () => {
    callSoundEffects.stopIncomingRingtone();
    callSoundEffects.playConnectedChime();
    onAccept(false);
  };

  const handleAcceptVideo = () => {
    callSoundEffects.stopIncomingRingtone();
    callSoundEffects.playConnectedChime();
    onAccept(true);
  };

  const handleDecline = () => {
    callSoundEffects.stopIncomingRingtone();
    callSoundEffects.playCallEndedChime();
    onDecline();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-sm rounded-3xl bg-[#14141f] border border-cyan-500/30 p-6 sm:p-8 flex flex-col items-center text-center shadow-[0_0_50px_rgba(0,243,255,0.25)] overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-cyan-500/20 to-transparent pointer-events-none" />

        {/* Pulsing Avatar Rings */}
        <div className="relative mb-6 mt-2">
          {/* Animated pulse rings */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-4 rounded-full border-2 border-cyan-400/40 pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            className="absolute -inset-8 rounded-full border border-cyan-500/20 pointer-events-none"
          />

          <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-[0_0_30px_rgba(0,243,255,0.4)]">
            <img
              src={call.callerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
              alt={call.callerName}
              className="w-full h-full rounded-full object-cover border-2 border-[#14141f]"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#14141f] flex items-center justify-center">
              <Volume2 className="w-3 h-3 text-black animate-pulse" />
            </span>
          </div>
        </div>

        {/* Caller Info */}
        <h3 className="text-xl font-bold text-white tracking-tight">
          {call.callerName}
        </h3>
        <p className="text-xs text-cyan-300 font-medium mt-1 flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full">
          {call.isVideo ? (
            <>
              <Video className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Incoming Video Call...</span>
            </>
          ) : (
            <>
              <Phone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Incoming Voice Call...</span>
            </>
          )}
        </p>

        {/* Action Controls */}
        <div className="mt-8 w-full flex items-center justify-center gap-4">
          {/* Decline Button */}
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)] group-hover:scale-110 transition-transform">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold">Decline</span>
          </button>

          {/* Accept Video Button (if video or choice) */}
          {call.isVideo ? (
            <button
              type="button"
              onClick={handleAcceptVideo}
              className="flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 hover:text-white transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.5)] group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold">Accept Video</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAcceptAudio}
              className="flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold">Accept Call</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
