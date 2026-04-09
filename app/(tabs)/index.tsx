import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const BRAND_LOGO_URI = 'https://www.figma.com/api/mcp/asset/8be43ba6-5705-4185-b766-84282531fa74';
const POPCORN_URI = 'https://www.figma.com/api/mcp/asset/9b4dcddc-da37-408b-ba70-0961d9731156';

const QUICK_PROMPTS = [
  'Book Dhurandhar 8pm show at Inorbit',
  'Show me movies running at my locality',
  'Can you find movies for 5pm tomorrow?',
];

function PromptCard({
  label,
  onPress,
}: {
  label: string;
  onPress: (label: string) => void;
}) {
  return (
    <Pressable style={styles.promptCard} onPress={() => onPress(label)}>
      <Text style={styles.promptText}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const [prompt, setPrompt] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  const handleSuggestionPress = (suggestion: string) => {
    setPrompt(suggestion);
    inputRef.current?.focus();
  };

  const handlePromptSubmit = () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      inputRef.current?.focus();
      return;
    }

    // Replace this with your API call when the backend is ready.
    console.log('Submit prompt:', trimmedPrompt);
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const animateInputBar = (toValue: number, duration?: number) => {
      Animated.timing(keyboardOffset, {
        toValue,
        duration: duration ?? 220,
        easing: Easing.out(Easing.cubic),
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
        <LinearGradient
          colors={['#4D007A', '#5E0493', '#7300B6']}
          locations={[0.08, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.background}>
          <View style={[styles.content, { paddingBottom: 108 + insets.bottom }]}>
            <Image
              source={{ uri: BRAND_LOGO_URI }}
              contentFit="contain"
              style={styles.logo}
            />

            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Booking movies made easy.</Text>
              <Image
                source={{ uri: POPCORN_URI }}
                contentFit="contain"
                style={styles.popcorn}
              />
            </View>

            {!isKeyboardVisible ? (
              <View style={styles.trySection}>
                <Text style={styles.sectionTitle}>Try these</Text>
                <View style={styles.promptList}>
                  {QUICK_PROMPTS.map((prompt) => (
                    <PromptCard key={prompt} label={prompt} onPress={handleSuggestionPress} />
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <Animated.View
            style={[
              styles.inputBarWrapper,
              {
                bottom: keyboardOffset,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}>
            {isKeyboardVisible ? (
              <View style={styles.suggestionTray}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionTrayContent}
                  keyboardShouldPersistTaps="handled">
                  {QUICK_PROMPTS.map((suggestion) => (
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
              />
              <Pressable
                onPress={handlePromptSubmit}
                hitSlop={8}
                style={styles.submitButton}
                accessibilityRole="button"
                accessibilityLabel="Submit prompt">
                <MaterialIcons name="arrow-upward" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </Animated.View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7300B6',
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#7300B6',
  },
  background: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
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
  promptCard: {
    minHeight: 53,
    borderRadius: 15,
    backgroundColor: 'rgba(194, 192, 192, 0.24)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  promptText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
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
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(194, 192, 192, 0.24)',
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
    backgroundColor: 'rgba(71, 71, 71, 0.5)',
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
});
