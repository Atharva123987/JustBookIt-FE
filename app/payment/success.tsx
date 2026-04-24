import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentSuccessScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string | string[] }>();

  const resolvedBookingId = useMemo(
    () => (Array.isArray(bookingId) ? bookingId[0] : bookingId)?.trim() ?? '',
    [bookingId]
  );

  useEffect(() => {
    // ⏱️ Show screen for 3 seconds FIRST
    const timer = setTimeout(() => {
      if (Platform.OS === 'web') {
        // Try opening app
        if (resolvedBookingId) {
          window.location.href =
            `ticketbookingsystemfe://?bookingId=${resolvedBookingId}&paymentReturn=success`;
        }

        // Fallback to chat after attempt
        setTimeout(() => {
          router.replace({
            pathname: '/',
            params: {
              bookingId: resolvedBookingId,
              fromPayment: 'true',
            },
          });
        }, 1500);
      } else {
        // Native
        router.replace({
          pathname: '/',
          params: {
            bookingId: resolvedBookingId,
            fromPayment: 'true',
          },
        });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [resolvedBookingId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Payment Successful 🎉</Text>
        <Text style={styles.subtitle}>Redirecting to your booking...</Text>
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