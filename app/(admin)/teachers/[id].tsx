import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function TeacherDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Teacher Profile</Text>
      <Text style={styles.id}>ID: {id}</Text>
      {/* TODO: load teacher profile, assigned classes, and link to memoir */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20, paddingTop: 60 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0F2D5A', marginBottom: 8 },
  id: { fontSize: 14, color: '#888' },
});
