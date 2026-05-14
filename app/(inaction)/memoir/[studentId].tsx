import { MemoirEntry } from '@/components/inaction/MemoirEntry';
import { createMemoir, getMemoirs, getTeacherClasses } from '@/lib/api/inaction';
import { getCurrentUser } from '@/lib/auth/session';
import type { TeacherMemoir } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function MemoirStudentScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const user = getCurrentUser();

  const [memoirs, setMemoirs] = useState<TeacherMemoir[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [saving, setSaving] = useState(false);
  // classId resolved from IDOR check (SEC-06 / BUG-01)
  const [resolvedClassId, setResolvedClassId] = useState<string | null>(null);

  // QA-03: validate URL param early
  useEffect(() => {
    if (!studentId) {
      router.replace('/(inaction)/memoir' as never);
    }
  }, [studentId]);

  // SEC-06: verify the student belongs to one of the teacher's classes
  // and derive classId needed for createMemoir (BUG-01)
  useEffect(() => {
    if (!user || !studentId) return;
    getTeacherClasses(user.id).then((classes) => {
      const matchingClass = classes.find((c) => c.studentIds.includes(studentId));
      if (!matchingClass) {
        Alert.alert('Access denied', 'This student is not in any of your classes.');
        router.replace('/(inaction)/memoir' as never);
        return;
      }
      setResolvedClassId(matchingClass.id);
    }).catch(() => {
      Alert.alert('Error', 'Could not verify class access. Please try again.');
      router.replace('/(inaction)/memoir' as never);
    });
  }, [studentId, user]);

  // QA-05: useCallback so the dep array is stable
  const load = useCallback(async () => {
    if (!user || !studentId) return;
    const data = await getMemoirs(user.id, studentId);
    setMemoirs(data);
    setLoading(false);
  }, [studentId, user]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!note.trim()) { Alert.alert('Empty note', 'Please write something before saving.'); return; }
    if (!user || !studentId || !resolvedClassId) return;
    setSaving(true);
    try {
      // BUG-01: include classId (required by TeacherMemoir type and DB schema)
      await createMemoir({
        teacherId: user.id,
        studentId,
        classId: resolvedClassId,
        note: note.trim(),
        tags: [],
        isPrivate,
      });
      setNote('');
      await load();
    } catch {
      Alert.alert('Error', 'Could not save memoir entry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>📓 Memoir for Student</Text>
      <Text style={styles.studentId}>{studentId}</Text>

      <View style={styles.form}>
        <Text style={styles.label}>New Note</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Write your observation or note here..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={5}
          value={note}
          onChangeText={setNote}
          textAlignVertical="top"
        />
        <View style={styles.privateRow}>
          <Text style={styles.privateLabel}>Private (visible only to you)</Text>
          <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ true: '#0F2D5A' }} />
        </View>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveButtonText}>Save Entry</Text>
          }
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Past Entries ({memoirs.length})</Text>
      {loading
        ? <ActivityIndicator color="#0F2D5A" />
        : memoirs.map((m) => <MemoirEntry key={m.id} memoir={m} />)
      }
      {!loading && memoirs.length === 0 && (
        <Text style={styles.empty}>No entries yet. Add your first note above.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60, gap: 16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0F2D5A', marginBottom: 2 },
  studentId: { fontSize: 12, color: '#888', fontFamily: 'monospace', marginBottom: 8 },
  form: { backgroundColor: '#fff', borderRadius: 14, padding: 18, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  label: { fontSize: 14, fontWeight: '700', color: '#444' },
  textarea: { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 110, color: '#222', backgroundColor: '#FAFAFA' },
  privateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  privateLabel: { fontSize: 14, color: '#555' },
  saveButton: { backgroundColor: '#0F2D5A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  empty: { textAlign: 'center', color: '#999', fontSize: 14 },
});
