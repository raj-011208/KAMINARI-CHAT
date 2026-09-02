import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MonitorOff,
  Maximize2,
  Minimize2,
  Zap,
  Volume2,
  Sparkles,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { CallSession, User } from '../types';
import { kaminariBackend } from '../services/kaminariBackend';

interface CallScreenProps {
  session: CallSession;
  currentUser: User;
  onEndCall: (durationSec?: number) => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  session,
  currentUser,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(!session.isVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected'>('connecting');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const isCaller = session.callerId === currentUser.id;
  const peerName = isCaller ? session.receiverName : session.callerName;
  const peerAvatar = isCaller ? session.receiverAvatar : session.callerAvatar;

  // Initialize Media Devices & Simulated/Real WebRTC
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: session.isVideo ? { width: 1280, height: 720 } : false,
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Simulate fast signaling handshake
        setTimeout(() => {
          if (active) {
            setConnectionStatus('connected');
          }
        }, 1500);
      } catch (err) {
        console.warn('Camera/Mic access not granted or unavailable:', err);
        // Still allow connected state with fallback avatar
        setTimeout(() => {
          if (active) setConnectionStatus('connected');
        }, 1200);
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [session.isVideo]);

  // Duration Timer
  useEffect(() => {
    if (connectionStatus !== 'connected') return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [connectionStatus]);

  // Toggle Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } catch (e) {
        console.warn('Screen share cancelled or failed', e);
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setIsScreenSharing(false);
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Minimized PiP View
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-3xl bg-[#10101a]/95 border border-white/10 shadow-[0_8px_30px_rgba(0,243,255,0.2)] backdrop-blur-2xl flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full electric-ring p-0.5">
            <img
              src={peerAvatar}
              alt={peerName}
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0d0d12] animate-pulse" />
        </div>

        <div>
          <div className="text-xs font-bold text-white truncate max-w-[100px]">
            {peerName}
          </div>
          <div className="text-[10px] font-mono text-cyan-400">
            {formatDuration(callDuration)}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
          title="Maximize Call"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onEndCall(callDuration)}
          className="p-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 hover:brightness-110 text-white transition-colors cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#07070c]/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden">
      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold group"
            title="Return to Chat (Picture-in-Picture)"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back to Chat</span>
          </button>

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] p-[2px] shadow-[0_0_20px_rgba(0,243,255,0.4)]">
            <div className="w-full h-full bg-[#0d0d12] rounded-[14px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{peerName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-300 font-medium">
                {session.isVideo ? 'Video Call' : 'Voice Call'}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {connectionStatus === 'connected'
                  ? `Connected • ${formatDuration(callDuration)}`
                  : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
          title="Minimize Call"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Video / Audio Visualizer Stage */}
      <div className="relative flex-1 w-full max-w-5xl mx-auto my-4 rounded-3xl bg-[#0d0d14] border border-white/10 overflow-hidden flex items-center justify-center shadow-[0_8px_50px_rgba(0,243,255,0.15)]">
        {/* Remote Participant View */}
        {session.isVideo ? (
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0e0e1a] to-[#08080f]">
            {/* Simulated Remote Video Feed with stylized cyberpunk camera feed */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <img
                src={peerAvatar}
                alt={peerName}
                className="w-full h-full object-cover opacity-60 filter blur-xs scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-transparent to-black/60" />

              {/* Central high-voltage avatar badge */}
              <div className="absolute flex flex-col items-center gap-4">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1 bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] shadow-[0_0_50px_rgba(0,243,255,0.5)]">
                  <img
                    src={peerAvatar}
                    alt={peerName}
                    className="w-full h-full rounded-full object-cover border-4 border-[#0d0d12]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white font-display">
                    {peerName}
                  </h3>
                  <p className="text-xs font-mono text-cyan-300">
                    60 FPS • 12ms Packet Transit
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Pure Audio Call Screen with Electric Wave Visualizer */
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {/* Electric avatar with rotating energy rings */}
            <div className="relative mb-6">
              <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full p-1.5 bg-gradient-to-tr from-[#00f3ff] via-[#9d00ff] to-[#ff007f] shadow-[0_0_60px_rgba(0,243,255,0.4)]">
                <img
                  src={peerAvatar}
                  alt={peerName}
                  className="w-full h-full rounded-full object-cover border-4 border-[#0d0d12]"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Multiple concentric pulsating electric waves */}
              <div className="absolute -inset-4 rounded-full border border-cyan-400/30 animate-ping opacity-30" />
              <div className="absolute -inset-10 rounded-full border border-purple-500/20 animate-pulse opacity-20" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">
              {peerName}
            </h3>
            <p className="text-sm text-cyan-400">
              {connectionStatus === 'connected'
                ? `Voice Call Connected`
                : 'Connecting audio...'}
            </p>

            {/* Audio Waveform Bar Animation */}
            <div className="flex items-center gap-1.5 mt-8 h-8">
              {[40, 75, 90, 50, 100, 60, 85, 45, 95, 30, 80, 65, 90].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: connectionStatus === 'connected' ? [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`] : '20%' }}
                  transition={{ repeat: Infinity, duration: 0.8 + (i % 4) * 0.2, ease: 'easeInOut' }}
                  className="w-1.5 bg-gradient-to-t from-[#00f3ff] to-[#9d00ff] rounded-full"
                />
              ))}
            </div>
          </div>
        )}

        {/* Local Stream PIP Thumbnail (in bottom corner) */}
        {session.isVideo && (
          <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-video rounded-2xl bg-[#09090f] border border-white/20 overflow-hidden shadow-2xl z-20">
            {isVideoOff ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 p-2">
                <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                <span className="text-[10px] font-mono">Camera Off</span>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
              />
            )}
            <div className="absolute bottom-1.5 left-2 text-[9px] font-mono text-white/80 bg-black/60 px-1.5 py-0.5 rounded-lg border border-white/10">
              You
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="relative z-20 w-full max-w-xl mx-auto py-3 px-6 rounded-3xl bg-[#10101a]/90 backdrop-blur-2xl border border-white/10 flex items-center justify-around shadow-2xl">
        {/* Mute Toggle */}
        <button
          type="button"
          onClick={toggleMute}
          className={`p-3.5 rounded-2xl transition-all duration-200 cursor-pointer ${
            isMuted
              ? 'bg-rose-900/40 text-rose-400 border border-rose-500 shadow-[0_0_15px_rgba(255,0,85,0.3)]'
              : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
          }`}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Camera Toggle */}
        {session.isVideo && (
          <button
            type="button"
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition-all duration-200 cursor-pointer ${
              isVideoOff
                ? 'bg-rose-900/40 text-rose-400 border border-rose-500 shadow-[0_0_15px_rgba(255,0,85,0.3)]'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
          </button>
        )}

        {/* Screen Sharing Toggle */}
        {session.isVideo && (
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-2xl transition-all duration-200 cursor-pointer ${
              isScreenSharing
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          >
            {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <MonitorUp className="w-6 h-6" />}
          </button>
        )}

        {/* End Call Button */}
        <button
          type="button"
          onClick={() => onEndCall(callDuration)}
          className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 hover:brightness-110 text-white shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
