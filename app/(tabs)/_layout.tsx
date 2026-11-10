import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';

import it from '@/i18n/it';
import { colors, fonts } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icon =
  (name: IconName) =>
  ({ color, size }: { color: unknown; size: number }) => (
    <Ionicons name={name} color={color as string} size={size} />
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="oggi" options={{ title: it.tabs.today, tabBarIcon: icon('sunny-outline') }} />
      <Tabs.Screen name="calendario" options={{ title: it.tabs.calendar, tabBarIcon: icon('calendar-outline') }} />
      <Tabs.Screen name="diario" options={{ title: it.tabs.diary, tabBarIcon: icon('moon-outline') }} />
      <Tabs.Screen name="guide" options={{ title: it.tabs.guides, tabBarIcon: icon('book-outline') }} />
      <Tabs.Screen name="profilo" options={{ title: it.tabs.profile, tabBarIcon: icon('person-outline') }} />
    </Tabs>
  );
}
