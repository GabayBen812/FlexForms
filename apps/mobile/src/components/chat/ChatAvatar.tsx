import { View, Text, StyleSheet } from 'react-native';

type ChatAvatarProps = {
  name: string;
  size?: number;
};

/**
 * Generates a consistent color based on the name string
 */
function getColorFromName(name: string): string {
  const colors = [
    '#457B9D', // Blue
    '#E63946', // Red
    '#F4A261', // Orange
    '#2A9D8F', // Teal
    '#E76F51', // Coral
    '#8B5CF6', // Purple
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#6366F1', // Indigo
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Extracts initials from a name (max 2 characters)
 */
function getInitials(name: string): string {
  if (!name) return '?';

  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word: take first 2 characters
    return words[0].slice(0, 2).toUpperCase();
  }

  // Multiple words: take first character of first two words
  return (words[0][0] + words[1][0]).toUpperCase();
}

export const ChatAvatar = ({ name, size = 48 }: ChatAvatarProps) => {
  const backgroundColor = getColorFromName(name);
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});





