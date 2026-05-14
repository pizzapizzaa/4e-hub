import { Tabs } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function LearnLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <IconSymbol name="house.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="english/index" options={{ title: 'English', tabBarIcon: ({ color }) => <IconSymbol name="text.book.closed.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="maths/index" options={{ title: 'Maths', tabBarIcon: ({ color }) => <IconSymbol name="function" size={26} color={color} /> }} />
      <Tabs.Screen name="science/index" options={{ title: 'Science', tabBarIcon: ({ color }) => <IconSymbol name="atom" size={26} color={color} /> }} />
      <Tabs.Screen name="quiz/index" options={{ title: 'Quiz', tabBarIcon: ({ color }) => <IconSymbol name="checkmark.circle.fill" size={26} color={color} /> }} />
      <Tabs.Screen name="trail/index" options={{ title: 'My Trail', tabBarIcon: ({ color }) => <IconSymbol name="map.fill" size={26} color={color} /> }} />
    </Tabs>
  );
}
