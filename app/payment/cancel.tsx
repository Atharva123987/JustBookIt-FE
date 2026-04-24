import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentCancelScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string | string[] }>();

  const resolvedBookingId = useMemo(
    () => (Array.isArray(bookingId) ? bookingId[0] : bookingId)?.trim() ?? '',
    [bookingId]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Platform.OS === 'web') {
        // Try opening app (optional)
        if (resolvedBookingId) {
          window.location.href =
            `ticketbookingsystemfe://?bookingId=${resolvedBookingId}&paymentReturn=cancel`;
        }

        // Fallback → go to chat
        setTimeout(() => {
          router.replace('/');
        }, 1200);
      } else {
        // Native app
        router.replace('/');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [resolvedBookingId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Payment Cancelled ❌</Text>
        <Text style={styles.subtitle}>Your booking was not completed.</Text>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7300B6',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
  },
});