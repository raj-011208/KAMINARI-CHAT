import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Zap } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  duration?: number;
  isSelf?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  duration = 5,
  isSelf = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = speed;
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.warn(e));
    }
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (sec: number) => {
    const s = Math.floor(sec % 60);
    const m = Math.floor(sec / 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const maxDuration = audioRef.current?.duration || duration || 5;
  const progressPercent = Math.min(100, (currentTime / (maxDuration || 1)) * 100);

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl min-w-[220px] sm:min-w-[260px] border backdrop-blur-md ${
      isSelf
        ? 'bg-white/10 border-white/20 text-cyan-200 shadow-[0_4px_20px_rgba(0,243,255,0.15)]'
        : 'bg-white/5 border-white/10 text-slate-200'
    }`}>
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-md ${
          isSelf
            ? 'bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black hover:brightness-110'
            : 'bg-gradient-to-tr from-[#9d00ff] to-[#00f3ff] text-black hover:brightness-110'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform Bar & Progress */}
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <div className="relative h-5 flex items-center gap-0.5 overflow-hidden">
          {[30, 60, 90, 40, 100, 75, 45, 85, 60, 95, 35, 70, 90, 50, 80, 40].map((h, i) => {
            const barPos = (i / 16) * 100;
            const isPassed = barPos <= progressPercent;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-colors duration-100"
                style={{
                  height: `${h}%`,
                  backgroundColor: isPassed
                    ? isSelf ? '#00f3ff' : '#c084fc'
                    : 'rgba(255, 255, 255, 0.2)',
                }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(maxDuration)}</span>
        </div>
      </div>

      {/* Speed Multiplier Badge */}
      <button
        type="button"
        onClick={cycleSpeed}
        className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
        title="Playback Speed"
      >
        {speed}x
      </button>
    </div>
  );
};
