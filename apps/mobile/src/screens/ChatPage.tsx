import { useEffect, useMemo, useRef, useState } from 'react';
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
  useChatMessages,
  useSendChatMessage,
} from '../features/chat/chatQueries';
import type { ChatMessage } from '../api/chat';

type ChatPageRouteProp = RouteProp<MessagesStackParamList, 'ChatPage'>;
type ChatPageNavProp = NativeStackNavigationProp<MessagesStackParamList>;

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
        <Text style={styles.messageText}>{message.content}</Text>
        <Text style={styles.messageMeta}>{timeLabel}</Text>
      </View>
    </View>
  );
};

const ChatPage = () => {
  const navigation = useNavigation<ChatPageNavProp>();
  const route = useRoute<ChatPageRouteProp>();
  const { groupId, groupName } = route.params;
  const { user } = useAuth();

  const [inputValue, setInputValue] = useState('');
  const listRef = useRef<FlatList<ChatMessage> | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useChatMessages(groupId, {
    limit: 50,
  });

  const sendMessageMutation = useSendChatMessage();

  const messages: ChatMessage[] =
    data?.pages.flatMap((page) => page.messages) ?? [];

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

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || sendMessageMutation.isPending) {
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        groupId,
        content: trimmed,
      });
      setInputValue('');
    } catch {
      // errors are handled by the hook's consumers if needed
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

            <View style={styles.composerContainer}>
              <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="כתוב הודעה…"
                placeholderTextColor="#9CA3AF"
                multiline
                style={styles.composerInput}
              />
              <Pressable
                onPress={handleSend}
                disabled={
                  inputValue.trim().length === 0 || sendMessageMutation.isPending
                }
                style={({ pressed }) => [
                  styles.sendButton,
                  (pressed || sendMessageMutation.isPending) &&
                    styles.sendButtonPressed,
                  (inputValue.trim().length === 0 ||
                    sendMessageMutation.isPending) &&
                    styles.sendButtonDisabled,
                ]}
              >
                <Text style={styles.sendButtonLabel}>
                  {sendMessageMutation.isPending ? 'שולח…' : 'שלח'}
                </Text>
              </Pressable>
            </View>
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
  messageText: {
    color: '#0f172a',
    fontSize: 15,
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
});

export default ChatPage;

