import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface VoiceRecorderProps {
  onAudioRecorded: (blob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioRecorded,
  onCancel,
}) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(100);
      } catch (err) {
        console.warn('Microphone access denied or error:', err);
        onCancel();
      }
    }

    startRecording();

    const timer = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    return () => {
      active = false;
      clearInterval(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleStopAndSend = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onAudioRecorded(audioBlob, recordingTime || 1);
    };

    mediaRecorderRef.current.stop();
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-[#12121c]/90 border border-white/10 p-3 rounded-2xl backdrop-blur-xl shadow-[0_4px_20px_rgba(0,243,255,0.15)]">
      {/* Recording Indicator */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-400">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
        <span className="text-xs font-mono font-bold tracking-wider">
          REC {formatTime(recordingTime)}
        </span>
      </div>

      {/* Pulsing Audio Waveform simulation */}
      <div className="flex-1 flex items-center justify-center gap-1 h-6 overflow-hidden">
        {[40, 70, 95, 60, 85, 45, 100, 75, 50, 90, 65, 80, 40, 85].map((h, i) => (
          <motion.div
            key={i}
            animate={{ height: [`${h * 0.2}%`, `${h}%`, `${h * 0.3}%`] }}
            transition={{ repeat: Infinity, duration: 0.6 + (i % 3) * 0.2, ease: 'easeInOut' }}
            className="w-1 bg-cyan-400 rounded-full"
          />
        ))}
      </div>

      {/* Discard Button */}
      <button
        type="button"
        onClick={onCancel}
        className="p-2 rounded-xl bg-white/5 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/40 transition-colors cursor-pointer"
        title="Discard Recording"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Send Audio Button */}
      <button
        type="button"
        onClick={handleStopAndSend}
        className="p-2.5 rounded-xl bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black font-bold hover:brightness-110 hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,243,255,0.4)] cursor-pointer"
        title="Send Voice Message"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};
