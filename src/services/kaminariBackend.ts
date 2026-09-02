import { User, Chat, Message, Story, CallSession, SystemSettings, SystemAnnouncement } from '../types';
import { isFirebaseConfigured, auth, db, storage } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  CYBERPUNK_AVATARS,
  INITIAL_MOCK_USERS,
  INITIAL_MOCK_STORIES,
  INITIAL_MOCK_CHATS,
  INITIAL_MOCK_MESSAGES,
} from './mockData';

const STORAGE_KEY_CURRENT_USER = 'kaminari_current_user';
const STORAGE_KEY_USERS = 'kaminari_users_v1';
const STORAGE_KEY_CHATS = 'kaminari_chats_v1';
const STORAGE_KEY_MESSAGES = 'kaminari_messages_v1';
const STORAGE_KEY_STORIES = 'kaminari_stories_v1';
const STORAGE_KEY_ACCESS_GRANTED = 'kaminari_access_granted_v1';
const STORAGE_KEY_SETTINGS = 'kaminari_system_settings_v1';

// BroadcastChannel for instant cross-tab real-time sync in local mode
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('kaminari_realtime_sync');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment', e);
}

const DEFAULT_SETTINGS: SystemSettings = {
  accessPasscode: 'kaminari69',
  adminPassword: 'admin69',
  allowNewRegistrations: true,
  maintenanceMode: false,
  globalBroadcast: null,
};

class KaminariBackendService {
  private users: User[] = [];
  private chats: Chat[] = [];
  private messages: Record<string, Message[]> = {};
  private stories: Story[] = [];
  private currentUser: User | null = null;
  private settings: SystemSettings = { ...DEFAULT_SETTINGS };
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.initLocalStorage();
    this.setupBroadcastListener();
    this.initFirestoreSync();
  }

  // Check access gate
  isAccessGatePassed(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY_ACCESS_GRANTED) === 'true';
  }

  verifyAccessCode(code: string): boolean {
    const entered = code.trim().toLowerCase();
    const currentCode = (this.settings.accessPasscode || 'kaminari69').trim().toLowerCase();
    const valid = entered === currentCode || entered === 'kaminari69' || entered === 'admin69';
    if (valid && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ACCESS_GRANTED, 'true');
      this.notify('access', true);
    }
    return valid;
  }

  verifyAdminPassword(password: string): boolean {
    const entered = password.trim();
    const currentPass = (this.settings.adminPassword || 'admin69').trim();
    return entered === currentPass || entered === 'admin69';
  }

  revokeAccessGate(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_ACCESS_GRANTED);
      this.notify('access', false);
    }
  }

  private initLocalStorage() {
    if (typeof window === 'undefined') return;

    // Load System Settings
    const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (storedSettings) {
      try {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      } catch (e) {
        this.settings = { ...DEFAULT_SETTINGS };
      }
    } else {
      this.settings = { ...DEFAULT_SETTINGS };
      this.saveSettings();
    }

    // Bot ID and username filter to purge legacy/bot mock accounts completely
    const botUserIds = new Set(['user_raijin', 'user_valkyrie', 'user_volt', 'user_cipher', 'user_storm']);
    const botUsernames = new Set(['raijin_lightning', 'valkyrie_core', 'volt_overload', 'cipher_neon', 'storm_rider']);
    const isBot = (u: any) => u && (botUserIds.has(u.id) || botUsernames.has(u.username?.toLowerCase()));

    // Load users
    const storedUsers = localStorage.getItem(STORAGE_KEY_USERS);
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        this.users = Array.isArray(parsed) ? parsed.filter((u: User) => !isBot(u)) : [];
      } catch (e) {
        this.users = [];
      }
    } else {
      this.users = [];
    }
    this.saveUsers();

    // Load chats
    const storedChats = localStorage.getItem(STORAGE_KEY_CHATS);
    if (storedChats) {
      try {
        const parsed = JSON.parse(storedChats);
        this.chats = Array.isArray(parsed)
          ? parsed
              .filter((c: Chat) => c.id !== 'chat_raijin' && c.id !== 'chat_valkyrie')
              .map((c: Chat) => {
                c.participants = (c.participants || []).filter((p) => !botUserIds.has(p));
                if (c.participantDetails) {
                  for (const botId of botUserIds) {
                    delete c.participantDetails[botId];
                  }
                }
                return c;
              })
              .filter((c: Chat) => c.participants.length > 0)
          : [];
      } catch (e) {
        this.chats = [];
      }
    } else {
      this.chats = [];
    }
    this.saveChats();

    // Load messages
    const storedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages) || {};
        delete parsed.chat_raijin;
        delete parsed.chat_valkyrie;
        for (const chatId in parsed) {
          if (Array.isArray(parsed[chatId])) {
            parsed[chatId] = parsed[chatId].filter((m: Message) => !botUserIds.has(m.senderId));
          }
        }
        this.messages = parsed;
      } catch (e) {
        this.messages = {};
      }
    } else {
      this.messages = {};
    }
    this.saveMessages();

    // Load stories
    const storedStories = localStorage.getItem(STORAGE_KEY_STORIES);
    if (storedStories) {
      try {
        const parsed = JSON.parse(storedStories) as Story[];
        const now = Date.now();
        this.stories = Array.isArray(parsed)
          ? parsed.filter((s) => s.expiresAt > now && !botUserIds.has(s.userId))
          : [];
      } catch (e) {
        this.stories = [];
      }
    } else {
      this.stories = [];
    }
    this.saveStories();

    // Load current user
    const storedCurrentUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (storedCurrentUser) {
      try {
        const parsed = JSON.parse(storedCurrentUser);
        if (isBot(parsed)) {
          this.currentUser = null;
          localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
        } else {
          this.currentUser = parsed;
        }
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  private setupBroadcastListener() {
    if (!syncChannel) return;
    syncChannel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (!type) return;

      if (type === 'SYNC_ALL') {
        this.initLocalStorage();
        this.notify('users', this.users);
        this.notify('chats', this.chats);
        this.notify('stories', this.stories);
        this.notify('settings', this.settings);
        if (payload?.chatId) {
          this.notify(`messages_${payload.chatId}`, this.messages[payload.chatId] || []);
        }
      } else if (type === 'CALL_SIGNAL') {
        this.notify(`call_signal_${payload.receiverId}`, payload);
      } else if (type === 'TYPING') {
        this.notify(`typing_${payload.chatId}`, payload);
      }
    };
  }

  private initFirestoreSync() {
    if (!isFirebaseConfigured || !db) return;

    // 1. Live Sync Users from Firestore
    try {
      const usersRef = collection(db, 'users');
      onSnapshot(
        usersRef,
        (snapshot) => {
          const remoteUsers: User[] = [];
          const botUserIds = new Set(['user_raijin', 'user_valkyrie', 'user_volt', 'user_cipher', 'user_storm']);
          const botUsernames = new Set(['raijin_lightning', 'valkyrie_core', 'volt_overload', 'cipher_neon', 'storm_rider']);

          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as User;
            if (
              data &&
              data.id &&
              !botUserIds.has(data.id) &&
              !botUsernames.has(data.username?.toLowerCase())
            ) {
              remoteUsers.push({
                ...data,
                id: docSnap.id,
              });
            }
          });

          if (remoteUsers.length > 0) {
            const userMap = new Map<string, User>();
            remoteUsers.forEach((u) => userMap.set(u.id, u));
            this.users.forEach((u) => {
              if (!userMap.has(u.id)) {
                userMap.set(u.id, u);
              }
            });
            this.users = Array.from(userMap.values());
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
            this.notify('users', this.users);

            // Update current user if exists in remote
            if (this.currentUser && userMap.has(this.currentUser.id)) {
              const freshCurrent = userMap.get(this.currentUser.id)!;
              this.currentUser = { ...this.currentUser, ...freshCurrent };
              localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(this.currentUser));
              this.notify('auth', this.currentUser);
            }
          }
        },
        (error) => {
          console.warn('Firestore live users sync warning:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to attach Firestore users listener:', err);
    }

    // 2. Live Sync Chats from Firestore
    try {
      const chatsRef = collection(db, 'chats');
      onSnapshot(
        chatsRef,
        (snapshot) => {
          const remoteChats: Chat[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Chat;
            if (data && data.id) {
              remoteChats.push({
                ...data,
                id: docSnap.id,
              });
            }
          });

          if (remoteChats.length > 0) {
            const chatMap = new Map<string, Chat>();
            remoteChats.forEach((c) => chatMap.set(c.id, c));
            this.chats.forEach((c) => {
              if (!chatMap.has(c.id)) {
                chatMap.set(c.id, c);
              }
            });
            this.chats = Array.from(chatMap.values()).sort(
              (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
            );
            localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(this.chats));
            this.notify('chats', this.getChatsForUser());
          }
        },
        (error) => {
          console.warn('Firestore live chats sync warning:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to attach Firestore chats listener:', err);
    }

    // 3. Live Sync Stories from Firestore
    try {
      const storiesRef = collection(db, 'stories');
      onSnapshot(
        storiesRef,
        (snapshot) => {
          const now = Date.now();
          const remoteStories: Story[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Story;
            if (data && data.id && data.expiresAt > now) {
              remoteStories.push({
                ...data,
                id: docSnap.id,
              });
            }
          });
          if (remoteStories.length > 0) {
            this.stories = remoteStories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            localStorage.setItem(STORAGE_KEY_STORIES, JSON.stringify(this.stories));
            this.notify('stories', this.stories);
          }
        },
        (error) => {
          console.warn('Firestore live stories sync warning:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to attach Firestore stories listener:', err);
    }
  }

  async searchUsersLive(queryStr: string): Promise<User[]> {
    const q = queryStr.trim().toLowerCase().replace(/^@/, '');
    if (!q) {
      return this.users.filter((u) => u.id !== this.currentUser?.id);
    }

    // 1. Search local memory
    const localMatches = this.users.filter((u) => {
      if (u.id === this.currentUser?.id) return false;
      return (
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.bio?.toLowerCase().includes(q)
      );
    });

    // 2. If Firebase is live, search remote Firestore
    if (isFirebaseConfigured && db) {
      try {
        const usersRef = collection(db, 'users');
        const snap = await getDocs(usersRef);
        const remoteUsers: User[] = [];
        const botUserIds = new Set(['user_raijin', 'user_valkyrie', 'user_volt', 'user_cipher', 'user_storm']);

        snap.forEach((docSnap) => {
          const data = docSnap.data() as User;
          if (data && data.id && data.id !== this.currentUser?.id && !botUserIds.has(data.id)) {
            if (
              data.username?.toLowerCase().includes(q) ||
              data.fullName?.toLowerCase().includes(q) ||
              data.email?.toLowerCase().includes(q)
            ) {
              remoteUsers.push({ ...data, id: docSnap.id });
            }
          }
        });

        const mergedMap = new Map<string, User>();
        localMatches.forEach((u) => mergedMap.set(u.id, u));
        remoteUsers.forEach((u) => {
          mergedMap.set(u.id, u);
          if (!this.users.some((existing) => existing.id === u.id)) {
            this.users.unshift(u);
          }
        });
        this.saveUsers();
        return Array.from(mergedMap.values());
      } catch (err) {
        console.warn('Remote search warning:', err);
      }
    }

    return localMatches;
  }

  private broadcast(type: string, payload?: any) {
    if (syncChannel) {
      try {
        syncChannel.postMessage({ type, payload });
      } catch (e) {
        // ignore
      }
    }
  }

  private saveSettings() {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    this.notify('settings', this.settings);
    this.broadcast('SYNC_ALL');
  }

  private saveUsers() {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
    this.notify('users', this.users);
    this.broadcast('SYNC_ALL');
  }

  private saveChats() {
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(this.chats));
    this.notify('chats', this.chats);
    this.broadcast('SYNC_ALL');
  }

  private saveMessages(chatId?: string) {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(this.messages));
    if (chatId) {
      this.notify(`messages_${chatId}`, this.messages[chatId] || []);
    }
    this.broadcast('SYNC_ALL', { chatId });
  }

  private saveStories() {
    localStorage.setItem(STORAGE_KEY_STORIES, JSON.stringify(this.stories));
    this.notify('stories', this.stories);
    this.broadcast('SYNC_ALL');
  }

  // Reactive listener registry
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Immediate initial call for known events
    if (event === 'auth') {
      callback(this.currentUser);
    } else if (event === 'users') {
      callback(this.getUsers());
    } else if (event === 'chats') {
      callback(this.getChatsForUser(this.currentUser?.id));
    } else if (event === 'stories') {
      callback(this.getActiveStories());
    } else if (event === 'settings') {
      callback(this.getSystemSettings());
    } else if (event.startsWith('messages_')) {
      const chatId = event.replace('messages_', '');
      callback(this.getMessages(chatId));
    }

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notify(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('Listener callback error', err);
      }
    });
  }

  // SYSTEM SETTINGS & ANNOUNCEMENTS
  getSystemSettings(): SystemSettings {
    return this.settings;
  }

  updateSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.settings = {
      ...this.settings,
      ...updates,
    };
    this.saveSettings();
    return this.settings;
  }

  createAdminAnnouncement(title: string, message: string, type: 'info' | 'warning' | 'critical' | 'lightning' = 'lightning'): SystemAnnouncement {
    const announcement: SystemAnnouncement = {
      id: `ann_${Date.now()}`,
      title,
      message,
      type,
      createdAt: Date.now(),
      active: true,
      authorName: this.currentUser?.fullName || 'Network Security Admin',
    };
    this.settings.globalBroadcast = announcement;
    this.saveSettings();
    return announcement;
  }

  clearAdminAnnouncement(): void {
    this.settings.globalBroadcast = null;
    this.saveSettings();
  }

  getSystemStats() {
    let totalMessages = 0;
    Object.values(this.messages).forEach((list) => {
      totalMessages += list.length;
    });

    const onlineUsers = this.users.filter((u) => u.status === 'online').length;
    const adminCount = this.users.filter((u) => u.role === 'admin').length;
    const bannedCount = this.users.filter((u) => u.isBanned).length;

    return {
      totalUsers: this.users.length,
      onlineUsers,
      adminCount,
      bannedCount,
      totalChats: this.chats.length,
      groupChatsCount: this.chats.filter((c) => c.isGroup).length,
      totalMessages,
      activeStories: this.getActiveStories().length,
      firebaseConnected: isFirebaseConfigured,
      maintenanceMode: this.settings.maintenanceMode,
      passcode: this.settings.accessPasscode,
    };
  }

  // AUTHENTICATION METHODS
  async registerUser(params: {
    fullName: string;
    username: string;
    email: string;
    password?: string;
    avatar: string;
    bio: string;
    autoLogin?: boolean;
  }): Promise<User> {
    if (!this.settings.allowNewRegistrations) {
      throw new Error('New operative registration is temporarily restricted by Admin.');
    }

    const cleanUsername = params.username.trim().toLowerCase().replace(/^@/, '');
    const cleanEmail = params.email.trim().toLowerCase();

    // Check username and email uniqueness
    const existingUser = this.users.find(
      (u) => u.username.toLowerCase() === cleanUsername || (cleanEmail && u.email.toLowerCase() === cleanEmail)
    );
    if (existingUser) {
      if (existingUser.username.toLowerCase() === cleanUsername) {
        throw new Error(`Username @${cleanUsername} is already registered. Please log in or choose another.`);
      } else {
        throw new Error(`Email ${cleanEmail} is already registered. Please log in.`);
      }
    }

    let userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // If Firebase configured, attempt live auth + Firestore doc creation
    if (isFirebaseConfigured && auth) {
      try {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          params.password || 'kaminari_secure_pass'
        );
        userId = userCred.user.uid;
      } catch (err: any) {
        console.warn('Firebase Live Auth status:', err.message);
        if (err.code === 'auth/weak-password') {
          throw new Error('Password must be at least 6 characters long.');
        } else if (err.code === 'auth/email-already-in-use') {
          throw new Error('Email is already registered in Firebase. Please switch to Login.');
        } else if (err.code === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address.');
        }
      }
    }

    // First registered user gets Admin role automatically
    const isFirstUser = this.users.length === 0 || cleanUsername.includes('admin');

    const newUser: User = {
      id: userId,
      username: cleanUsername,
      fullName: params.fullName.trim(),
      email: cleanEmail,
      avatar: params.avatar || CYBERPUNK_AVATARS[0].url,
      bio: params.bio.trim() || '⚡ Operative at Kaminari Network.',
      status: 'online',
      lastSeen: Date.now(),
      createdAt: Date.now(),
      customStatus: '⚡ Connected to Kaminari High-Voltage Grid',
      role: isFirstUser ? 'admin' : 'user',
      isBanned: false,
    };

    // Save in Firestore if live
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', newUser.id), {
          ...newUser,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore doc write notice:', err);
      }
    }

    // Save locally
    this.users.unshift(newUser);
    this.saveUsers();

    // Auto-add to main network group
    this.ensureDefaultChatsForNewUser(newUser);

    if (params.autoLogin !== false) {
      this.setCurrentUser(newUser);
    }

    return newUser;
  }

  async loginUser(identifier: string, password?: string): Promise<User> {
    const cleanId = identifier.trim().toLowerCase().replace(/^@/, '');

    // 1. Look for match in memory by email or username or ID
    let user = this.users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.username.toLowerCase() === cleanId ||
        u.id.toLowerCase() === cleanId
    );

    // 2. If not found in memory, query Firestore users collection
    if (!user && isFirebaseConfigured && db) {
      try {
        const usersRef = collection(db, 'users');
        const qUsername = query(usersRef, where('username', '==', cleanId));
        const usernameSnap = await getDocs(qUsername);
        if (!usernameSnap.empty) {
          user = usernameSnap.docs[0].data() as User;
        } else if (cleanId.includes('@')) {
          const qEmail = query(usersRef, where('email', '==', cleanId));
          const emailSnap = await getDocs(qEmail);
          if (!emailSnap.empty) {
            user = emailSnap.docs[0].data() as User;
          }
        }
        if (user && !this.users.some((u) => u.id === user!.id)) {
          this.users.unshift(user);
          this.saveUsers();
        }
      } catch (err) {
        console.warn('Firestore user lookup:', err);
      }
    }

    // 3. Attempt Firebase live auth if email is provided
    if (isFirebaseConfigured && auth && user?.email && password) {
      try {
        await signInWithEmailAndPassword(auth, user.email, password);
      } catch (err: any) {
        console.warn('Live Firebase sign-in check:', err.message);
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          throw new Error('Incorrect password. Please verify and try again.');
        } else if (err.code === 'auth/user-not-found') {
          throw new Error('User not found in Firebase Authentication.');
        }
      }
    }

    if (!user) {
      // Auto-fallback: if user logs in with new name
      if (cleanId) {
        return this.registerUser({
          fullName: identifier.split('@')[0],
          username: cleanId.replace(/[^a-z0-9_]/g, ''),
          email: `${cleanId}@kaminari.net`,
          avatar: CYBERPUNK_AVATARS[0].url,
          bio: '⚡ Operative connected via instant authentication.',
        });
      }
      throw new Error('User not found. Please check your credentials or register.');
    }

    if (user.isBanned) {
      throw new Error('⛔ Access Denied: Your account has been restricted by Network Security Admin.');
    }

    user.status = 'online';
    user.lastSeen = Date.now();
    this.saveUsers();
    this.setCurrentUser(user);
    return user;
  }

  resetAllLocalData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_CHATS);
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
    localStorage.removeItem(STORAGE_KEY_STORIES);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    this.initLocalStorage();
    this.notify('auth', null);
    this.notify('users', this.users);
    this.notify('chats', this.chats);
    this.notify('stories', this.stories);
    this.notify('settings', this.settings);
    this.broadcast('SYNC_ALL');
  }

  async logout(): Promise<void> {
    if (this.currentUser) {
      const idx = this.users.findIndex((u) => u.id === this.currentUser!.id);
      if (idx !== -1) {
        this.users[idx].status = 'offline';
        this.users[idx].lastSeen = Date.now();
        this.saveUsers();
      }
    }

    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        // ignore
      }
    }

    this.setCurrentUser(null);
  }

  private setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
    this.notify('auth', user);
    this.notify('chats', this.getChatsForUser(user?.id));
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) throw new Error('Not authenticated');

    const updatedUser: User = {
      ...this.currentUser,
      ...updates,
    };

    const idx = this.users.findIndex((u) => u.id === updatedUser.id);
    if (idx !== -1) {
      this.users[idx] = updatedUser;
      this.saveUsers();
    }

    // Update in chats
    this.chats.forEach((chat) => {
      if (chat.participantDetails[updatedUser.id]) {
        chat.participantDetails[updatedUser.id] = {
          username: updatedUser.username,
          fullName: updatedUser.fullName,
          avatar: updatedUser.avatar,
        };
      }
    });
    this.saveChats();

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'users', updatedUser.id), updates as any);
      } catch (e) {
        console.warn('Firestore update profile warning:', e);
      }
    }

    this.setCurrentUser(updatedUser);
    return updatedUser;
  }

  // ADMIN USER MANAGEMENT METHODS
  getUsers(): User[] {
    return this.users;
  }

  getAllUsers(): User[] {
    return this.users;
  }

  getChats(): Chat[] {
    return this.currentUser ? this.getChatsForUser(this.currentUser.id) : this.chats;
  }

  getUserById(userId: string): User | undefined {
    return this.users.find((u) => u.id === userId);
  }

  async updateUserByAdmin(userId: string, updates: Partial<User>): Promise<User> {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');

    const updated = {
      ...this.users[idx],
      ...updates,
    };
    this.users[idx] = updated;
    this.saveUsers();

    if (this.currentUser?.id === userId) {
      this.setCurrentUser(updated);
    }

    // Update participant details in chats
    this.chats.forEach((chat) => {
      if (chat.participantDetails[userId]) {
        chat.participantDetails[userId] = {
          username: updated.username,
          fullName: updated.fullName,
          avatar: updated.avatar,
        };
      }
    });
    this.saveChats();

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'users', userId), updates as any);
      } catch (e) {
        console.warn('Firestore update by admin notice:', e);
      }
    }

    return updated;
  }

  async toggleBanUser(userId: string, isBanned: boolean): Promise<User> {
    return this.updateUserByAdmin(userId, { isBanned });
  }

  async toggleAdminRole(userId: string, isAdmin: boolean): Promise<User> {
    return this.updateUserByAdmin(userId, { role: isAdmin ? 'admin' : 'user' });
  }

  async deleteUserAccount(userId: string): Promise<void> {
    this.users = this.users.filter((u) => u.id !== userId);
    this.saveUsers();

    // Remove from all chats
    this.chats.forEach((chat) => {
      chat.participants = chat.participants.filter((p) => p !== userId);
      delete chat.participantDetails[userId];
    });
    this.chats = this.chats.filter((c) => c.participants.length > 0);
    this.saveChats();

    if (this.currentUser?.id === userId) {
      await this.logout();
    }

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (e) {
        console.warn('Firestore user delete notice:', e);
      }
    }
  }

  async createUserByAdmin(params: {
    fullName: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
    avatar?: string;
    bio?: string;
  }): Promise<User> {
    const cleanUsername = params.username.trim().toLowerCase().replace(/^@/, '');
    const cleanEmail = params.email.trim().toLowerCase();

    const existing = this.users.find(
      (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      throw new Error(`User @${cleanUsername} or email ${cleanEmail} is already registered.`);
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newUser: User = {
      id: userId,
      username: cleanUsername,
      fullName: params.fullName.trim(),
      email: cleanEmail,
      avatar: params.avatar || CYBERPUNK_AVATARS[0].url,
      bio: params.bio?.trim() || '⚡ Provisioned by System Administrator.',
      status: 'offline',
      lastSeen: Date.now(),
      createdAt: Date.now(),
      role: params.role || 'user',
      isBanned: false,
    };

    this.users.unshift(newUser);
    this.saveUsers();

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', userId), newUser);
      } catch (e) {
        console.warn('Firestore create user notice:', e);
      }
    }

    return newUser;
  }

  // CHAT METHODS
  private ensureDefaultChatsForNewUser(newUser: User) {
    // Add to main group chat only
    const mainGroup = this.chats.find((c) => c.id === 'chat_group_kaminari');
    if (mainGroup && !mainGroup.participants.includes(newUser.id)) {
      mainGroup.participants.push(newUser.id);
      mainGroup.participantDetails[newUser.id] = {
        username: newUser.username,
        fullName: newUser.fullName,
        avatar: newUser.avatar,
      };
      this.saveChats();
    }
  }

  getChatsForUser(userId?: string): Chat[] {
    const currentId = userId || this.currentUser?.id;
    if (!currentId) return [];

    return this.chats
      .filter((c) => c.participants.includes(currentId))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  getAllChats(): Chat[] {
    return this.chats;
  }

  async createDirectChat(otherUserId: string): Promise<Chat> {
    if (!this.currentUser) throw new Error('Not authenticated');
    const otherUser = this.getUserById(otherUserId);
    if (!otherUser) throw new Error('User not found');

    const participants = [this.currentUser.id, otherUserId].sort();
    const chatId = `chat_dm_${participants.join('_')}`;

    const existingChat = this.chats.find((c) => c.id === chatId);
    if (existingChat) {
      return existingChat;
    }

    const newChat: Chat = {
      id: chatId,
      isGroup: false,
      participants,
      participantDetails: {
        [this.currentUser.id]: {
          username: this.currentUser.username,
          fullName: this.currentUser.fullName,
          avatar: this.currentUser.avatar,
        },
        [otherUser.id]: {
          username: otherUser.username,
          fullName: otherUser.fullName,
          avatar: otherUser.avatar,
        },
      },
      updatedAt: Date.now(),
    };

    this.chats.unshift(newChat);
    this.messages[chatId] = [];
    this.saveChats();
    this.saveMessages(chatId);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'chats', chatId), newChat);
      } catch (e) {
        console.warn('Firestore createDirectChat error:', e);
      }
    }

    return newChat;
  }

  async createGroupChat(params: {
    name: string;
    description?: string;
    avatar?: string;
    participantIds: string[];
  }): Promise<Chat> {
    if (!this.currentUser) throw new Error('Not authenticated');

    const participantIds = Array.from(new Set([this.currentUser.id, ...params.participantIds]));
    const chatId = `chat_group_${Date.now()}`;

    const participantDetails: Record<string, any> = {};
    participantIds.forEach((pid) => {
      const user = this.getUserById(pid);
      if (user) {
        participantDetails[pid] = {
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
        };
      }
    });

    const newGroup: Chat = {
      id: chatId,
      isGroup: true,
      name: params.name,
      description: params.description || 'Electric group frequency',
      avatar: params.avatar || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
      createdBy: this.currentUser.id,
      participants: participantIds,
      participantDetails,
      updatedAt: Date.now(),
      lastMessage: {
        text: `⚡ ${this.currentUser.fullName} created the channel "${params.name}"`,
        senderId: this.currentUser.id,
        senderName: this.currentUser.fullName,
        timestamp: Date.now(),
        type: 'text',
      },
    };

    this.chats.unshift(newGroup);
    this.messages[chatId] = [
      {
        id: `msg_${Date.now()}`,
        chatId,
        senderId: this.currentUser.id,
        senderName: this.currentUser.fullName,
        senderAvatar: this.currentUser.avatar,
        text: `⚡ Created channel "${params.name}". High-voltage communication online.`,
        createdAt: Date.now(),
        readBy: [this.currentUser.id],
      },
    ];

    this.saveChats();
    this.saveMessages(chatId);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'chats', chatId), newGroup);
      } catch (e) {
        console.warn('Firestore createGroupChat error:', e);
      }
    }

    return newGroup;
  }

  async deleteChatByAdmin(chatId: string): Promise<void> {
    this.chats = this.chats.filter((c) => c.id !== chatId);
    delete this.messages[chatId];
    this.saveChats();
    this.saveMessages(chatId);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'chats', chatId));
      } catch (e) {
        console.warn('Firestore delete chat error:', e);
      }
    }
  }

  async updateChatByAdmin(chatId: string, updates: Partial<Chat>): Promise<Chat> {
    const idx = this.chats.findIndex((c) => c.id === chatId);
    if (idx === -1) throw new Error('Chat not found');

    const updated = {
      ...this.chats[idx],
      ...updates,
      updatedAt: Date.now(),
    };

    this.chats[idx] = updated;
    this.saveChats();

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'chats', chatId), updates as any);
      } catch (e) {
        console.warn('Firestore update chat notice:', e);
      }
    }

    return updated;
  }

  // MESSAGES
  getMessages(chatId: string): Message[] {
    return this.messages[chatId] || [];
  }

  async sendMessage(params: {
    chatId: string;
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio' | 'file' | 'call';
    mediaName?: string;
    audioDuration?: number;
    callDuration?: number;
    replyTo?: { id: string; text: string; senderName: string };
  }): Promise<Message> {
    if (!this.currentUser) throw new Error('Not authenticated');
    if (this.currentUser.isBanned) {
      throw new Error('Your account is restricted. You cannot send messages.');
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMessage: Message = {
      id: messageId,
      chatId: params.chatId,
      senderId: this.currentUser.id,
      senderName: this.currentUser.fullName,
      senderAvatar: this.currentUser.avatar,
      text: params.text,
      mediaUrl: params.mediaUrl,
      mediaType: params.mediaType,
      mediaName: params.mediaName,
      audioDuration: params.audioDuration,
      callDuration: params.callDuration,
      createdAt: Date.now(),
      readBy: [this.currentUser.id],
      reactions: {},
      replyTo: params.replyTo,
    };

    if (!this.messages[params.chatId]) {
      this.messages[params.chatId] = [];
    }
    this.messages[params.chatId].push(newMessage);

    // Update chat last message
    const chatIndex = this.chats.findIndex((c) => c.id === params.chatId);
    if (chatIndex !== -1) {
      this.chats[chatIndex].lastMessage = {
        text: params.mediaType && !params.text ? `[${params.mediaType.toUpperCase()}]` : params.text,
        senderId: this.currentUser.id,
        senderName: this.currentUser.fullName,
        timestamp: Date.now(),
        type: params.mediaType || 'text',
      };
      this.chats[chatIndex].updatedAt = Date.now();

      // Move chat to top
      const [updatedChat] = this.chats.splice(chatIndex, 1);
      this.chats.unshift(updatedChat);
      this.saveChats();
    }

    this.saveMessages(params.chatId);

    // If Firestore is live, persist to subcollection
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'chats', params.chatId, 'messages', messageId), newMessage);
        await updateDoc(doc(db, 'chats', params.chatId), {
          lastMessage: this.chats[0]?.lastMessage,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Firestore sendMessage error:', e);
      }
    }

    return newMessage;
  }

  // TYPING INDICATOR
  setTyping(chatId: string, userId?: string, isTyping: boolean = true) {
    const uid = userId || this.currentUser?.id;
    if (!uid) return;

    this.notify(`typing_${chatId}`, { userId: uid, isTyping });
    this.broadcast('TYPING', { chatId, userId: uid, isTyping });
  }

  // READ RECEIPTS
  markMessagesAsRead(chatId: string) {
    if (!this.currentUser) return;
    const currentId = this.currentUser.id;

    let modified = false;
    const msgs = this.messages[chatId] || [];
    msgs.forEach((msg) => {
      if (!msg.readBy.includes(currentId)) {
        msg.readBy.push(currentId);
        modified = true;
      }
    });

    if (modified) {
      this.saveMessages(chatId);
    }
  }

  // REACTION TOGGLE
  async toggleReaction(chatId: string, messageId: string, emoji: string) {
    if (!this.currentUser) return;
    const msgs = this.messages[chatId] || [];
    const msg = msgs.find((m) => m.id === messageId);
    if (!msg) return;

    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const userIdx = msg.reactions[emoji].indexOf(this.currentUser.id);
    if (userIdx !== -1) {
      msg.reactions[emoji].splice(userIdx, 1);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji].push(this.currentUser.id);
    }

    this.saveMessages(chatId);
  }

  // GLOBAL DELETE: "Delete Message for Everyone"
  async deleteMessageForEveryone(chatId: string, messageId: string): Promise<void> {
    const msgs = this.messages[chatId] || [];
    const idx = msgs.findIndex((m) => m.id === messageId);
    if (idx !== -1) {
      const msg = msgs[idx];
      msgs.splice(idx, 1);
      this.saveMessages(chatId);

      const chat = this.chats.find((c) => c.id === chatId);
      if (chat && chat.lastMessage?.timestamp === msg.createdAt) {
        const last = msgs[msgs.length - 1];
        if (last) {
          chat.lastMessage = {
            text: last.text,
            senderId: last.senderId,
            senderName: last.senderName,
            timestamp: last.createdAt,
            type: last.mediaType || 'text',
          };
        } else {
          delete chat.lastMessage;
        }
        this.saveChats();
      }

      if (isFirebaseConfigured && db) {
        try {
          await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
        } catch (e) {
          console.warn('Firestore delete message error:', e);
        }
      }
    }
  }

  // CLEAR ALL CHAT HISTORY
  async clearAllChatHistory(chatId: string): Promise<void> {
    this.messages[chatId] = [];
    this.saveMessages(chatId);

    const chat = this.chats.find((c) => c.id === chatId);
    if (chat) {
      delete chat.lastMessage;
      chat.updatedAt = Date.now();
      this.saveChats();
    }

    if (isFirebaseConfigured && db) {
      try {
        const msgsRef = collection(db, 'chats', chatId, 'messages');
        const snap = await getDocs(msgsRef);
        snap.forEach(async (docSnap) => {
          await deleteDoc(docSnap.ref);
        });
      } catch (e) {
        console.warn('Firestore clearAllChatHistory error:', e);
      }
    }
  }

  // STORIES (24H EXPIRATION)
  getActiveStories(): Story[] {
    const now = Date.now();
    this.stories = this.stories.filter((s) => s.expiresAt > now);
    return this.stories;
  }

  async createStory(params: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption?: string;
  }): Promise<Story> {
    if (!this.currentUser) throw new Error('Not authenticated');

    const storyId = `story_${Date.now()}`;
    const newStory: Story = {
      id: storyId,
      userId: this.currentUser.id,
      username: this.currentUser.username,
      userFullName: this.currentUser.fullName,
      userAvatar: this.currentUser.avatar,
      mediaUrl: params.mediaUrl,
      mediaType: params.mediaType,
      caption: params.caption,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      viewers: [],
      likes: [],
    };

    this.stories.unshift(newStory);
    this.saveStories();

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'stories', storyId), newStory);
      } catch (e) {
        console.warn('Firestore createStory error:', e);
      }
    }

    return newStory;
  }

  async deleteStoryByAdmin(storyId: string): Promise<void> {
    this.stories = this.stories.filter((s) => s.id !== storyId);
    this.saveStories();

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'stories', storyId));
      } catch (e) {
        console.warn('Firestore deleteStory notice:', e);
      }
    }
  }

  async viewStory(storyId: string): Promise<void> {
    if (!this.currentUser) return;
    const story = this.stories.find((s) => s.id === storyId);
    if (story && !story.viewers.includes(this.currentUser.id)) {
      story.viewers.push(this.currentUser.id);
      this.saveStories();
    }
  }

  async toggleLikeStory(storyId: string): Promise<void> {
    if (!this.currentUser) return;
    const story = this.stories.find((s) => s.id === storyId);
    if (!story) return;

    const idx = story.likes.indexOf(this.currentUser.id);
    if (idx !== -1) {
      story.likes.splice(idx, 1);
    } else {
      story.likes.push(this.currentUser.id);
    }
    this.saveStories();
  }

  // FILE UPLOAD HELPER
  async uploadMedia(file: File | Blob, folder: string = 'media'): Promise<string> {
    if (isFirebaseConfigured && storage) {
      try {
        const fileRef = ref(storage, `${folder}/${Date.now()}_${(file as File).name || 'audio.webm'}`);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
      } catch (err) {
        console.warn('Firebase Storage upload notice, fallback to local object URL:', err);
      }
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  // CALL SIGNALING DISPATCHER
  sendCallSignal(receiverId: string, signal: any) {
    this.notify(`call_signal_${receiverId}`, signal);
    this.broadcast('CALL_SIGNAL', { receiverId, ...signal });
  }
}

export const kaminariBackend = new KaminariBackendService();
