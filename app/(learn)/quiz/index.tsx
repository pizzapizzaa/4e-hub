import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function QuizHomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>📝 Quiz</Text>
      <Text style={styles.subtitle}>Test your knowledge or practise with saved quizzes.</Text>

      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: '#2563EB' }]}
          onPress={() => router.push('/(learn)/quiz/collection' as never)}
        >
          <Text style={styles.cardIcon}>📚</Text>
          <Text style={styles.cardLabel}>Quiz Collection</Text>
          <Text style={styles.cardDesc}>Practice saved session quizzes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: '#7C3AED' }]}
          onPress={() => router.push('/(learn)/trail' as never)}
        >
          <Text style={styles.cardIcon}>🗺️</Text>
          <Text style={styles.cardLabel}>Learning Trail</Text>
          <Text style={styles.cardDesc}>See completed lessons and scores</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        After each lesson, a quiz is automatically generated and added to your collection.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60, gap: 20 },
  heading: { fontSize: 26, fontWeight: '800', color: '#0F2D5A' },
  subtitle: { fontSize: 15, color: '#666' },
  grid: { gap: 14 },
  card: { borderRadius: 16, padding: 22, gap: 8 },
  cardIcon: { fontSize: 32 },
  cardLabel: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  hint: { fontSize: 13, color: '#999', textAlign: 'center', fontStyle: 'italic' },
});
