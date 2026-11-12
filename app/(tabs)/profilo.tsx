import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { LEGAL_LINKS } from '@/content/legal';
import it from '@/i18n/it';
import { signOut } from '@/lib/auth';
import { errorText } from '@/lib/errors';
import { useNightMode } from '@/lib/nightMode';
import type { NightModePref } from '@/lib/nightMode';
import { notificationPrefs, openSystemSettings, requestPermission } from '@/lib/notifications';
import { updateProfile } from '@/lib/profile';
import { useSession, useUserId } from '@/lib/session';
import { toClock } from '@/plan/time';
import { colors, radius, spacing } from '@/theme';

const NIGHT_OPTIONS: NightModePref[] = ['auto', 'on', 'off'];

export default function Profile() {
  const userId = useUserId();
  const { session, profile, refreshProfile } = useSession();
  const night = useNightMode();
  const [savingNotif, setSavingNotif] = useState(false);

  const prefs = notificationPrefs(profile);
  const notifOn = prefs.abilitate === true;

  const toggleNotifications = async (value: boolean) => {
    setSavingNotif(true);
    try {
      let enabled = value;
      if (value) {
        const res = await requestPermission();
        enabled = res === 'granted';
        if (res === 'denied') {
          Alert.alert(it.notifications.deniedTitle, it.notifications.deniedBody, [
            { text: it.common.cancel, style: 'cancel' },
            { text: it.notifications.openSettings, onPress: openSystemSettings },
          ]);
        }
      }
      await updateProfile(userId, { notifiche: { ...prefs, abilitate: enabled } });
      await refreshProfile(); // ricarica il piano e riprogramma i promemoria
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
    } finally {
      setSavingNotif(false);
    }
  };

  const sleepSummary = profile
    ? it.profile.sleepSummary(
        toClock(profile.sveglia_preferita, '08:00'),
        profile.tragitto_min,
        it.onboarding.habits.hours(profile.fabbisogno_sonno_min),
      )
    : '';

  return (
    <Screen edges={['top']}>
      <AppText variant="title">{it.tabs.profile}</AppText>
      {profile?.nome || session?.user.email ? (
        <AppText secondary>{profile?.nome ?? session?.user.email}</AppText>
      ) : null}

      <Section title={it.profile.sections.plan}>
        <Row icon="time-outline" label={it.profile.shifts} onPress={() => router.push('/impostazioni/turni')} />
        <Row icon="bed-outline" label={it.profile.sleep} detail={sleepSummary} onPress={() => router.push('/impostazioni/sonno')} />
      </Section>

      <Section title={it.profile.sections.reminders}>
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium">{it.profile.notifications}</AppText>
            <AppText variant="caption">{it.profile.notificationsHint}</AppText>
          </View>
          <Switch
            value={notifOn}
            disabled={savingNotif}
            onValueChange={toggleNotifications}
            trackColor={{ true: colors.accent, false: colors.surfaceAlt }}
            thumbColor="#FFFFFF"
            accessibilityLabel={it.profile.notifications}
          />
        </View>
      </Section>

      <Section title={it.profile.sections.nightMode}>
        <View style={styles.inner}>
          <Segmented options={NIGHT_OPTIONS} value={night.pref} onChange={night.setPref} label={(o) => it.profile.nightModeOptions[o]} />
          <AppText variant="caption">{it.profile.nightModeHint}</AppText>
        </View>
      </Section>

      <Section title={it.profile.sections.info}>
        <Row icon="document-text-outline" label={it.profile.terms} onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.terms)} />
        <Row icon="shield-checkmark-outline" label={it.profile.privacy} onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.privacy)} />
        <View style={styles.inner}>
          <AppText variant="caption">{it.profile.disclaimer}</AppText>
        </View>
      </Section>

      {session?.user.email ? (
        <AppText variant="caption" center>
          {it.profile.signedInAs(session.user.email)}
        </AppText>
      ) : null}
      <Button variant="secondary" title={it.profile.signOut} onPress={signOut} />
      <AppText variant="caption" center>
        {it.profile.version(Constants.expoConfig?.version ?? '')}
      </AppText>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="label" secondary>
        {title}
      </AppText>
      <View style={styles.box}>{children}</View>
    </View>
  );
}

function Row(props: { icon: keyof typeof Ionicons.glyphMap; label: string; detail?: string; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]} accessibilityRole="button">
      <Ionicons name={props.icon} size={22} color={colors.text} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium">{props.label}</AppText>
        {props.detail ? <AppText variant="caption">{props.detail}</AppText> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  box: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  inner: { padding: spacing.md, gap: spacing.sm },
});
