import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import type { MessagesStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchChatGroups } from '../api/chat';

type ChatListItemProps = {
  name: string;
  subtitle?: string | null;
  unreadCount?: number;
  updatedAt?: string;
};

const ChatListItem = ({ name, subtitle, unreadCount, updatedAt }: ChatListItemProps) => (
  <View style={styles.chatItem}>
    <View style={styles.chatItemTextGroup}>
      <Text style={styles.chatItemTitle}>{name}</Text>
      {subtitle ? <Text style={styles.chatItemSubtitle}>{subtitle}</Text> : null}
    </View>
    <View style={styles.chatItemMetaGroup}>
      {updatedAt ? <Text style={styles.chatItemMeta}>{updatedAt}</Text> : null}
      {typeof unreadCount === 'number' && unreadCount > 0 ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
        </View>
      ) : null}
    </View>
  </View>
);

const ChatPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MessagesStackParamList>>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['chat', 'groups'],
    queryFn: fetchChatGroups,
  });

  const groups = data ?? [];

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>אין קבוצות צ'אט זמינות</Text>
        <Text style={styles.emptyStateSubtitle}>צור קבוצה חדשה או נסה לרענן מאוחר יותר.</Text>
      </View>
    ),
    []
  );

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <Text style={styles.backButtonLabel}>חזרה</Text>
            </Pressable>
            <Text style={styles.headerTitle}>צ'אט</Text>
          </View>

          {isLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#457B9D" />
              <Text style={styles.statusText}>טוען קבוצות…</Text>
            </View>
          ) : isError ? (
            <View style={styles.centerContent}>
              <Text style={styles.errorText}>אירעה שגיאה בטעינת הקבוצות.</Text>
              <Pressable
                onPress={() => refetch()}
                style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
              >
                <Text style={styles.retryButtonLabel}>נסה שוב</Text>
              </Pressable>
            </View>
          ) : groups.length === 0 ? (
            emptyState
          ) : (
            <FlatList
              data={groups}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChatListItem
                  name={item.name}
                  subtitle={item.lastMessagePreview}
                  unreadCount={item.unreadCount}
                  updatedAt={item.updatedAt}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.chatItemSeparator} />}
              contentContainerStyle={styles.chatList}
            />
          )}
        </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'right',
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '700',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
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
  chatList: {
    paddingBottom: 32,
  },
  chatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chatItemSeparator: {
    height: 14,
  },
  chatItemTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  chatItemTitle: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '600',
  },
  chatItemSubtitle: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 14,
  },
  chatItemMetaGroup: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 16,
  },
  chatItemMeta: {
    color: '#94A3B8',
    fontSize: 12,
  },
  unreadBadge: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FF6B4D',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  statusText: {
    color: '#64748B',
    fontSize: 16,
  },
  errorText: {
    color: '#E85A3F',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFD4C4',
    backgroundColor: '#FFF5F3',
  },
  retryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  retryButtonLabel: {
    color: '#FF6B4D',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyStateTitle: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '600',
  },
  emptyStateSubtitle: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default ChatPage;

