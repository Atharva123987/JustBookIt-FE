import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
import { AIQueryRequest, AIQueryResponse, BookingData, MovieSummary, queryAI } from '@/services/ai-chat';

const BRAND_LOGO_URI = 'https://www.figma.com/api/mcp/asset/8be43ba6-5705-4185-b766-84282531fa74';
const POPCORN_URI = 'https://www.figma.com/api/mcp/asset/9b4dcddc-da37-408b-ba70-0961d9731156';

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
        attachment = { intent: response.intent, data: response.api_data };
        break;
      case 'movie_show_timetable':
        attachment = { intent: response.intent, data: response.api_data };
        break;
      case 'query_seat_availability':
        attachment = { intent: response.intent, data: response.api_data };
        break;
      case 'book_movie':
        attachment = { intent: response.intent, data: response.api_data };
        break;
      case 'get_booking':
        attachment = { intent: response.intent, data: response.api_data };
        break;
    }
    setLastIntent(response.intent);
    const allowedNoAttachmentIntents = [
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
      }));
    }

    if (response.intent === 'book_movie' || response.intent === 'get_booking') {
      setChatContext((currentContext) => ({
        ...currentContext,
        bookingId: response.api_data.data.booking_id,
        selectedShowId: response.api_data.data.show_id,
      }));
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setPrompt(suggestion);
    inputRef.current?.focus();
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
      const response = await queryAI({
        q: trimmedQuery,
        movieId: overrides?.movieId ?? chatContext.selectedMovieId,
        showId: overrides?.showId ?? chatContext.selectedShowId,
        bookingId: overrides?.bookingId ?? chatContext.bookingId,
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
    await sendQuery(prompt);
  };

  const handleMoviePress = async (movie: MovieSummary) => {
    setChatContext((currentContext) => ({
      ...currentContext,
      selectedMovieId: movie.id,
    }));
    await sendQuery('show movie timetable', { movieId: movie.id }, movie.title);
  };

  const handleShowPress = (show: ShowWithFormat) => {
    setChatContext((currentContext) => ({
      ...currentContext,
      selectedShowId: show.id,
      pendingShow: show,
    }));

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `assistant-seat-selection-${Date.now()}`,
        role: 'assistant',
        text: 'Select the number of seats for this show.',
        attachment: {
          intent: 'seat_selection',
          data: { show },
        },
      },
    ]);
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
  }, [messages, isSending]);

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
          <Image source={{ uri: BRAND_LOGO_URI }} contentFit="contain" style={styles.logo} />

          {messages.length === 0 ? (
            <>
              <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Booking movies made easy.</Text>
                <Image source={{ uri: POPCORN_URI }} contentFit="contain" style={styles.popcorn} />
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
                          onMoviePress={handleMoviePress}
                          onShowPress={handleShowPress}
                          onSeatCountPress={handleSeatCountPress}
                          onPaymentMethodSelect={handlePaymentMethodSelect}
                          onPaymentPress={handlePaymentPress}
                        />
                      ) : null}
                    </>
                  )}
                </View>
              ))}

              {isSending ? <AssistantBubble text="Typing..." /> : null}
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
              style={styles.input}
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
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  logo: {
    alignSelf: 'center',
    width: 182,
    height: 96,
    marginTop: 2,
  },
  heroSection: {
    marginTop: 96,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: {
    width: 246,
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 48,
    fontWeight: '300',
    letterSpacing: -1,
  },
  popcorn: {
    width: 112,
    height: 124,
    marginTop: -4,
    marginRight: -10,
    transform: [{ rotate: '17deg' }],
  },
  trySection: {
    marginTop: 112,
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
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '400',
    paddingVertical: 12,
    paddingRight: 12,
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
