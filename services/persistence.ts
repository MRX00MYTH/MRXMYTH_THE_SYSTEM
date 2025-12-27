
import { AppState, User } from '../types';
import { getInitialState } from '../constants';

const SESSION_KEY = 'system_current_session';
const LOCAL_REGISTRY = 'system_hunter_registry'; 
const CLOUD_API = `https://kvdb.io/A5rGf6qT68W8vM2kY8q8Lz/`; 

const obfuscate = (data: any) => btoa(encodeURIComponent(JSON.stringify(data)));
const deobfuscate = (dataStr: string) => {
  try {
    return JSON.parse(decodeURIComponent(atob(dataStr)));
  } catch (e) {
    return null;
  }
};

const getLocalRegistry = (): any => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_REGISTRY) || '{}');
  } catch {
    return {};
  }
};

const saveToLocalRegistry = (username: string, passwordHash: string) => {
  const registry = getLocalRegistry();
  registry[username] = passwordHash;
  localStorage.setItem(LOCAL_REGISTRY, JSON.stringify(registry));
};

/**
 * Heuristic Merge Logic
 * Compares incoming cloud data with local data and picks the one with 
 * more progression (higher level, more EXP, or newer timestamps).
 */
const mergeState = (local: AppState, remote: any): AppState => {
  if (!remote) return local;
  
  // Progression weight: Higher level or EXP usually wins
  const localWeight = (local.level * 10000) + (local.cumulativeEXP || 0);
  const remoteWeight = ((remote.level || 1) * 10000) + (remote.cumulativeEXP || 0);
  
  const isRemoteAdvanced = remoteWeight > localWeight;
  
  const merged: AppState = {
    ...local,
    ...remote,
    // Deep merge stats to ensure no partial wipes
    stats: {
      ...local.stats,
      ...(remote.stats || {})
    },
    // Keep the most comprehensive task history if remote is advanced
    tasksList: isRemoteAdvanced ? (remote.tasksList || local.tasksList) : (local.tasksList || []),
    // Ensure titles are additive (never lose a title)
    titlesUnlocked: Array.from(new Set([...(local.titlesUnlocked || []), ...(remote.titlesUnlocked || [])])),
    // Notification merging: Deduplicate by ID
    notifications: [...(remote.notifications || []), ...(local.notifications || [])]
      .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
      .slice(0, 50)
  };

  return merged;
};

const cloudFetch = async (url: string, options?: RequestInit, retries = 2): Promise<Response> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'text/plain, application/json',
        ...(options?.headers || {})
      }
    });
    
    // KVDB returns 404 for keys that don't exist; we treat this as "no remote data" not an error
    if (response.status === 404) return response;
    
    if (!response.ok && retries > 0) throw new Error(`HTTP Error: ${response.status}`);
    return response;
  } catch (err) {
    if (retries > 0) {
      // Exponential backoff
      await new Promise(r => setTimeout(r, 1000 * (3 - retries)));
      return cloudFetch(url, options, retries - 1);
    }
    throw err;
  }
};

export const saveState = async (username: string, state: AppState) => {
  if (!username) return;
  try {
    // Immediate Local Sync
    localStorage.setItem(`state_${username}`, JSON.stringify(state));
    
    // Background Cloud Sync
    if (navigator.onLine) {
      const data = obfuscate(state);
      await cloudFetch(`${CLOUD_API}${username}_state_v3`, { 
        method: 'PUT', 
        body: data,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  } catch (err) {
    console.warn("[THE SYSTEM] Mana sync delayed. Dimensional link unstable.");
  }
};

export const loadState = async (username: string): Promise<AppState> => {
  const initial = getInitialState(username);
  if (!username) return initial;

  const localRaw = localStorage.getItem(`state_${username}`);
  const local = localRaw ? JSON.parse(localRaw) : initial;

  try {
    if (navigator.onLine) {
      const response = await cloudFetch(`${CLOUD_API}${username}_state_v3`);
      if (response.ok && response.status !== 404) {
        const text = await response.text();
        const cloudData = deobfuscate(text);
        if (cloudData) return mergeState(local, cloudData);
      }
    }
  } catch (err) {
    console.warn("[THE SYSTEM] Operating in Offline Mirror mode.");
  }

  return local;
};

export const cloudAuth = {
  async signup(username: string, passwordHash: string): Promise<boolean> {
    try {
      if (navigator.onLine) {
        // Check if user already exists in the cloud
        const check = await cloudFetch(`${CLOUD_API}${username}_auth_v3`);
        if (check.ok && check.status !== 404) return false; 

        await cloudFetch(`${CLOUD_API}${username}_auth_v3`, {
          method: 'PUT',
          body: obfuscate({ username, passwordHash }),
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      saveToLocalRegistry(username, passwordHash);
      return true;
    } catch {
      return false;
    }
  },

  async login(username: string, passwordHash: string): Promise<User | null> {
    const localReg = getLocalRegistry();
    try {
      if (navigator.onLine) {
        const response = await cloudFetch(`${CLOUD_API}${username}_auth_v3`);
        if (response.ok && response.status !== 404) {
          const auth = deobfuscate(await response.text());
          if (auth && auth.passwordHash === passwordHash) {
            saveToLocalRegistry(username, passwordHash);
            return { id: `hunter-${username}`, username, passwordHash };
          }
        }
      }
    } catch {}

    // Fallback to local registry if offline or cloud check failed
    if (localReg[username] === passwordHash) {
      return { id: `hunter-${username}`, username, passwordHash };
    }
    return null;
  }
};

export const getCurrentSession = (): User | null => {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};

export const saveSession = (user: User | null) => {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
};
