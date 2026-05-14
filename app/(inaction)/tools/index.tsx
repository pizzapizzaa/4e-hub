import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const TOOLS = [
  { id: 'broadcast', icon: '📡', label: 'Video Broadcast', desc: 'Stream a video to all student screens in real-time.', route: '/(inaction)/broadcast' },
  { id: 'quiz', icon: '📝', label: 'Quiz Generator', desc: 'Generate a quiz for any lesson using AI.', route: null },
  { id: 'timer', icon: '⏱️', label: 'Class Timer', desc: 'Set countdown timers for activities.', route: null },
  { id: 'poll', icon: '📊', label: 'Quick Poll', desc: 'Send a live poll to students.', route: null },
  { id: 'whiteboard', icon: '🖊️', label: 'Shared Whiteboard', desc: 'Collaborate on a live whiteboard.', route: null },
];

export default function TeachingToolsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>🔧 Teaching Tools</Text>
      <Text style={styles.subtitle}>Tools to engage your class in real-time.</Text>

      {TOOLS.map((tool) => (
        <TouchableOpacity
          key={tool.id}
          style={[styles.card, !tool.route && styles.cardDisabled]}
          onPress={() => tool.route && router.push(tool.route as never)}
          disabled={!tool.route}
        >
          <Text style={styles.icon}>{tool.icon}</Text>
          <View style={styles.info}>
            <Text style={styles.label}>{tool.label}</Text>
            <Text style={styles.desc}>{tool.desc}</Text>
          </View>
          {!tool.route && <Text style={styles.soon}>Soon</Text>}
          {tool.route && <Text style={styles.arrow}>›</Text>}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60, gap: 14 },
  heading: { fontSize: 26, fontWeight: '800', color: '#0F2D5A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardDisabled: { opacity: 0.6 },
  icon: { fontSize: 30 },
  info: { flex: 1 },
  label: { fontSize: 16, fontWeight: '700', color: '#222' },
  desc: { fontSize: 13, color: '#888', marginTop: 2 },
  soon: { fontSize: 12, color: '#888', backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  arrow: { fontSize: 22, color: '#AAA' },
});
