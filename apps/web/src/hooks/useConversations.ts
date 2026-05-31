'use client';

import { useCallback, useState } from 'react';
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  updateConversation,
  type ConversationDetail,
  type ConversationSummary,
} from '@/lib/conversation-api';

export function useConversations(token: string | null) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    if (!token) return [];
    setIsLoadingConversations(true);
    try {
      const page = await listConversations(token);
      setConversations(page.conversations);
      setNextCursor(page.nextCursor);
      return page.conversations;
    } finally {
      setIsLoadingConversations(false);
    }
  }, [token]);

  const loadMoreConversations = useCallback(async () => {
    if (!token || !nextCursor || isLoadingConversations) return [];
    setIsLoadingConversations(true);
    try {
      const page = await listConversations(token, nextCursor);
      setConversations((current) => {
        const seen = new Set(current.map((conversation) => conversation.id));
        return [...current, ...page.conversations.filter((conversation) => !seen.has(conversation.id))];
      });
      setNextCursor(page.nextCursor);
      return page.conversations;
    } finally {
      setIsLoadingConversations(false);
    }
  }, [token, nextCursor, isLoadingConversations]);

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

  const renameConversation = useCallback(async (id: string, title: string) => {
    if (!token) return null;
    const conversation = await updateConversation(token, id, title);
    await refreshConversations();
    return conversation;
  }, [token, refreshConversations]);

  return {
    activeConversationId,
    conversations,
    isLoadingConversations,
    loadMoreConversations,
    loadConversation,
    nextCursor,
    refreshConversations,
    removeConversation,
    renameConversation,
    setActiveConversationId,
    startNewConversation,
  };
}
