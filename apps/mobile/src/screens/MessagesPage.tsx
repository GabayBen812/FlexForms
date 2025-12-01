import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import type { MessagesStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchChatGroups, type ChatGroup } from '../api/chat';
import { useChatSocket } from '../hooks/useChatSocket';

type ChatListItemProps = {
  group: ChatGroup;
  onPress: () => void;
};

const ChatListItem = ({ group, onPress }: ChatListItemProps) => {
  const { name, lastMessagePreview, unreadCount, updatedAt } = group;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chatItem,
        pressed && styles.chatItemPressed,
      ]}
    >
      <View style={styles.chatItemTextGroup}>
        <Text style={styles.chatItemTitle}>{name}</Text>
        {lastMessagePreview ? (
          <Text style={styles.chatItemSubtitle} numberOfLines={1}>
            {lastMessagePreview}
          </Text>
        ) : null}
      </View>
      <View style={styles.chatItemMetaGroup}>
        {updatedAt ? (
          <Text style={styles.chatItemMeta}>
            {new Date(updatedAt).toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        ) : null}
        {typeof unreadCount === 'number' && unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const MessagesPage = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<MessagesStackParamList>>();
  const { isConnected } = useChatSocket({ enabled: true });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['chat', 'groups'],
    queryFn: fetchChatGroups,
  });

  const groups = data ?? [];

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>אין קבוצות צ'אט זמינות</Text>
        <Text style={styles.emptyStateSubtitle}>
          עדיין לא הוקמו קבוצות צ'אט לארגון שלך.
        </Text>
      </View>
    ),
    []
  );

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerBadge}>הודעות</Text>
              <Text style={styles.headerTitle}>כל קבוצות הצ'אט</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                isConnected ? styles.statusPillOnline : styles.statusPillOffline,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isConnected ? styles.statusDotOnline : styles.statusDotOffline,
                ]}
              />
              <Text style={styles.statusText}>
                {isConnected ? 'מחובר בזמן אמת' : 'לא מחובר'}
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#457B9D" />
              <Text style={styles.centerText}>טוען קבוצות…</Text>
            </View>
          ) : isError ? (
            <View style={styles.centerContent}>
              <Text style={styles.errorText}>אירעה שגיאה בטעינת הקבוצות.</Text>
              <Pressable
                onPress={() => refetch()}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.retryButtonPressed,
                ]}
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
                  group={item}
                  onPress={() =>
                    navigation.navigate('ChatPage', {
                      groupId: item.id,
                      groupName: item.name,
                    })
                  }
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
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerBadge: {
    alignSelf: 'flex-end',
    color: '#457B9D',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillOnline: {
    borderColor: '#4ade80',
    backgroundColor: '#dcfce7',
  },
  statusPillOffline: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginLeft: 8,
  },
  statusDotOnline: {
    backgroundColor: '#22c55e',
  },
  statusDotOffline: {
    backgroundColor: '#9ca3af',
  },
  statusText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '500',
  },
  chatList: {
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  chatItem: {
    flexDirection: 'row-reverse',
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
  chatItemPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
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
    gap: 16,
  },
  centerText: {
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

export default MessagesPage;
