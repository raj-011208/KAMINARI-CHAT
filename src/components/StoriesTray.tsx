import React from 'react';
import { Plus, Zap } from 'lucide-react';
import { Story, User } from '../types';

interface StoriesTrayProps {
  currentUser: User;
  stories: Story[];
  onOpenStory: (storyIndex: number) => void;
  onOpenCreateStory: () => void;
}

export const StoriesTray: React.FC<StoriesTrayProps> = ({
  currentUser,
  stories,
  onOpenStory,
  onOpenCreateStory,
}) => {
  // Group stories by user so each user appears once in the tray with their latest story
  const userStoriesMap = new Map<string, Story[]>();
  stories.forEach((s) => {
    if (!userStoriesMap.has(s.userId)) {
      userStoriesMap.set(s.userId, []);
    }
    userStoriesMap.get(s.userId)!.push(s);
  });

  const uniqueUserStories: { user: { id: string; name: string; username: string; avatar: string }; stories: Story[]; hasUnviewed: boolean }[] = [];

  userStoriesMap.forEach((userStories, userId) => {
    const latest = userStories[0];
    const hasUnviewed = userStories.some((s) => !s.viewers.includes(currentUser.id));
    uniqueUserStories.push({
      user: {
        id: userId,
        name: latest.userFullName,
        username: latest.username,
        avatar: latest.userAvatar,
      },
      stories: userStories,
      hasUnviewed,
    });
  });

  const myStories = userStoriesMap.get(currentUser.id) || [];

  return (
    <div className="w-full px-4 py-3 border-b border-white/5 bg-black/10 backdrop-blur-md overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-3.5 min-w-max">
        {/* Current User: Add or View Story */}
        <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (myStories.length > 0) {
                  const idx = stories.findIndex((s) => s.userId === currentUser.id);
                  onOpenStory(idx !== -1 ? idx : 0);
                } else {
                  onOpenCreateStory();
                }
              }}
              className={`relative w-14 h-14 rounded-2xl p-[2px] transition-transform duration-200 group-hover:scale-105 ${
                myStories.length > 0
                  ? 'bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] shadow-[0_0_15px_rgba(0,243,255,0.35)]'
                  : 'bg-white/10'
              }`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.fullName}
                className="w-full h-full rounded-[14px] object-cover border border-[#0d0d12]"
                referrerPolicy="no-referrer"
              />
            </button>

            {/* Plus / Add Badge */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCreateStory();
              }}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-[#00f3ff] to-[#9d00ff] text-black flex items-center justify-center border-2 border-[#0d0d12] shadow-[0_0_10px_rgba(0,243,255,0.8)] hover:scale-110 transition-transform cursor-pointer"
              title="Add 24h Story"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
          <span className="text-[10px] font-mono text-slate-400 group-hover:text-cyan-300 truncate max-w-[64px]">
            {myStories.length > 0 ? 'Your Story' : 'Add Story'}
          </span>
        </div>

        {/* Stories of other users */}
        {uniqueUserStories
          .filter((item) => item.user.id !== currentUser.id)
          .map((item) => {
            const firstStoryIndex = stories.findIndex((s) => s.id === item.stories[0].id);
            return (
              <div
                key={item.user.id}
                onClick={() => onOpenStory(firstStoryIndex)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl p-[2px] transition-all duration-200 group-hover:scale-105 ${
                    item.hasUnviewed
                      ? 'bg-gradient-to-tr from-[#00f3ff] via-purple-500 to-[#9d00ff] shadow-[0_0_15px_rgba(0,243,255,0.4)] animate-pulse-lightning'
                      : 'bg-white/10 opacity-80 group-hover:opacity-100'
                  }`}
                >
                  <div className="w-full h-full rounded-[14px] border border-[#0d0d12] overflow-hidden">
                    <img
                      src={item.user.avatar}
                      alt={item.user.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-cyan-300 truncate max-w-[68px]">
                  @{item.user.username}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};
