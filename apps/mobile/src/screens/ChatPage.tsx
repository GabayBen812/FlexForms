import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';

import type { MessagesStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../providers/AuthProvider';
import {
  chatQueryKeys,
  useChatGroups,
  useChatMessages,
  useSendChatMessage,
} from '../features/chat/chatQueries';
import { useOrganizationUsers } from '../features/chat/useOrganizationUsers';
import type { ChatMessage, ChatMessagesResponse } from '../api/chat';
import { MessageStatusIcon } from '../components/chat/MessageStatusIcon';
import { MediaPicker } from '../components/chat/MediaPicker';
import { ImageMessage } from '../components/chat/ImageMessage';
import { VideoMessage } from '../components/chat/VideoMessage';
import type { MediaAsset } from '../utils/mediaUtils';
import { Feather } from '@expo/vector-icons';

type ChatPageRouteProp = RouteProp<MessagesStackParamList, 'ChatPage'>;
type ChatPageNavProp = NativeStackNavigationProp<MessagesStackParamList>;

type MessagePart = {
  type: 'mention' | 'text';
  value: string;
};

// Parse message content and extract mentions (format: @Name)
function parseMessageContent(content: string): MessagePart[] {
  const parts: MessagePart[] = [];
  // Match @ followed by word characters (letters, numbers, underscores, Hebrew chars)
  // Stop at whitespace or end of string
  const mentionRegex = /@([\w\u0590-\u05FF]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore) {
        parts.push({
          type: 'text',
          value: textBefore,
        });
      }
    }
    // Add mention
    parts.push({
      type: 'mention',
      value: match[1], // The name without @
    });
    lastIndex = mentionRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText) {
      parts.push({
        type: 'text',
        value: remainingText,
      });
    }
  }

  // If no mentions found, return the whole content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', value: content });
  }

  return parts;
}

const ChatBubble = ({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) => {
  const timeLabel = useMemo(() => {
    if (!message.createdAt) return '';
    const date = new Date(message.createdAt);
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [message.createdAt]);

  const messageParts = useMemo(
    () => parseMessageContent(message.content),
    [message.content]
  );

  const messageStatus = message.status || (isOwn ? 'sent' : undefined);

  const hasMedia = message.mediaUrl && message.mediaType;
  const hasText = message.content && message.content.trim().length > 0;

  return (
    <View
      style={[
        styles.messageRow,
        isOwn ? styles.messageRowOwn : styles.messageRowOther,
        message.isOptimistic && styles.messageRowOptimistic,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
          message.isOptimistic && styles.messageBubbleOptimistic,
          hasMedia && !hasText && styles.messageBubbleMedia,
        ]}
      >
        {/* Media Content */}
        {hasMedia && (
          <View style={styles.mediaContainer}>
            {message.mediaType === 'image' && (
              <ImageMessage
                uri={message.mediaUrl!}
                width={message.mediaWidth}
                height={message.mediaHeight}
                isOwn={isOwn}
                uploadProgress={message.uploadProgress}
                isUploading={message.isOptimistic}
              />
            )}
            {message.mediaType === 'video' && (
              <VideoMessage
                uri={message.mediaUrl!}
                width={message.mediaWidth}
                height={message.mediaHeight}
                isOwn={isOwn}
                uploadProgress={message.uploadProgress}
                isUploading={message.isOptimistic}
              />
            )}
          </View>
        )}

        {/* Text Content */}
        {hasText && (
          <View style={styles.messageContent}>
            {messageParts.map((part, idx) => {
              if (part.type === 'mention') {
                return (
                  <View key={idx} style={styles.mentionCard}>
                    <Text style={styles.mentionCardText}>@{part.value}</Text>
                  </View>
                );
              }
              // Split text by newlines to preserve line breaks
              const lines = part.value.split('\n');
              return (
                <Text key={idx} style={styles.messageText}>
                  {lines.map((line, lineIdx) => (
                    <Text key={lineIdx}>
                      {line}
                      {lineIdx < lines.length - 1 && '\n'}
                    </Text>
                  ))}
                </Text>
              );
            })}
          </View>
        )}

        {/* Meta Info (time + status) */}
        <View style={styles.messageMetaRow}>
          <Text style={styles.messageMeta}>{timeLabel}</Text>
          {isOwn && messageStatus && (
            <View style={styles.messageStatusIcon}>
              <MessageStatusIcon status={messageStatus} size={16} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

type MentionUser = {
  id: string;
  label: string;
};

const ChatPage = () => {
  const navigation = useNavigation<ChatPageNavProp>();
  const route = useRoute<ChatPageRouteProp>();
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState('');
  const [selectedMention, setSelectedMention] = useState<MentionUser | null>(
    null
  );
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isMediaPickerVisible, setIsMediaPickerVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset[]>([]);
  const listRef = useRef<FlatList<ChatMessage> | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useChatMessages(groupId, {
    limit: 50,
  });

  const { data: groups = [] } = useChatGroups();
  const { data: organizationUsers = [] } = useOrganizationUsers();
  const sendMessageMutation = useSendChatMessage();

  const messages: ChatMessage[] =
    data?.pages.flatMap((page) => page.messages) ?? [];

  const currentGroup = useMemo(
    () => groups.find((group) => group.id === groupId) ?? null,
    [groups, groupId]
  );

  const canSendMessages = useMemo(() => {
    if (!currentGroup) return false;
    if (!user) return false;
    
    // If group is read-only for parents and user is a parent, they cannot send
    if (currentGroup.isReadOnlyForParents && user.role === 'parent') {
      return false;
    }
    
    return true;
  }, [currentGroup, user]);

  const chatParticipants = useMemo(() => {
    if (!currentGroup) return [];

    const memberIdSet = new Set(
      currentGroup.memberIds.map((id) =>
        typeof id === 'number' ? String(id) : String(id)
      )
    );

    return organizationUsers
      .map((item) => {
        const id =
          item._id ??
          (typeof item.id === 'number' ? String(item.id) : item.id ?? '');

        if (!id || !memberIdSet.has(id)) {
          return null;
        }

        const label = item.name || item.email || '';
        if (!label) return null;

        return {
          id,
          label,
        };
      })
      .filter(
        (option): option is MentionUser => option !== null
      );
  }, [organizationUsers, currentGroup]);

  const filteredMentions = useMemo(() => {
    if (!chatParticipants.length) return [];
    if (!mentionQuery) return chatParticipants;

    const query = mentionQuery.toLowerCase();
    return chatParticipants.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [chatParticipants, mentionQuery]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const timeout = setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollToEnd({ animated: true });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [messages.length]);

  useEffect(() => {
    if (!chatParticipants.length || selectedMention) {
      setIsMentionOpen(false);
      setMentionQuery('');
      return;
    }

    if (inputValue.startsWith('@')) {
      const firstToken = inputValue.slice(1).split(/\s/)[0] ?? '';
      setMentionQuery(firstToken);
      setIsMentionOpen(true);
      setHighlightedIndex(0);
      return;
    }

    setIsMentionOpen(false);
    setMentionQuery('');
  }, [inputValue, chatParticipants.length, selectedMention]);

  const insertMention = useCallback(
    (mentionUser: MentionUser) => {
      if (!mentionUser) return;
      // Remove "@" and the query text, keep the rest
      const remaining = inputValue.slice(mentionQuery.length + 1); // +1 for '@'
      setSelectedMention(mentionUser);
      setInputValue(remaining.trimStart());
      setIsMentionOpen(false);
      setMentionQuery('');
    },
    [mentionQuery.length, inputValue]
  );

  const handleSend = async () => {
    const composed =
      selectedMention && selectedMention.label
        ? `@${selectedMention.label} ${inputValue}`
        : inputValue;
    const trimmed = composed.trim();
    if (!trimmed || sendMessageMutation.isPending) {
      return;
    }

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      groupId,
      senderId: user?.id || '',
      content: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readBy: [],
      status: 'sending',
      isOptimistic: true,
    };

    // Clear input immediately
    setInputValue('');
    setSelectedMention(null);
    Keyboard.dismiss();

    // Add optimistic message to cache
    queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
      chatQueryKeys.messages(groupId),
      (existing) => {
        if (!existing) {
          return {
            pages: [{ messages: [optimisticMessage], hasMore: false }],
            pageParams: [undefined],
          };
        }

        const pages = existing.pages.map((page, index) => {
          if (index !== existing.pages.length - 1) {
            return page;
          }

          return {
            ...page,
            messages: [...page.messages, optimisticMessage],
          };
        });

        return {
          ...existing,
          pages,
        };
      }
    );

    // Scroll to bottom
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollToEnd({ animated: true });
      }
    }, 100);

    try {
      const serverMessage = await sendMessageMutation.mutateAsync({
        groupId,
        content: trimmed,
      });

      // Replace optimistic message with server message
      queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
        chatQueryKeys.messages(groupId),
        (existing) => {
          if (!existing) return existing;

          const pages = existing.pages.map((page, index) => {
            if (index !== existing.pages.length - 1) {
              return page;
            }

            // Remove optimistic message and add real message
            const filtered = page.messages.filter(
              (msg) => msg.id !== optimisticMessage.id
            );

            // Check if server message already exists (from socket)
            const alreadyExists = filtered.some(
              (msg) => msg.id === serverMessage.id
            );

            if (alreadyExists) {
              return { ...page, messages: filtered };
            }

            return {
              ...page,
              messages: [...filtered, { ...serverMessage, status: 'sent' as const }],
            };
          });

          return {
            ...existing,
            pages,
          };
        }
      );
    } catch (error) {
      // Mark message as failed
      queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
        chatQueryKeys.messages(groupId),
        (existing) => {
          if (!existing) return existing;

          const pages = existing.pages.map((page, index) => {
            if (index !== existing.pages.length - 1) {
              return page;
            }

            return {
              ...page,
              messages: page.messages.map((msg) =>
                msg.id === optimisticMessage.id
                  ? { ...msg, status: 'failed' as const }
                  : msg
              ),
            };
          });

          return {
            ...existing,
            pages,
          };
        }
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
  };

  const handleBackPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  const handleMediaPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMediaPickerVisible(true);
  }, []);

  const handleMediaSelected = useCallback((assets: MediaAsset[]) => {
    setSelectedMedia(assets);
    // TODO: For now, just store selected media
    // In next phase, we'll upload and send these
  }, []);

  const handleRemoveMedia = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveMention = () => {
    if (selectedMention) {
      setInputValue((prev) =>
        prev ? `@${selectedMention.label} ${prev}` : `@${selectedMention.label} `
      );
      setSelectedMention(null);
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.senderId === user?.id;
    return <ChatBubble message={item} isOwn={isOwn} />;
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Pressable
                onPress={handleBackPress}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
              >
                <Text style={styles.backButtonLabel}>חזרה</Text>
              </Pressable>
              <View style={styles.headerTextGroup}>
                <Text style={styles.headerTitle}>{groupName}</Text>
                <Text style={styles.headerSubtitle}>צ'אט קבוצה</Text>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#457B9D" />
                <Text style={styles.centerText}>טוען הודעות…</Text>
              </View>
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.messagesList}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.2}
                ListFooterComponent={
                  hasNextPage ? (
                    <View style={styles.loadMoreContainer}>
                      <ActivityIndicator size="small" color="#94A3B8" />
                      <Text style={styles.loadMoreText}>טוען הודעות קודמות…</Text>
                    </View>
                  ) : null
                }
              />
            )}

            {canSendMessages ? (
              <View style={styles.composerContainer}>
                <View style={styles.composerInputWrapper}>
                  {selectedMention && (
                    <View style={styles.mentionBadgeContainer}>
                      <Pressable
                        onPress={handleRemoveMention}
                        style={styles.mentionBadge}
                      >
                        <Text style={styles.mentionBadgeText}>
                          @{selectedMention.label}
                        </Text>
                        <Text style={styles.mentionBadgeClose}>×</Text>
                      </Pressable>
                    </View>
                  )}
                  {selectedMedia.length > 0 && (
                    <View style={styles.mediaPreviewContainer}>
                      {selectedMedia.map((media, index) => (
                        <View key={index} style={styles.mediaPreviewBadge}>
                          <Feather name="image" size={16} color="#457B9D" />
                          <Text style={styles.mediaPreviewText}>תמונה {index + 1}</Text>
                          <Pressable onPress={() => handleRemoveMedia(index)}>
                            <Text style={styles.mediaPreviewClose}>×</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.inputContainer}>
                    <TextInput
                      ref={inputRef}
                      value={inputValue}
                      onChangeText={handleInputChange}
                      placeholder="כתוב הודעה…"
                      placeholderTextColor="#9CA3AF"
                      multiline
                      style={styles.composerInput}
                    />
                    {isMentionOpen && filteredMentions.length > 0 && (
                      <View style={styles.mentionDropdown}>
                        <FlatList
                          data={filteredMentions}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item, index }) => (
                            <Pressable
                              onPress={() => insertMention(item)}
                              style={[
                                styles.mentionItem,
                                index === highlightedIndex &&
                                  styles.mentionItemHighlighted,
                              ]}
                            >
                              <Text style={styles.mentionItemText}>
                                @{item.label}
                              </Text>
                            </Pressable>
                          )}
                          style={styles.mentionList}
                          nestedScrollEnabled
                        />
                      </View>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={handleMediaPress}
                  style={({ pressed }) => [
                    styles.mediaButton,
                    pressed && styles.mediaButtonPressed,
                  ]}
                >
                  <Feather name="camera" size={24} color="#457B9D" />
                </Pressable>
                <Pressable
                  onPress={handleSend}
                  disabled={
                    (selectedMention
                      ? `@${selectedMention.label} ${inputValue}`.trim().length ===
                        0
                      : inputValue.trim().length === 0) ||
                    sendMessageMutation.isPending
                  }
                  style={({ pressed }) => [
                    styles.sendButton,
                    (pressed || sendMessageMutation.isPending) &&
                      styles.sendButtonPressed,
                    (selectedMention
                      ? `@${selectedMention.label} ${inputValue}`.trim().length ===
                        0
                      : inputValue.trim().length === 0) ||
                      sendMessageMutation.isPending
                      ? styles.sendButtonDisabled
                      : null,
                  ]}
                >
                  <Text style={styles.sendButtonLabel}>
                    {sendMessageMutation.isPending ? 'שולח…' : 'שלח'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.readOnlyContainer}>
                <Text style={styles.readOnlyText}>
                  רק מנהלים יכולים לשלוח הודעות בקבוצה זו
                </Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>

        <MediaPicker
          visible={isMediaPickerVisible}
          onClose={() => setIsMediaPickerVisible(false)}
          onMediaSelected={handleMediaSelected}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  headerTitle: {
    color: '#1e293b',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 30,
  },
  headerSubtitle: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 14,
    textAlign: 'right',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  backButtonLabel: {
    color: '#457B9D',
    fontSize: 17,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  centerText: {
    color: '#64748B',
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24,
  },
  messagesList: {
    paddingVertical: 12,
    paddingBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubbleOwn: {
    backgroundColor: '#e0f2fe',
    borderTopRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 4,
  },
  messageContent: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  messageText: {
    color: '#0f172a',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
  mentionCard: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#457B9D',
    marginVertical: 2,
  },
  mentionCardText: {
    color: '#457B9D',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 6,
    gap: 5,
  },
  messageMeta: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'left',
  },
  messageStatusIcon: {
    marginLeft: 2,
  },
  messageRowOptimistic: {
    opacity: 0.7,
  },
  messageBubbleOptimistic: {
    opacity: 0.8,
  },
  messageBubbleMedia: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  mediaContainer: {
    marginBottom: 4,
  },
  loadMoreContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadMoreText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  composerInputWrapper: {
    flex: 1,
    position: 'relative',
  },
  mentionBadgeContainer: {
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  mentionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#457B9D',
    gap: 8,
  },
  mentionBadgeText: {
    color: '#457B9D',
    fontSize: 15,
    fontWeight: '600',
  },
  mentionBadgeClose: {
    color: '#457B9D',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  mediaPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#457B9D',
    gap: 6,
  },
  mediaPreviewText: {
    color: '#457B9D',
    fontSize: 12,
    fontWeight: '600',
  },
  mediaPreviewClose: {
    color: '#457B9D',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },
  mediaButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  inputContainer: {
    position: 'relative',
  },
  composerInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    textAlign: 'right',
    color: '#0f172a',
    fontSize: 16,
    lineHeight: 22,
  },
  mentionDropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    maxHeight: 200,
    zIndex: 1000,
  },
  mentionList: {
    maxHeight: 200,
  },
  mentionItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 52,
    justifyContent: 'center',
  },
  mentionItemHighlighted: {
    backgroundColor: '#DBEAFE',
  },
  mentionItemText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'right',
  },
  sendButton: {
    minWidth: 80,
    minHeight: 48,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#457B9D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5F5',
  },
  sendButtonLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  readOnlyContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
  },
  readOnlyText: {
    color: '#92400E',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ChatPage;

