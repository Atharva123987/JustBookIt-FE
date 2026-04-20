import * as FileSystem from 'expo-file-system/legacy';

import { ChatContext, ChatMessage } from '@/components/chat/types';

const STORAGE_DIRECTORY = `${FileSystem.documentDirectory}chat-storage/`;
const CHAT_STATE_FILE_URI = `${STORAGE_DIRECTORY}chat-state.json`;
const DEVICE_ID_FILE_URI = `${STORAGE_DIRECTORY}device-id.txt`;

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

async function ensureStorageDirectory() {
  const directoryInfo = await FileSystem.getInfoAsync(STORAGE_DIRECTORY);

  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(STORAGE_DIRECTORY, { intermediates: true });
  }
}

export async function getOrCreateDeviceId() {
  await ensureStorageDirectory();

  const deviceIdInfo = await FileSystem.getInfoAsync(DEVICE_ID_FILE_URI);

  if (deviceIdInfo.exists) {
    const existingDeviceId = (await FileSystem.readAsStringAsync(DEVICE_ID_FILE_URI)).trim();

    if (existingDeviceId) {
      return existingDeviceId;
    }
  }

  const nextDeviceId = generateDeviceId();
  await FileSystem.writeAsStringAsync(DEVICE_ID_FILE_URI, nextDeviceId);
  return nextDeviceId;
}

export async function loadPersistedChatState(): Promise<PersistedChatState | null> {
  await ensureStorageDirectory();

  const chatStateInfo = await FileSystem.getInfoAsync(CHAT_STATE_FILE_URI);

  if (!chatStateInfo.exists) {
    return null;
  }

  try {
    const serializedState = await FileSystem.readAsStringAsync(CHAT_STATE_FILE_URI);
    const parsedState = JSON.parse(serializedState) as PersistedChatState;

    return {
      messages: parsedState.messages ?? [],
      chatContext: parsedState.chatContext ?? {},
      lastIntent: parsedState.lastIntent ?? null,
    };
  } catch {
    await FileSystem.deleteAsync(CHAT_STATE_FILE_URI, { idempotent: true });
    return null;
  }
}

export async function persistChatState(state: PersistedChatState) {
  await ensureStorageDirectory();
  await FileSystem.writeAsStringAsync(CHAT_STATE_FILE_URI, JSON.stringify(state));
}
