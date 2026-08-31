import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Heart, Send, Zap, Eye, Clock, ArrowLeft } from 'lucide-react';
import { Story, User } from '../types';
import { kaminariBackend } from '../services/kaminariBackend';

interface StoriesModalProps {
  stories: Story[];
  initialIndex: number;
  currentUser: User;
  onClose: () => void;
  onReplyToStory: (recipientId: string, replyText: string) => void;
}

export const StoriesModal: React.FC<StoriesModalProps> = ({
  stories,
  initialIndex,
  currentUser,
  onClose,
  onReplyToStory,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  const currentStory = stories[currentIndex];
  const isLiked = currentStory?.likes?.includes(currentUser.id);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory) {
      kaminariBackend.viewStory(currentStory.id);
    }
  }, [currentIndex, currentStory]);

  // Progress timer for auto-advance (5s)
  useEffect(() => {
    if (isPaused || !currentStory) return;

    const interval = 50; // update every 50ms
    const totalDuration = 5000;
    const step = (interval / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, currentStory]);

  const handleNext = () => {
    setProgress(0);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleLike = () => {
    if (!currentStory) return;
    kaminariBackend.toggleLikeStory(currentStory.id);
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentStory) return;

    onReplyToStory(
      currentStory.userId,
      `💬 Replied to your story: "${currentStory.caption || '⚡ Story photo'}":\n${replyText.trim()}`
    );
    setReplyText('');
    onClose();
  };

  if (!currentStory) return null;

  // Calculate hours remaining
  const hoursLeft = Math.max(
    1,
    Math.round((currentStory.expiresAt - Date.now()) / (1000 * 60 * 60))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 sm:p-4 select-none">
      {/* Container simulating high-end mobile story canvas */}
      <div
        className="relative w-full max-w-md h-full sm:h-[88vh] bg-[#0c0c14] sm:rounded-3xl overflow-hidden shadow-[0_8px_50px_rgba(0,243,255,0.25)] border border-white/10 flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Progress Segment Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
          {stories.map((story, idx) => {
            let fill = 0;
            if (idx < currentIndex) fill = 100;
            else if (idx === currentIndex) fill = progress;

            return (
              <div
                key={story.id}
                className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm"
              >
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-75"
                  style={{ width: `${fill}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Top Story Header: User Info & Close */}
        <div className="absolute top-6 inset-x-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer flex items-center gap-1 text-xs font-mono group"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">BACK</span>
            </button>
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] shadow-[0_0_15px_rgba(0,243,255,0.5)]">
              <img
                src={currentStory.userAvatar}
                alt={currentStory.username}
                className="w-10 h-10 rounded-full object-cover border border-[#0d0d12]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5 drop-shadow-md">
                <span>{currentStory.userFullName}</span>
                <span className="text-[11px] font-mono text-cyan-300 font-normal">
                  @{currentStory.username}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{hoursLeft}h left (24h story)</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-transform active:scale-95 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Canvas */}
        <div className="relative flex-1 w-full h-full bg-[#08080d] flex items-center justify-center overflow-hidden">
          {currentStory.mediaType === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              muted
              playsInline
              loop
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt={currentStory.caption || 'Story media'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}

          {/* Left/Right Tap Zones for Navigation */}
          <div
            onClick={handlePrev}
            className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-pointer"
            title="Previous Story"
          />
          <div
            onClick={handleNext}
            className="absolute right-0 inset-y-0 w-1/3 z-20 cursor-pointer"
            title="Next Story"
          />

          {/* Caption Overlay */}
          {currentStory.caption && (
            <div className="absolute bottom-20 inset-x-4 z-25 p-3.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-sm text-slate-100 font-sans shadow-lg">
              {currentStory.caption}
            </div>
          )}

          {/* Floating Heart/Lightning Burst Animation */}
          <AnimatePresence>
            {showHeartBurst && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.4, 1.2], opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
              >
                <div className="p-6 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-400 shadow-[0_0_50px_rgba(0,243,255,0.8)]">
                  <Zap className="w-16 h-16 text-cyan-300 fill-cyan-300 animate-pulse" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Action / Reply Bar */}
        <div className="relative z-30 p-3.5 bg-black/85 backdrop-blur-xl border-t border-white/5 flex items-center gap-2">
          {currentStory.userId !== currentUser.id ? (
            <form onSubmit={handleSendReply} className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to @${currentStory.username}...`}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 text-sm text-white border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black hover:brightness-110 disabled:opacity-40 transition-transform active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex-1 flex items-center gap-4 text-xs font-mono text-slate-400 px-2">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Eye className="w-4 h-4" />
                {currentStory.viewers.length} views
              </span>
              <span className="flex items-center gap-1.5 text-pink-400">
                <Heart className="w-4 h-4 fill-pink-500" />
                {currentStory.likes.length} likes
              </span>
            </div>
          )}

          {/* Like Button */}
          <button
            type="button"
            onClick={handleLike}
            className={`p-2.5 rounded-2xl backdrop-blur-md border transition-transform active:scale-90 cursor-pointer ${
              isLiked
                ? 'bg-pink-500/20 border-pink-500 text-pink-400 shadow-[0_0_15px_rgba(255,0,127,0.5)]'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-pink-500' : ''}`} />
          </button>
        </div>

        {/* Previous / Next Chevron Buttons for desktop */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="hidden sm:flex absolute -left-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center border border-white/20 transition-transform hover:scale-110 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {currentIndex < stories.length - 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="hidden sm:flex absolute -right-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center border border-white/20 transition-transform hover:scale-110 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};
