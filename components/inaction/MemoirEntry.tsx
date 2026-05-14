import { View, Text, StyleSheet } from 'react-native';
import type { TeacherMemoir } from '@/types';

interface Props {
  memoir: TeacherMemoir;
}

export function MemoirEntry({ memoir }: Props) {
  const date = new Date(memoir.createdAt).toLocaleDateString();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{date}</Text>
        {memoir.isPrivate && (
          <View style={styles.privateBadge}>
            <Text style={styles.privateText}>🔒 Private</Text>
          </View>
        )}
      </View>
      <Text style={styles.note}>{memoir.note}</Text>
      {memoir.tags && memoir.tags.length > 0 && (
        <View style={styles.tags}>
          {memoir.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8, borderLeftWidth: 4, borderLeftColor: '#0F2D5A', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: '#888' },
  privateBadge: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  privateText: { fontSize: 11, color: '#555' },
  note: { fontSize: 14, color: '#333', lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
});
