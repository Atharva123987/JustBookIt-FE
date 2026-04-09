import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentCancelScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string | string[] }>();
  const resolvedBookingId = Array.isArray(bookingId) ? bookingId[0] : bookingId;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#4D007A', '#5E0493', '#7300B6']}
        locations={[0.08, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.background}>
        <View style={styles.content}>
          <Text style={styles.title}>Payment Cancelled</Text>
          <Text style={styles.body}>
            Your checkout was cancelled. You can return to the chat and resume the booking flow
            whenever you’re ready.
          </Text>
          {resolvedBookingId ? (
            <Text style={styles.reference}>Booking reference: {resolvedBookingId}</Text>
          ) : null}
          <Pressable style={styles.primaryAction} onPress={() => router.replace('/')}>
            <Text style={styles.primaryActionText}>Back to chat</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7300B6',
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '300',
  },
  body: {
    marginTop: 14,
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 16,
    lineHeight: 24,
  },
  reference: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  primaryAction: {
    marginTop: 28,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primaryActionText: {
    color: '#3F0062',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
});
