import { useCallback, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import type { MessagesStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchChatGroups, type ChatGroup } from '../api/chat';
import { useChatSocket } from '../hooks/useChatSocket';
import { usePinChatGroup } from '../hooks/usePinChatGroup';
import { ChatAvatar } from '../components/chat/ChatAvatar';
import { SkeletonChatList } from '../components/chat/SkeletonChatList';
import { SearchBar } from '../components/chat/SearchBar';
import { formatChatTimestamp } from '../utils/dateUtils';

type ChatListItemProps = {
  group: ChatGroup;
  onPress: () => void;
  onLongPress: () => void;
};

const ChatListItem = ({ group, onPress, onLongPress }: ChatListItemProps) => {
  const { name, lastMessagePreview, unreadCount, updatedAt, isReadOnlyForParents, isPinned } = group;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress();
  }, [onLongPress]);

  const formattedTime = useMemo(() => {
    return updatedAt ? formatChatTimestamp(updatedAt) : '';
  }, [updatedAt]);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        styles.chatItem,
        pressed && styles.chatItemPressed,
      ]}
    >
      {/* Avatar */}
      <ChatAvatar name={name} size={58} />

      {/* Content */}
      <View style={styles.chatItemTextGroup}>
        <View style={styles.chatItemTitleRow}>
          {isPinned && (
            <Feather name="pin" size={16} color="#457B9D" style={styles.pinIcon} />
          )}
          <Text style={styles.chatItemTitle} numberOfLines={1}>{name}</Text>
          {isReadOnlyForParents && (
            <View style={styles.readOnlyBadge}>
              <Text style={styles.readOnlyBadgeText}>קריאה בלבד</Text>
            </View>
          )}
        </View>
        {lastMessagePreview ? (
          <Text style={styles.chatItemSubtitle} numberOfLines={2}>
            {lastMessagePreview}
          </Text>
        ) : (
          <Text style={styles.chatItemSubtitleEmpty}>אין הודעות עדיין</Text>
        )}
      </View>

      {/* Meta Info */}
      <View style={styles.chatItemMetaGroup}>
        {formattedTime ? (
          <Text style={styles.chatItemMeta}>{formattedTime}</Text>
        ) : null}
        {typeof unreadCount === 'number' && unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const pinMutation = usePinChatGroup();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['chat', 'groups'],
    queryFn: fetchChatGroups,
  });

  const groups = data ?? [];

  // Separate and sort groups: pinned first, then by updatedAt
  const sortedGroups = useMemo(() => {
    const pinned = groups.filter((g) => g.isPinned);
    const unpinned = groups.filter((g) => !g.isPinned);

    // Sort pinned by pinnedAt (most recent first)
    pinned.sort((a, b) => {
      const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      return bTime - aTime;
    });

    // Sort unpinned by updatedAt (most recent first)
    unpinned.sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });

    return [...pinned, ...unpinned];
  }, [groups]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedGroups;
    }

    const query = searchQuery.toLowerCase();
    return sortedGroups.filter((group) => {
      const nameMatch = group.name.toLowerCase().includes(query);
      const messageMatch = group.lastMessagePreview?.toLowerCase().includes(query);
      return nameMatch || messageMatch;
    });
  }, [sortedGroups, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const toggleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearchVisible((prev) => {
      if (prev) {
        // Closing search
        setSearchQuery('');
        Keyboard.dismiss();
        return false;
      }
      // Opening search
      return true;
    });
  }, []);

  const handlePinToggle = useCallback(
    (group: ChatGroup) => {
      const isPinned = group.isPinned || false;
      const action = isPinned ? 'בטל נעיצה' : 'נעץ';
      const pinnedCount = groups.filter((g) => g.isPinned).length;

      // Check if trying to pin when already at max
      if (!isPinned && pinnedCount >= 5) {
        Alert.alert(
          'מגבלת נעיצה',
          'ניתן לנעוץ עד 5 צ\'אטים. בטל נעיצה של צ\'אט אחר כדי להמשיך.',
          [{ text: 'אישור', style: 'default' }]
        );
        return;
      }

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['ביטול', action],
            cancelButtonIndex: 0,
            title: group.name,
          },
          (buttonIndex) => {
            if (buttonIndex === 1) {
              pinMutation.mutate({
                groupId: group.id,
                isPinned: !isPinned,
              });
            }
          }
        );
      } else {
        Alert.alert(
          group.name,
          `האם אתה בטוח שברצונך ל${action} את הצ'אט הזה?`,
          [
            { text: 'ביטול', style: 'cancel' },
            {
              text: action,
              style: 'default',
              onPress: () => {
                pinMutation.mutate({
                  groupId: group.id,
                  isPinned: !isPinned,
                });
              },
            },
          ]
        );
      }
    },
    [pinMutation, groups]
  );

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

  const renderChatItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatGroup>) => (
      <ChatListItem
        group={item}
        onPress={() =>
          navigation.navigate('ChatPage', {
            groupId: item.id,
            groupName: item.name,
          })
        }
        onLongPress={() => handlePinToggle(item)}
      />
    ),
    [navigation, handlePinToggle]
  );

  const keyExtractor = useCallback((item: ChatGroup) => item.id, []);

  const itemSeparator = useCallback(() => <View style={styles.chatItemSeparator} />, []);

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextGroup}>
                <Text style={styles.headerBadge}>הודעות</Text>
                <Text style={styles.headerTitle}>כל קבוצות הצ'אט</Text>
              </View>
              <Pressable
                onPress={toggleSearch}
                style={({ pressed }) => [
                  styles.searchButton,
                  pressed && styles.searchButtonPressed,
                ]}
              >
                <Feather
                  name={isSearchVisible ? 'x' : 'search'}
                  size={24}
                  color="#457B9D"
                />
              </Pressable>
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

          {isSearchVisible && (
            <View style={styles.searchContainer}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="חפש קבוצות..."
                autoFocus
              />
            </View>
          )}

          {isLoading ? (
            <SkeletonChatList />
          ) : isError ? (
            <View style={styles.centerContent}>
              <Text style={styles.errorText}>אירעה שגיאה בטעינת הקבוצות.</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  refetch();
                }}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.retryButtonPressed,
                ]}
              >
                <Text style={styles.retryButtonLabel}>נסה שוב</Text>
              </Pressable>
            </View>
          ) : filteredGroups.length === 0 ? (
            searchQuery.trim() ? (
              <View style={styles.emptyState}>
                <Feather name="search" size={48} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>לא נמצאו תוצאות</Text>
                <Text style={styles.emptyStateSubtitle}>
                  נסה לחפש בביטוי אחר
                </Text>
              </View>
            ) : (
              emptyState
            )
          ) : (
            <FlatList
              data={filteredGroups}
              keyExtractor={keyExtractor}
              renderItem={renderChatItem}
              ItemSeparatorComponent={itemSeparator}
              contentContainerStyle={styles.chatList}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor="#457B9D"
                  colors={['#457B9D']}
                />
              }
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              windowSize={21}
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  header: {
    marginBottom: 12,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerBadge: {
    alignSelf: 'flex-end',
    color: '#457B9D',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#1e293b',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    width: 10,
    height: 10,
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
    fontSize: 14,
    fontWeight: '600',
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  searchContainer: {
    marginBottom: 12,
  },
  chatList: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  chatItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    gap: 14,
    minHeight: 88,
  },
  chatItemPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  chatItemSeparator: {
    height: 16,
  },
  chatItemTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  chatItemTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  pinIcon: {
    marginLeft: 2,
  },
  chatItemTitle: {
    color: '#1e293b',
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 26,
  },
  readOnlyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  readOnlyBadgeText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  chatItemSubtitle: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  chatItemSubtitleEmpty: {
    marginTop: 6,
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  chatItemMetaGroup: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 16,
  },
  chatItemMeta: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
  },
  unreadBadge: {
    minWidth: 32,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FF6B4D',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 15,
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
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFD4C4',
    backgroundColor: '#FFF5F3',
    minHeight: 48,
  },
  retryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  retryButtonLabel: {
    color: '#FF6B4D',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyStateTitle: {
    color: '#1e293b',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  emptyStateSubtitle: {
    color: '#64748B',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default MessagesPage;
