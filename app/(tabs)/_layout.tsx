import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import it from '@/i18n/it';
import { fonts, useColors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Misure della barra in basso: icone 24 px, etichetta 11 px, area di tocco ≥ 44 px. */
const ICON_SIZE = 24;
const LABEL_SIZE = 11;
/** Altezza utile della barra (icona 24 + etichetta 16 + margini), esclusa la safe area. */
const BAR_CONTENT_HEIGHT = 60;

const icon =
  (name: IconName) =>
  ({ color }: { color: unknown }) => <Ionicons name={name} color={color as string} size={ICON_SIZE} />;

export default function TabsLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // Su iPhone con la barra Home lo spazio sicuro in basso è già ampio; senza, lasciamo 8 px.
  const bottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: BAR_CONTENT_HEIGHT + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
        },
        tabBarItemStyle: { minHeight: 44 },
        tabBarIconStyle: { width: ICON_SIZE, height: ICON_SIZE },
        // Poppins ha ascendenti alti: interlinea esplicita per non tagliare le etichette.
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: LABEL_SIZE, lineHeight: 16 },
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
