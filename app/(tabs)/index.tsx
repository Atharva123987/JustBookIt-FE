import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardEvent,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssistantBubble, IntentAttachment, PromptCard, UserBubble } from '@/components/chat/cards';
import { PROMPTS_BY_INTENT } from '@/components/chat/constants';
import { ChatAttachment, ChatContext, ChatMessage, PaymentMethod, ShowWithFormat } from '@/components/chat/types';
import {
  AIQueryRequest,
  AIQueryResponse,
  BookingData,
  MovieSummary,
  queryAI,
} from '@/services/ai-chat';
import { getOrCreateDeviceId, loadPersistedChatState, persistChatState } from '@/services/chat-storage';

const BRAND_LOGO_IMAGE = require('../../assets/images/brand-logo.png');
const POPCORN_IMAGE = require('../../assets/images/popcorn.png');
const IS_WEB = Platform.OS === 'web';

function resetLaunchSensitiveChatContext(chatContext: ChatContext): ChatContext {
  return {
    ...chatContext,
    selectedMovieId: undefined,
    selectedShowId: undefined,
    pendingShow: undefined,
    seatLayout: undefined,
    selectedSeatNumbers: [],
  };
}

function parseSeatSelectionPrompt(value: string) {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  if (!normalized) {
    return null;
  }

  const seats = normalized
    .split(',')
    .map((seat) => seat.trim())
    .filter(Boolean);

  if (seats.length === 0 || seats.some((seat) => !/^[A-Z]+\d+$/.test(seat))) {
    return null;
  }

  return Array.from(new Set(seats));
}

function TypingBubble() {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDotCount((currentCount) => (currentCount + 1) % 4);
    }, 350);

    return () => clearInterval(intervalId);
  }, []);

  return <AssistantBubble text={`Typing${'.'.repeat(dotCount)}`} />;
}

export default function HomeScreen() {
  const [prompt, setPrompt] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext>({});
  const inputRef = useRef<TextInput>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isProcessingPaymentReturn, setIsProcessingPaymentReturn] = useState(false);
  const paymentReturnHandledRef = useRef<string | null>(null);
  const { bookingId: paymentReturnBookingId, paymentReturn } = useLocalSearchParams<{
    bookingId?: string | string[];
    paymentReturn?: string | string[];
  }>();
  const resolvedPaymentReturnBookingId = useMemo(
    () =>
      typeof paymentReturnBookingId === 'string'
        ? paymentReturnBookingId
        : paymentReturnBookingId?.[0] ?? '',
    [paymentReturnBookingId]
  );
  const resolvedPaymentReturn = useMemo(
    () => (typeof paymentReturn === 'string' ? paymentReturn : paymentReturn?.[0] ?? ''),
    [paymentReturn]
  );
  const visibleQuickPrompts = useMemo(() => {
    const prompts =
      (lastIntent && PROMPTS_BY_INTENT[lastIntent]) ||
      PROMPTS_BY_INTENT.default;

    return prompts.filter((item) => item !== prompt);
  }, [prompt, lastIntent]);

  const scrollChatToEnd = () => {
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const appendAssistantResponse = (response: AIQueryResponse) => {
    let attachment: ChatAttachment | undefined;

    switch (response.intent) {
      case 'search_all_movies':
        if (response.api_data.data.movies.length > 0) {
          attachment = { intent: response.intent, data: response.api_data };
        }
        break;
      case 'movie_show_timetable':
        if (response.api_data.show_timings.data.length > 0) {
          attachment = { intent: response.intent, data: response.api_data };
        }
        break;
      case 'query_seats':
        if (response.api_data.data) {
          attachment = { intent: response.intent, data: response.api_data };
        }
        break;
      case 'query_seat_availability':
        if (typeof response.api_data.available_seats === 'number') {
          attachment = { intent: response.intent, data: response.api_data };
        }
        break;
      case 'book_movie':
        if (response.api_data.data) {
          attachment = { intent: response.intent, data: response.api_data };
        }
        break;
      case 'get_booking':
        if (response.api_data.data) {
          attachment = { intent: response.intent, data: response.api_data };
        }
        break;
    }
    setLastIntent(response.intent);
    const allowedNoAttachmentIntents = [
      'search_all_movies',
      'movie_show_timetable',
      'query_seats',
      'query_seat_availability',
      'book_movie',
      'get_booking',
      'unknown',
      'unsupported_feature',
      'small_talk',
      'need_more_info'
    ];

    if (!attachment && !allowedNoAttachmentIntents.includes(response.intent)) {
      throw new Error('Unsupported assistant response attachment.');
    }

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text: response.chat_response,
      attachment,
    };

    setMessages((currentMessages) => [...currentMessages, assistantMessage]);

    if (response.intent === 'movie_show_timetable') {
      setChatContext((currentContext) => ({
        ...currentContext,
        selectedMovieId: response.api_data.movie_details.data.movie.id,
        seatLayout: undefined,
        selectedSeatNumbers: [],
      }));
    }

    if (response.intent === 'query_seats' && response.api_data.data) {
      const theatreLayout = response.api_data.data;

      setChatContext((currentContext) => ({
        ...currentContext,
        selectedShowId: theatreLayout.id,
        seatLayout: theatreLayout,
        selectedSeatNumbers: [],
      }));
    }

    if (response.intent === 'book_movie' && response.api_data.data) {
      const bookingData = response.api_data.data;

      setChatContext((currentContext) => ({
        ...currentContext,
        bookingId: bookingData.booking_id,
        selectedShowId: bookingData.show_id,
        seatLayout: undefined,
        selectedSeatNumbers: [],
      }));
    }

    if (response.intent === 'get_booking' && response.api_data.data) {
      const bookingData = response.api_data.data;

      setChatContext((currentContext) => ({
        ...currentContext,
        bookingId: bookingData.booking_id,
        selectedShowId: bookingData.show_id,
      }));
    }
  };

  const handleSuggestionPress = async (suggestion: string) => {
    await sendQuery(suggestion, undefined, suggestion);
  };

  const sendQuery = async (
    query: string,
    overrides?: Partial<AIQueryRequest>,
    userVisibleMessage?: string
  ) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || isSending) {
      inputRef.current?.focus();
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userVisibleMessage ?? trimmedQuery,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setPrompt('');
    setIsSending(true);
    console.log("🔥 Calling queryAI");
    try {
      const resolvedDeviceId = deviceId ?? (await getOrCreateDeviceId());

      if (!deviceId) {
        setDeviceId(resolvedDeviceId);
      }

      const response = await queryAI({
        q: trimmedQuery,
        movieId: overrides?.movieId ?? chatContext.selectedMovieId,
        showId: overrides?.showId ?? chatContext.selectedShowId,
        bookingId: overrides?.bookingId ?? chatContext.bookingId,
        seatNumbers: overrides?.seatNumbers,
        deviceId: overrides?.deviceId ?? resolvedDeviceId,
      });

      appendAssistantResponse(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unable to get a response from the chatbot.';

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: 'Something went wrong while processing that request.',
        },
      ]);
      Alert.alert('Chat Error', errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handlePromptSubmit = async () => {
    const selectedSeatCodes = parseSeatSelectionPrompt(prompt);
    const seatLayout = chatContext.seatLayout;

    if (selectedSeatCodes && seatLayout) {
      const seatLookup = new Map(
        seatLayout.seat_rows.flatMap((row) =>
          row.seats.map((seat) => [seat.seat_number.toUpperCase(), seat] as const)
        )
      );
      const unavailableSeats = selectedSeatCodes.filter((seatCode) => {
        const seat = seatLookup.get(seatCode);
        return !seat || seat.status !== 'available';
      });

      const userMessage: ChatMessage = {
        id: `user-seat-selection-${Date.now()}`,
        role: 'user',
        text: prompt.trim(),
      };

      setMessages((currentMessages) => [...currentMessages, userMessage]);

      if (unavailableSeats.length > 0) {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `assistant-seat-selection-error-${Date.now()}`,
            role: 'assistant',
            text: `These seats are not available: ${unavailableSeats.join(', ')}. Please choose seats marked as available.`,
            attachment: {
              intent: 'query_seats',
              data: { data: seatLayout },
            },
          },
        ]);
      } else {
        setChatContext((currentContext) => ({
          ...currentContext,
          selectedSeatNumbers: selectedSeatCodes,
        }));

        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `assistant-seat-selection-confirm-${Date.now()}`,
            role: 'assistant',
            text: `Selected seats ${selectedSeatCodes.join(', ')}. You can keep adjusting them on the layout or tap Proceed To Booking when you're ready.`,
            attachment: {
              intent: 'query_seats',
              data: { data: seatLayout },
            },
          },
        ]);
      }

      setPrompt('');
      return;
    }

    await sendQuery(prompt);
  };

  const handleMoviePress = async (movie: MovieSummary) => {
    setChatContext((currentContext) => ({
      ...currentContext,
      selectedMovieId: movie.id,
    }));
    await sendQuery('show movie timetable', { movieId: movie.id }, movie.title);
  };

  const handleShowPress = async (show: ShowWithFormat) => {
    setChatContext((currentContext) => ({
      ...currentContext,
      selectedShowId: show.id,
      pendingShow: show,
      seatLayout: undefined,
      selectedSeatNumbers: [],
    }));
    await sendQuery('show seats', { showId: show.id, movieId: show.movie_id }, `${show.movie_title} · ${show.format}`);
  };

  const handleSeatToggle = (seatNumber: string) => {
    const seatLayout = chatContext.seatLayout;

    if (!seatLayout) {
      return;
    }

    const selectedSeat = seatLayout.seat_rows
      .flatMap((row) => row.seats)
      .find((seat) => seat.seat_number === seatNumber);

    if (!selectedSeat || selectedSeat.status !== 'available') {
      return;
    }

    setChatContext((currentContext) => {
      const currentSelectedSeats = currentContext.selectedSeatNumbers ?? [];
      const nextSelectedSeats = currentSelectedSeats.includes(seatNumber)
        ? currentSelectedSeats.filter((seat) => seat !== seatNumber)
        : [...currentSelectedSeats, seatNumber];

      return {
        ...currentContext,
        selectedSeatNumbers: nextSelectedSeats,
      };
    });
  };

  const handleSeatProceed = async () => {
    const selectedSeatNumbers = chatContext.selectedSeatNumbers ?? [];

    if (selectedSeatNumbers.length === 0) {
      return;
    }

    await sendQuery(
      'book movie',
      {
        movieId: chatContext.selectedMovieId,
        showId: chatContext.selectedShowId,
        bookingId: chatContext.bookingId,
        seatNumbers: selectedSeatNumbers,
      },
      `Book seats ${selectedSeatNumbers.join(', ')}`
    );
  };

  const handleSeatCountPress = async (seatCount: number, show: ShowWithFormat) => {
    setChatContext((currentContext) => ({
      ...currentContext,
      selectedShowId: show.id,
      pendingShow: undefined,
    }));

    await sendQuery(
      `${seatCount} seats`,
      { showId: show.id, movieId: show.movie_id },
      `${seatCount} seats`
    );
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setChatContext((currentContext) => ({
      ...currentContext,
      selectedPaymentMethod: method,
    }));
  };

  const handlePaymentPress = async (booking: BookingData, method: PaymentMethod) => {
    setChatContext((currentContext) => ({
      ...currentContext,
      bookingId: booking.booking_id,
      selectedShowId: booking.show_id,
      selectedPaymentMethod: method,
    }));

    if (booking.payment_link) {
      await Linking.openURL(booking.payment_link);
    }

    await sendQuery(
      'get my booking',
      { bookingId: booking.booking_id, showId: booking.show_id },
      'Get my booking'
    );
  };

  useEffect(() => {
    let isMounted = true;

    const hydrateChat = async () => {
      try {
        const [persistedState, persistedDeviceId] = await Promise.all([
          loadPersistedChatState(),
          getOrCreateDeviceId(),
        ]);

        if (!isMounted) {
          return;
        }

        if (persistedState) {
          const sanitizedChatContext = resetLaunchSensitiveChatContext(
            persistedState.chatContext ?? {}
          );

          setMessages(persistedState.messages);
          setChatContext(sanitizedChatContext);
          setLastIntent(persistedState.lastIntent);
        }

        setDeviceId(persistedDeviceId);
      } catch (error) {
        console.log('[Chat Storage] Failed to hydrate local chat state:', error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    hydrateChat();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    persistChatState({
      messages,
      chatContext,
      lastIntent,
    }).catch((error: unknown) => {
      console.log('[Chat Storage] Failed to persist local chat state:', error);
    });
  }, [chatContext, isHydrated, lastIntent, messages]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const animateInputBar = (toValue: number, duration?: number) => {
      Animated.timing(keyboardOffset, {
        toValue,
        duration: duration ?? 220,
        useNativeDriver: false,
      }).start();
    };

    const handleKeyboardShow = (event: KeyboardEvent) => {
      const keyboardHeight = Math.max(0, event.endCoordinates.height - insets.bottom);
      setIsKeyboardVisible(true);
      animateInputBar(keyboardHeight, event.duration);
    };

    const handleKeyboardHide = (event: KeyboardEvent) => {
      setIsKeyboardVisible(false);
      animateInputBar(0, event.duration);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [insets.bottom, keyboardOffset]);

  useEffect(() => {
    if (messages.length > 0 || isSending) {
      scrollChatToEnd();
    }
  }, [isProcessingPaymentReturn, isSending, messages]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (resolvedPaymentReturn === 'cancel') {
      router.replace('/');
      return;
    }

    if (resolvedPaymentReturn !== 'success' || !resolvedPaymentReturnBookingId) {
      return;
    }

    const handledKey = `${resolvedPaymentReturn}:${resolvedPaymentReturnBookingId}`;

    if (paymentReturnHandledRef.current === handledKey) {
      return;
    }

    paymentReturnHandledRef.current = handledKey;

    let isMounted = true;

    const fetchReturnedBooking = async () => {
      setIsProcessingPaymentReturn(true);

      try {
        const resolvedDeviceId = deviceId ?? (await getOrCreateDeviceId());

        if (!deviceId && isMounted) {
          setDeviceId(resolvedDeviceId);
        }

        const response = await queryAI({
          q: 'get my booking',
          bookingId: resolvedPaymentReturnBookingId,
          deviceId: resolvedDeviceId,
        });

        if (!isMounted) {
          return;
        }

        appendAssistantResponse(response);
        setChatContext((currentContext) => ({
          ...currentContext,
          bookingId: resolvedPaymentReturnBookingId,
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Unable to refresh the booking after payment.';

        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `assistant-payment-return-error-${Date.now()}`,
            role: 'assistant',
            text: 'Payment completed, but we could not refresh your booking yet.',
          },
        ]);
        Alert.alert('Booking Fetch Error', errorMessage);
      } finally {
        if (isMounted) {
          setIsProcessingPaymentReturn(false);
          router.replace('/');
        }
      }
    };

    fetchReturnedBooking();

    return () => {
      isMounted = false;
    };
  }, [deviceId, isHydrated, resolvedPaymentReturn, resolvedPaymentReturnBookingId]);

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
          ref={chatScrollRef}
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Image source={BRAND_LOGO_IMAGE} contentFit="contain" style={styles.logo} />

          {!isHydrated ? null : messages.length === 0 ? (
            <>
              <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Booking movies made easy.</Text>
                <Image source={POPCORN_IMAGE} contentFit="contain" style={styles.popcorn} />
              </View>

              {!isKeyboardVisible ? (
                <View style={styles.trySection}>
                  <Text style={styles.sectionTitle}>Try these</Text>
                  <View style={styles.promptList}>
                    {visibleQuickPrompts.map((quickPrompt) => (
                      <PromptCard
                        key={quickPrompt}
                        label={quickPrompt}
                        onPress={handleSuggestionPress}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.chatMessages}>
              {messages.map((message) => (
                <View key={message.id} style={styles.messageBlock}>
                  {message.role === 'user' ? (
                    <UserBubble text={message.text} />
                  ) : (
                    <>
                      <AssistantBubble text={message.text} />
                      {message.attachment ? (
                        <IntentAttachment
                          attachment={message.attachment}
                          selectedPaymentMethod={chatContext.selectedPaymentMethod}
                          selectedSeatNumbers={chatContext.selectedSeatNumbers ?? []}
                          onMoviePress={handleMoviePress}
                          onShowPress={handleShowPress}
                          onSeatCountPress={handleSeatCountPress}
                          onSeatToggle={handleSeatToggle}
                          onSeatProceed={handleSeatProceed}
                          onPaymentMethodSelect={handlePaymentMethodSelect}
                          onPaymentPress={handlePaymentPress}
                        />
                      ) : null}
                    </>
                  )}
                </View>
              ))}

              {isSending || isProcessingPaymentReturn ? (
                <TypingBubble />
              ) : null}
            </View>
          )}
        </ScrollView>

        <Animated.View
          style={[
            styles.inputBarWrapper,
            {
              bottom: keyboardOffset,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}>
          {isKeyboardVisible && visibleQuickPrompts.length > 0 ? (
            <View style={styles.suggestionTray}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionTrayContent}
                keyboardShouldPersistTaps="handled">
                {visibleQuickPrompts.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    style={styles.suggestionPill}
                    onPress={() => handleSuggestionPress(suggestion)}>
                    <Text numberOfLines={1} style={styles.suggestionPillText}>
                      {suggestion}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.inputBar}>
            <TextInput
              ref={inputRef}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Ask anything"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              style={[styles.input, IS_WEB ? ({ outlineStyle: 'none' } as const as never) : null]}
              selectionColor="#FFFFFF"
              autoCapitalize="sentences"
              autoCorrect
              returnKeyType="send"
              onSubmitEditing={handlePromptSubmit}
              editable={!isSending}
            />
            <Pressable
              onPress={handlePromptSubmit}
              hitSlop={8}
              style={styles.submitButton}
              accessibilityRole="button"
              accessibilityLabel="Submit prompt"
              disabled={isSending}>
              <Text style={styles.submitIcon}>{isSending ? '...' : '↑'}</Text>
            </Pressable>
          </View>
        </Animated.View>
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
    overflow: 'hidden',
    ...(IS_WEB
      ? {
          alignItems: 'center',
        }
      : null),
  },
  content: {
    flex: 1,
    width: '100%',
    ...(IS_WEB
      ? {
          maxWidth: 900,
        }
      : null),
  },
  contentContainer: {
    paddingHorizontal: 20,
    ...(IS_WEB
      ? {
          paddingHorizontal: 32,
          paddingTop: 12,
        }
      : null),
  },
  logo: {
    alignSelf: 'center',
    width: 182,
    height: 96,
    marginTop: 2,
    ...(IS_WEB
      ? {
          width: 220,
          height: 116,
          marginTop: 8,
        }
      : null),
  },
  heroSection: {
    marginTop: 96,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...(IS_WEB
      ? {
          marginTop: 48,
          alignItems: 'center',
          gap: 32,
        }
      : null),
  },
  heroTitle: {
    width: 246,
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 48,
    fontWeight: '300',
    letterSpacing: -1,
    ...(IS_WEB
      ? {
          width: 420,
          fontSize: 56,
          lineHeight: 68,
        }
      : null),
  },
  popcorn: {
    width: 112,
    height: 124,
    marginTop: -4,
    marginRight: -10,
    transform: [{ rotate: '17deg' }],
    ...(IS_WEB
      ? {
          width: 180,
          height: 204,
          marginRight: 0,
        }
      : null),
  },
  trySection: {
    marginTop: 112,
    ...(IS_WEB
      ? {
          marginTop: 72,
          maxWidth: 760,
        }
      : null),
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '300',
    marginLeft: 10,
  },
  promptList: {
    gap: 20,
    marginTop: 24,
  },
  chatMessages: {
    paddingTop: 28,
    gap: 18,
    ...(IS_WEB
      ? {
          maxWidth: 880,
          alignSelf: 'center',
          width: '100%',
          paddingTop: 20,
          paddingBottom: 24,
        }
      : null),
  },
  messageBlock: {
    gap: 10,
  },
  inputBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    ...(IS_WEB
      ? {
          width: '100%',
          paddingHorizontal: 32,
          alignItems: 'center',
        }
      : null),
  },
  suggestionTray: {
    marginBottom: 12,
    marginHorizontal: -2,
  },
  suggestionTrayContent: {
    paddingHorizontal: 2,
    gap: 12,
  },
  suggestionPill: {
    maxWidth: 284,
    minHeight: 35,
    borderRadius: 999,
    backgroundColor: 'rgba(45, 1, 59, 0.71)',
    paddingHorizontal: 18,
    justifyContent: 'center',
    shadowColor: '#1E002D',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  suggestionPillText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '400',
  },
  inputBar: {
    minHeight: 48,
    borderRadius: 25,
    backgroundColor: 'rgb(68, 0, 88)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 21,
    paddingRight: 12,
    ...(IS_WEB
      ? {
          maxWidth: 880,
          alignSelf: 'center',
          width: '100%',
          minHeight: 56,
          borderRadius: 28,
          outlineWidth: 0,
          outlineColor: 'transparent',
          boxShadow: 'none',
        }
      : null),
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '400',
    paddingVertical: 12,
    paddingRight: 12,
    ...(IS_WEB
      ? {
          outlineWidth: 0,
          outlineColor: 'transparent',
          boxShadow: 'none',
          borderWidth: 0,
        }
      : null),
  },
  submitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '700',
  },
});
