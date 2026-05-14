import { Tabs } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function InActionLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <IconSymbol name="rectangle.grid.2x2.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="tools/index" options={{ title: 'Tools', tabBarIcon: ({ color }) => <IconSymbol name="wrench.and.screwdriver.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="broadcast/index" options={{ title: 'Broadcast', tabBarIcon: ({ color }) => <IconSymbol name="antenna.radiowaves.left.and.right" size={26} color={color} /> }} />
      <Tabs.Screen name="classes/index" options={{ title: 'Classes', tabBarIcon: ({ color }) => <IconSymbol name="person.3.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="students/index" options={{ title: 'Students', tabBarIcon: ({ color }) => <IconSymbol name="graduationcap.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="memoir/index" options={{ title: 'Memoir', tabBarIcon: ({ color }) => <IconSymbol name="note.text" size={26} color={color} /> }} />
    </Tabs>
  );
}
