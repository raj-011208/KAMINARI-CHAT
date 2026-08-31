import { User, Story, Chat, Message } from '../types';

export const CYBERPUNK_AVATARS = [
  {
    id: 'avatar_kaminari_mecha',
    name: 'Kaminari Lightning Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=KaminariVolt&backgroundColor=0d0d12,00f3ff',
    color: '#00f3ff',
  },
  {
    id: 'avatar_cyber_valkyrie',
    name: 'Cyber Valkyrie Cartoon',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CyberValkyrie&backgroundColor=13111c',
    color: '#9d00ff',
  },
  {
    id: 'avatar_quantum_mecha',
    name: 'Quantum Overclock Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=QuantumRaijin&backgroundColor=00f3ff,9d00ff',
    color: '#00f3ff',
  },
  {
    id: 'avatar_lorelei_cartoon',
    name: 'Neon Lorelei Cartoon',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=NeonCyberRose&backgroundColor=0d0d12',
    color: '#ff007f',
  },
  {
    id: 'avatar_storm_toon',
    name: 'Storm Operative Toon',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=StormRunner&backgroundColor=09090e',
    color: '#3b82f6',
  },
  {
    id: 'avatar_matrix_mech',
    name: 'Emerald Matrix Mech',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=EmeraldMatrix&backgroundColor=09090e,10b981',
    color: '#10b981',
  },
  {
    id: 'avatar_micah_cyber',
    name: 'Cyberpunk Micah',
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=SolarSpark&backgroundColor=1e1b4b',
    color: '#f59e0b',
  },
  {
    id: 'avatar_notionist_nyx',
    name: 'Shadow Nyx Avatar',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=ShadowNyx&backgroundColor=09090e',
    color: '#8b5cf6',
  },
];

export const INITIAL_MOCK_USERS: User[] = [];
export const INITIAL_MOCK_STORIES: Story[] = [];
export const INITIAL_MOCK_CHATS: Chat[] = [];
export const INITIAL_MOCK_MESSAGES: Record<string, Message[]> = {};
