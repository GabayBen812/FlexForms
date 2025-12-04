import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import type { MessagesStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../providers/AuthProvider';
import {
  useChatGroups,
  useChatMessages,
  useSendChatMessage,
} from '../features/chat/chatQueries';
import { useOrganizationUsers } from '../features/chat/useOrganizationUsers';
import type { ChatMessage } from '../api/chat';

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

  return (
    <View
      style={[
        styles.messageRow,
        isOwn ? styles.messageRowOwn : styles.messageRowOther,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
        ]}
      >
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
        <Text style={styles.messageMeta}>{timeLabel}</Text>
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

  const [inputValue, setInputValue] = useState('');
  const [selectedMention, setSelectedMention] = useState<MentionUser | null>(
    null
  );
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
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

    try {
      await sendMessageMutation.mutateAsync({
        groupId,
        content: trimmed,
      });
      setInputValue('');
      setSelectedMention(null);
    } catch {
      // errors are handled by the hook's consumers if needed
    }
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
  };

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
                onPress={() => navigation.goBack()}
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
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  headerTitle: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 13,
    textAlign: 'right',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  backButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  backButtonLabel: {
    color: '#457B9D',
    fontSize: 16,
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
    fontSize: 16,
  },
  messagesList: {
    paddingVertical: 8,
    paddingBottom: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    fontSize: 15,
    textAlign: 'right',
  },
  mentionCard: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#457B9D',
    marginVertical: 2,
  },
  mentionCardText: {
    color: '#457B9D',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  messageMeta: {
    marginTop: 4,
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'left',
  },
  loadMoreContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadMoreText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  composerInputWrapper: {
    flex: 1,
    position: 'relative',
  },
  mentionBadgeContainer: {
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  mentionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#457B9D',
    gap: 6,
  },
  mentionBadgeText: {
    color: '#457B9D',
    fontSize: 13,
    fontWeight: '600',
  },
  mentionBadgeClose: {
    color: '#457B9D',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 18,
  },
  inputContainer: {
    position: 'relative',
  },
  composerInput: {
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    textAlign: 'right',
    color: '#0f172a',
    fontSize: 15,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mentionItemHighlighted: {
    backgroundColor: '#DBEAFE',
  },
  mentionItemText: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'right',
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#457B9D',
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
    fontSize: 15,
    fontWeight: '600',
  },
  readOnlyContainer: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  readOnlyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ChatPage;

