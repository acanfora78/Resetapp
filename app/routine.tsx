import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Screen } from '@/components/Screen';
import { POST_NIGHT_CHECKLIST } from '@/content/guides';
import it from '@/i18n/it';
import { makeStyles, radius, spacing, useColors } from '@/theme';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Routine post-notte: checklist di decompressione e audio di rilassamento. */
export default function PostNightRoutine() {
  const colors = useColors();
  const styles = useStyles();
  const player = useAudioPlayer(require('../assets/audio/routine-post-notte.mp3'));
  const status = useAudioPlayerStatus(player);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Suona anche con l'iPhone in modalità silenziosa.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const toggle = (id: string, v: boolean) =>
    setChecked((c) => {
      const n = new Set(c);
      if (v) n.add(id);
      else n.delete(id);
      return n;
    });

  const duration = status.duration || 0;
  const progress = duration ? Math.min(1, status.currentTime / duration) : 0;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={it.common.back}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <AppText variant="title">{it.routine.title}</AppText>
      <AppText secondary>{it.routine.subtitle}</AppText>

      <View style={styles.card}>
        <AppText variant="heading">{it.routine.checklistTitle}</AppText>
        {POST_NIGHT_CHECKLIST.map((item) => (
          <Checkbox key={item.id} checked={checked.has(item.id)} onChange={(v) => toggle(item.id, v)}>
            <View style={styles.row}>
              <Text style={styles.icon}>{item.icon}</Text>
              <AppText>{item.text}</AppText>
            </View>
          </Checkbox>
        ))}
        {checked.size === POST_NIGHT_CHECKLIST.length ? (
          <AppText variant="bodyMedium" color={colors.accent}>
            {it.routine.allDone}
          </AppText>
        ) : null}
      </View>

      <View style={styles.card}>
        <AppText variant="heading">{it.routine.audioTitle}</AppText>
        <AppText variant="caption">{it.routine.audioHint}</AppText>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
        <AppText variant="caption">{`${mmss(status.currentTime)} / ${mmss(duration)}`}</AppText>
        <Button
          title={status.playing ? it.routine.pause : it.routine.play}
          icon={<Ionicons name={status.playing ? 'pause' : 'play'} size={20} color={colors.onAccent} />}
          onPress={() => (status.playing ? player.pause() : player.play())}
        />
        <Button
          variant="ghost"
          title={it.routine.restart}
          onPress={() => {
            player.seekTo(0);
            player.play();
          }}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { fontSize: 20 },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.accent },
}));
