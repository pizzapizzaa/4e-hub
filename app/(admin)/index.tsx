import { SyncStatusCard } from '@/components/admin/SyncStatus';
import { getLearners, getPrograms, getSchools, getSyncStatus, getTeachers } from '@/lib/api/admin';
import type { SyncStatus } from '@/types';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ schools: 0, programs: 0, teachers: 0, learners: 0 });
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [schools, programs, teachers, learners, sync] = await Promise.all([
          getSchools(),
          getPrograms(),
          getTeachers(),
          getLearners(),
          getSyncStatus(),
        ]);
        setStats({
          schools: schools.length,
          programs: programs.length,
          teachers: teachers.length,
          learners: learners.length,
        });
        setSyncStatus(sync);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#16A34A" />;

  if (error) return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>4E Global Admin</Text>

      <View style={styles.grid}>
        <StatCard label="Schools"  value={stats.schools}  icon="🏫"  color="#16A34A" />
        <StatCard label="Programs" value={stats.programs} icon="📚"  color="#F97316" />
        <StatCard label="Teachers" value={stats.teachers} icon="👩‍🏫" color="#FACC15" />
        <StatCard label="Learners" value={stats.learners} icon="🎓"  color="#F97316" />
      </View>

      {syncStatus && <SyncStatusCard status={syncStatus} />}
    </ScrollView>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopWidth: 4, borderTopColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60 },
  loader: { flex: 1, marginTop: 100 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#DC2626', fontSize: 15, textAlign: 'center' },
  heading: { fontSize: 28, fontWeight: '800', color: '#16A34A', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    width: '46%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: '800', color: '#1F2937' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 2 },
});
