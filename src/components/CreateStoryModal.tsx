import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Upload, Sparkles, Image, Video, Zap, ArrowRight, Check, ArrowLeft } from 'lucide-react';
import { kaminariBackend } from '../services/kaminariBackend';

interface CreateStoryModalProps {
  onClose: () => void;
  onStoryCreated: () => void;
}

const PRESET_STORY_BACKGROUNDS = [
  {
    name: 'Lightning Storm',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cyberpunk Neon Alley',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'High-Voltage Grid',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Electric Skyline',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Holographic Circuit',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
  },
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  onClose,
  onStoryCreated,
}) => {
  const [selectedMedia, setSelectedMedia] = useState<string>(PRESET_STORY_BACKGROUNDS[0].url);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVid = file.type.startsWith('video/');
      setMediaType(isVid ? 'video' : 'image');

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedMedia(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedia) return;

    setLoading(true);
    try {
      await kaminariBackend.createStory({
        mediaUrl: selectedMedia,
        mediaType,
        caption: caption.trim() || undefined,
      });
      onStoryCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create story', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl bg-[#12121c]/95 border border-white/10 p-4 sm:p-6 shadow-[0_8px_40px_rgba(0,243,255,0.15)] backdrop-blur-2xl"
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
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Add Story
              </h3>
              <p className="text-xs text-slate-400">
                Share a 24-hour photo or video update
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

        <form onSubmit={handlePublish} className="mt-5 space-y-4">
          {/* Media Preview Box */}
          <div className="relative aspect-video rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
            {mediaType === 'video' ? (
              <video
                src={selectedMedia}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={selectedMedia}
                alt="Story Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}

            {caption && (
              <div className="absolute bottom-3 inset-x-3 p-3 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 text-xs text-white">
                {caption}
              </div>
            )}
          </div>

          {/* Upload or Preset Chooser */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Choose Background
              </span>

              <label className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer hover:underline font-medium">
                <Upload className="w-3.5 h-3.5" />
                Upload Photo/Video
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {PRESET_STORY_BACKGROUNDS.map((bg) => {
                const isSelected = selectedMedia === bg.url;
                return (
                  <button
                    key={bg.name}
                    type="button"
                    onClick={() => {
                      setSelectedMedia(bg.url);
                      setMediaType('image');
                    }}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105 shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                        : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                    }`}
                    title={bg.name}
                  >
                    <img
                      src={bg.url}
                      alt={bg.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-cyan-500/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Caption (Optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption to your story..."
              className="w-full px-4 py-2.5 rounded-2xl bg-white/5 text-white text-sm border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl text-sm font-bold bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] hover:brightness-110 text-black shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <div className="flex items-center gap-2 font-medium">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Sharing Story...
              </div>
            ) : (
              <>
                <span>Share Story</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
