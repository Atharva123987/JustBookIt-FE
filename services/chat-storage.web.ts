import { ChatContext, ChatMessage } from '@/components/chat/types';

const CHAT_STATE_STORAGE_KEY = 'just-book-it/chat-state';
const DEVICE_ID_STORAGE_KEY = 'just-book-it/device-id';

export type PersistedChatState = {
  messages: ChatMessage[];
  chatContext: ChatContext;
  lastIntent: string | null;
};

function generateDeviceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getWebStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return null;
}

export async function getOrCreateDeviceId() {
  const storage = getWebStorage();

  if (!storage) {
    return generateDeviceId();
  }

  const existingDeviceId = storage.getItem(DEVICE_ID_STORAGE_KEY);

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const nextDeviceId = generateDeviceId();
  storage.setItem(DEVICE_ID_STORAGE_KEY, nextDeviceId);
  return nextDeviceId;
}

export async function loadPersistedChatState(): Promise<PersistedChatState | null> {
  const storage = getWebStorage();

  if (!storage) {
    return null;
  }

  const serializedState = storage.getItem(CHAT_STATE_STORAGE_KEY);

  if (!serializedState) {
    return null;
  }

  try {
    const parsedState = JSON.parse(serializedState) as PersistedChatState;

    return {
      messages: parsedState.messages ?? [],
      chatContext: parsedState.chatContext ?? {},
      lastIntent: parsedState.lastIntent ?? null,
    };
  } catch {
    storage.removeItem(CHAT_STATE_STORAGE_KEY);
    return null;
  }
}

export async function persistChatState(state: PersistedChatState) {
  const storage = getWebStorage();

  if (!storage) {
    return;
  }

  storage.setItem(CHAT_STATE_STORAGE_KEY, JSON.stringify(state));
}
