import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssistantBubble, IntentAttachment } from '@/components/chat/cards';
import { ChatAttachment } from '@/components/chat/types';
import { AIQueryResponse, queryAI } from '@/services/ai-chat';

function BackToChatButton() {
  return (
    <Pressable style={styles.primaryAction} onPress={() => router.replace('/')}>
      <Text style={styles.primaryActionText}>Back to chat</Text>
    </Pressable>
  );
}

export default function PaymentSuccessScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string | string[] }>();
  const resolvedBookingId = useMemo(
    () => (Array.isArray(bookingId) ? bookingId[0] : bookingId)?.trim() ?? '',
    [bookingId]
  );
  const [isLoading, setIsLoading] = useState(true);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [chatResponse, setChatResponse] = useState('Fetching your booking confirmation...');

  useEffect(() => {
    let isMounted = true;

    const loadBooking = async () => {
      if (!resolvedBookingId) {
        setChatResponse('Payment completed, but no booking reference was provided.');
        setIsLoading(false);
        return;
      }

      try {
        const response: AIQueryResponse = await queryAI({
          q: 'get my booking',
          bookingId: resolvedBookingId,
        });

        if (!isMounted) {
          return;
        }

        if (response.intent !== 'get_booking') {
          throw new Error(`Unexpected payment return intent: ${response.intent}`);
        }

        setChatResponse(response.chat_response);
        setAttachment({ intent: 'get_booking', data: response.api_data });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Unable to fetch the booking confirmation.';

        setChatResponse('Payment completed, but we could not load your booking yet.');
        Alert.alert('Booking Fetch Error', message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBooking();

    return () => {
      isMounted = false;
    };
  }, [resolvedBookingId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#4D007A', '#5E0493', '#7300B6']}
        locations={[0.08, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.background}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Payment Successful</Text>
          <AssistantBubble text={chatResponse} />

          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.loadingText}>Retrieving your latest booking status...</Text>
            </View>
          ) : null}

          {!isLoading && attachment ? (
            <IntentAttachment
              attachment={attachment}
              onMoviePress={() => undefined}
              onShowPress={() => undefined}
              onSeatCountPress={() => undefined}
              onPaymentMethodSelect={() => undefined}
              onPaymentPress={() => undefined}
            />
          ) : null}

          <BackToChatButton />
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '300',
  },
  loadingCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(194, 192, 192, 0.18)',
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryAction: {
    marginTop: 8,
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
