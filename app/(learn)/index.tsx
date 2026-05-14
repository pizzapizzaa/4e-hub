import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser } from '@/lib/auth/session';
import { SubjectCard } from '@/components/learn/SubjectCard';

const SUBJECTS = [
  { id: 'english', label: 'English', icon: '🗣️', subtitle: 'English as a Second Language', color: '#2563EB', route: '/(learn)/english' },
  { id: 'maths', label: 'Maths', icon: '🔢', subtitle: 'Numbers, Shapes & Problem Solving', color: '#7C3AED', route: '/(learn)/maths' },
  { id: 'science', label: 'Science', icon: '🔬', subtitle: 'Explore the Natural World', color: '#059669', route: '/(learn)/science' },
];

export default function LearnHomeScreen() {
  const router = useRouter();
  const user = getCurrentUser();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        Hello, {user?.firstName ?? 'Learner'} 👋
      </Text>
      <Text style={styles.subtitle}>What would you like to learn today?</Text>

      <Text style={styles.sectionHeading}>Subjects</Text>
      {SUBJECTS.map((subject) => (
        <SubjectCard
          key={subject.id}
          label={subject.label}
          subtitle={subject.subtitle}
          icon={subject.icon}
          color={subject.color}
          onPress={() => router.push(subject.route as never)}
        />
      ))}

      <View style={styles.quickLinks}>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(learn)/quiz/collection' as never)}>
          <Text style={styles.quickIcon}>📝</Text>
          <Text style={styles.quickLabel}>Practice Quizzes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(learn)/trail' as never)}>
          <Text style={styles.quickIcon}>🗺️</Text>
          <Text style={styles.quickLabel}>My Learning Trail</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60, gap: 14 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#0F2D5A' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 4 },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 4 },
  quickLinks: { flexDirection: 'row', gap: 14, marginTop: 4 },
  quickCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 18, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  quickIcon: { fontSize: 30 },
  quickLabel: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'center' },
});
