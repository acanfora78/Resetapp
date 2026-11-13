import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { format } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, View } from 'react-native';

import { Toggle } from '@/components/Toggle';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { LEGAL_LINKS } from '@/content/legal';
import it from '@/i18n/it';
import { APP } from '@/constants/app';
import { deleteAccount } from '@/lib/account';
import { signOut } from '@/lib/auth';
import { restore } from '@/lib/iap';
import { shareMonthlyReport } from '@/lib/report';
import { useSubscription } from '@/lib/subscription';
import { errorText } from '@/lib/errors';
import { useNightMode } from '@/lib/nightMode';
import type { NightModePref } from '@/lib/nightMode';
import { notificationPrefs, openSystemSettings, requestPermission } from '@/lib/notifications';
import { disablePhoneCalendar, enablePhoneCalendar, isPhoneCalendarEnabled } from '@/lib/phoneCalendar';
import { updateProfile } from '@/lib/profile';
import { useSession, useUserId } from '@/lib/session';
import { toClock } from '@/plan/time';
import { makeStyles, radius, spacing, useColors } from '@/theme';

const NIGHT_OPTIONS: NightModePref[] = ['auto', 'on', 'off'];

export default function Profile() {
  const colors = useColors();
  const styles = useStyles();
  const userId = useUserId();
  const { session, profile, refreshProfile } = useSession();
  const night = useNightMode();
  const [savingNotif, setSavingNotif] = useState(false);

  const [calendarOn, setCalendarOn] = useState(false);
  const [savingCal, setSavingCal] = useState(false);
  useEffect(() => {
    isPhoneCalendarEnabled().then(setCalendarOn);
  }, []);

  const toggleCalendar = (value: boolean) => {
    if (!value) {
      setSavingCal(true);
      disablePhoneCalendar()
        .then(() => setCalendarOn(false))
        .catch((e) => Alert.alert(it.common.error, errorText(e)))
        .finally(() => setSavingCal(false));
      return;
    }
    // Spiegazione prima della richiesta di permesso del sistema.
    Alert.alert(it.phoneCalendar.explainTitle, it.phoneCalendar.explainBody, [
      { text: it.common.cancel, style: 'cancel' },
      {
        text: it.phoneCalendar.allow,
        onPress: async () => {
          if (!profile) return;
          setSavingCal(true);
          try {
            const res = await enablePhoneCalendar(profile);
            setCalendarOn(res === 'enabled');
            if (res === 'denied') {
              Alert.alert(it.phoneCalendar.deniedTitle, it.phoneCalendar.deniedBody, [
                { text: it.common.cancel, style: 'cancel' },
                { text: it.notifications.openSettings, onPress: openSystemSettings },
              ]);
            }
          } catch (e) {
            Alert.alert(it.common.error, errorText(e));
          } finally {
            setSavingCal(false);
          }
        },
      },
    ]);
  };

  const sub = useSubscription();

  const onRestore = async () => {
    if (!APP.PAYWALL_ENFORCED) return Alert.alert(it.onboarding.paywall.restore, it.onboarding.paywall.restoreSoon);
    try {
      const ok = await restore();
      await sub.refresh();
      if (!ok) Alert.alert(it.onboarding.paywall.restore, it.onboarding.paywall.restoreNone);
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
    }
  };

  const onReport = async () => {
    if (!profile) return;
    try {
      await shareMonthlyReport(profile);
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
    }
  };

  const onDelete = () =>
    Alert.alert(it.account.deleteTitle, it.account.deleteBody, [
      { text: it.common.cancel, style: 'cancel' },
      {
        text: it.account.deleteConfirm,
        style: 'destructive',
        onPress: () =>
          Alert.alert(it.account.deleteFinalTitle, it.account.deleteFinalBody, [
            { text: it.common.cancel, style: 'cancel' },
            {
              text: it.account.deleteConfirm,
              style: 'destructive',
              onPress: () => deleteAccount().catch((e) => Alert.alert(it.common.error, errorText(e))),
            },
          ]),
      },
    ]);

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
          <Toggle
            value={notifOn}
            disabled={savingNotif}
            onValueChange={toggleNotifications}
            accessibilityLabel={it.profile.notifications}
          />
        </View>
      </Section>

      <Section title={it.profile.sections.calendar}>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={22} color={colors.text} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium">{it.phoneCalendar.toggle}</AppText>
            <AppText variant="caption">{it.phoneCalendar.hint}</AppText>
          </View>
          <Toggle
            value={calendarOn}
            disabled={savingCal}
            onValueChange={toggleCalendar}
            accessibilityLabel={it.phoneCalendar.toggle}
          />
        </View>
      </Section>

      <Section title={it.profile.sections.nightMode}>
        <View style={styles.inner}>
          <Segmented options={NIGHT_OPTIONS} value={night.pref} onChange={night.setPref} label={(o) => it.profile.nightModeOptions[o]} />
          <AppText variant="caption">{it.profile.nightModeHint}</AppText>
        </View>
      </Section>

      <Section title={it.profile.sections.subscription}>
        <View style={styles.inner}>
          <AppText variant="bodyMedium">
            {sub.active && sub.row
              ? it.profile.subscriptionActive(
                  it.profile.planNames[sub.row.prodotto],
                  sub.row.scadenza ? format(new Date(sub.row.scadenza), 'd MMMM yyyy', { locale: itLocale }) : '',
                )
              : it.profile.subscriptionNone}
          </AppText>
        </View>
        <Row
          icon="card-outline"
          label={it.profile.manageSubscription}
          onPress={() => Linking.openURL(Platform.OS === 'android' ? APP.MANAGE_SUBSCRIPTIONS_URL.android : APP.MANAGE_SUBSCRIPTIONS_URL.ios)}
        />
        <Row icon="refresh-outline" label={it.onboarding.paywall.restore} onPress={onRestore} />
      </Section>

      <Section title={it.profile.sections.data}>
        <Row icon="document-outline" label={it.report.button} onPress={onReport} />
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
      <Button variant="danger" title={it.account.deleteButton} onPress={onDelete} />
      <AppText variant="caption" center>
        {it.profile.version(Constants.expoConfig?.version ?? '')}
      </AppText>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles();
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
  const colors = useColors();
  const styles = useStyles();
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

const useStyles = makeStyles((colors) => ({
  section: { gap: spacing.sm },
  box: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  inner: { padding: spacing.md, gap: spacing.sm },
}));
