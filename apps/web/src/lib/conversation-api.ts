import { getApiBase } from '@/lib/chat-api';

export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  messageCount: number;
  runCount: number;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  modelDbId?: string | null;
  runId?: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

export type ConversationDetail = {
  id: string;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
};

export async function listConversations(token: string) {
  const res = await fetch(`${getApiBase()}/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to list conversations: HTTP ${res.status}`);
  const data = await res.json();
  return (data.conversations ?? []) as ConversationSummary[];
}

export async function getConversation(token: string, id: string) {
  const res = await fetch(`${getApiBase()}/conversations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to get conversation: HTTP ${res.status}`);
  const data = await res.json();
  return data.conversation as ConversationDetail;
}

export async function createConversation(token: string, title = '新会话') {
  const res = await fetch(`${getApiBase()}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed to create conversation: HTTP ${res.status}`);
  const data = await res.json();
  return data.conversation as ConversationDetail;
}

export async function deleteConversation(token: string, id: string) {
  const res = await fetch(`${getApiBase()}/conversations/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to delete conversation: HTTP ${res.status}`);
}
