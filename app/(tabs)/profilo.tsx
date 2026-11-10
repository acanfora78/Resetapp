import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import it from '@/i18n/it';
import { signOut } from '@/lib/auth';
import { useSession } from '@/lib/session';

export default function Profile() {
  const { session } = useSession();
  return (
    <Screen edges={['top']}>
      <AppText variant="title">{it.tabs.profile}</AppText>
      <View style={styles.center}>
        <AppText secondary center>
          {it.placeholder.comingSoon}
        </AppText>
      </View>
      {session?.user.email ? (
        <AppText variant="caption" center>
          {it.profile.signedInAs(session.user.email)}
        </AppText>
      ) : null}
      <Button variant="secondary" title={it.profile.signOut} onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
});
