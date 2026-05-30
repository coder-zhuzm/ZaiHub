'use client';

import { useCallback, useState } from 'react';
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  type ConversationDetail,
  type ConversationSummary,
} from '@/lib/conversation-api';

export function useConversations(token: string | null) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const refreshConversations = useCallback(async () => {
    if (!token) return [];
    setIsLoadingConversations(true);
    try {
      const items = await listConversations(token);
      setConversations(items);
      return items;
    } finally {
      setIsLoadingConversations(false);
    }
  }, [token]);

  const startNewConversation = useCallback(async () => {
    if (!token) return null;
    const conversation = await createConversation(token);
    setActiveConversationId(conversation.id);
    await refreshConversations();
    return conversation;
  }, [token, refreshConversations]);

  const loadConversation = useCallback(async (id: string): Promise<ConversationDetail | null> => {
    if (!token) return null;
    const conversation = await getConversation(token, id);
    setActiveConversationId(id);
    return conversation;
  }, [token]);

  const removeConversation = useCallback(async (id: string) => {
    if (!token) return;
    await deleteConversation(token, id);
    if (activeConversationId === id) setActiveConversationId(null);
    await refreshConversations();
  }, [token, activeConversationId, refreshConversations]);

  return {
    activeConversationId,
    conversations,
    isLoadingConversations,
    loadConversation,
    refreshConversations,
    removeConversation,
    setActiveConversationId,
    startNewConversation,
  };
}
