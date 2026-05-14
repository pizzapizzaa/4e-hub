import { Tabs } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <IconSymbol name="chart.bar.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="programs/index" options={{ title: 'Programs', tabBarIcon: ({ color }) => <IconSymbol name="book.closed.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="schools/index" options={{ title: 'Schools', tabBarIcon: ({ color }) => <IconSymbol name="building.2.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="teachers/index" options={{ title: 'Teachers', tabBarIcon: ({ color }) => <IconSymbol name="person.2.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="learners/index" options={{ title: 'Learners', tabBarIcon: ({ color }) => <IconSymbol name="graduationcap.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="materials/index" options={{ title: 'Materials', tabBarIcon: ({ color }) => <IconSymbol name="books.vertical.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="settings/index" options={{ title: 'Settings', tabBarIcon: ({ color }) => <IconSymbol name="gearshape.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="sync/index" options={{ title: 'Sync', tabBarIcon: ({ color }) => <IconSymbol name="arrow.triangle.2.circlepath" size={26} color={color} /> }} />
    </Tabs>
  );
}
