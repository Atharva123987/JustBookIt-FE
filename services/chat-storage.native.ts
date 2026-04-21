import AsyncStorage from 'expo-sqlite/kv-store';

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

export async function getOrCreateDeviceId() {
  try {
    const existingDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);

    if (existingDeviceId) {
      console.log('[Chat Storage] Loaded device id from sqlite storage.');
      return existingDeviceId;
    }

    const nextDeviceId = generateDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, nextDeviceId);
    console.log('[Chat Storage] Persisted device id to sqlite storage.');
    return nextDeviceId;
  } catch (error) {
    console.log('[Chat Storage] Failed to access sqlite device id storage:', error);
    return generateDeviceId();
  }
}

export async function loadPersistedChatState(): Promise<PersistedChatState | null> {
  try {
    const serializedState = await AsyncStorage.getItem(CHAT_STATE_STORAGE_KEY);

    if (!serializedState) {
      return null;
    }

    const parsedState = JSON.parse(serializedState) as PersistedChatState;
    console.log(
      `[Chat Storage] Loaded persisted chat state from sqlite with ${
        parsedState.messages?.length ?? 0
      } messages.`
    );

    return {
      messages: parsedState.messages ?? [],
      chatContext: parsedState.chatContext ?? {},
      lastIntent: parsedState.lastIntent ?? null,
    };
  } catch (error) {
    console.log('[Chat Storage] Failed to load persisted chat state from sqlite:', error);

    try {
      await AsyncStorage.removeItem(CHAT_STATE_STORAGE_KEY);
    } catch (cleanupError) {
      console.log('[Chat Storage] Failed to clean up corrupted sqlite chat state:', cleanupError);
    }

    return null;
  }
}

export async function persistChatState(state: PersistedChatState) {
  try {
    await AsyncStorage.setItem(CHAT_STATE_STORAGE_KEY, JSON.stringify(state));
    console.log(
      `[Chat Storage] Persisted chat state to sqlite with ${state.messages.length} messages.`
    );
  } catch (error) {
    console.log('[Chat Storage] Failed to persist chat state to sqlite:', error);
  }
}
