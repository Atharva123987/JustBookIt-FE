import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaskedView from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BookingData, MovieSummary } from '@/services/ai-chat';

import { SEAT_OPTIONS } from './constants';
import {
  ChatAttachment,
  MoviePressHandler,
  PaymentMethod,
  PaymentPressHandler,
  SeatCountPressHandler,
  ShowPressHandler,
  ShowWithFormat,
} from './types';
import { flattenShows, formatCurrency, getAccentColor, getFormatGradient } from './utils';

function GradientText({
  text,
  colors,
  style,
}: {
  text: string;
  colors: [string, string];
  style: object;
}) {
  return (
    <MaskedView maskElement={<Text style={style}>{text}</Text>}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}>
        <Text style={[style, styles.gradientTextMask]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

function UPILogo({ selected }: { selected: boolean }) {
  return (
    <View style={styles.logoWrap}>
      <View style={styles.upiLogoRow}>
        <Text style={[styles.upiBrandText, selected ? styles.upiBrandTextSelected : null]}>
          UPI
        </Text>
        <View style={styles.upiArrowWrap}>
          <View style={styles.upiArrowOrange} />
          <View style={styles.upiArrowGreen} />
        </View>
      </View>
      <Text style={[styles.upiTagline, selected ? styles.upiTaglineSelected : null]}>
        UNIFIED PAYMENTS INTERFACE
      </Text>
    </View>
  );
}

function StripeLogo({ selected }: { selected: boolean }) {
  return (
    <View style={styles.logoWrap}>
      <Text style={[styles.stripeText, selected ? styles.stripeTextSelected : null]}>stripe</Text>
    </View>
  );
}

export function PromptCard({
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

export function UserBubble({ text }: { text: string }) {
  return (
    <View style={[styles.messageBubble, styles.userMessageBubble]}>
      <Text style={styles.messageText}>{text}</Text>
    </View>
  );
}

export function AssistantBubble({ text }: { text: string }) {
  return (
    <View style={[styles.messageBubble, styles.assistantMessageBubble]}>
      <Text style={styles.messageText}>{text}</Text>
    </View>
  );
}

function MovieListCard({
  movie,
  onPress,
}: {
  movie: MovieSummary;
  onPress: MoviePressHandler;
}) {
  return (
    <Pressable style={styles.movieCard} onPress={() => onPress(movie)}>
      <Image source={{ uri: movie.poster_url }} contentFit="cover" style={styles.moviePoster} />
      <View style={styles.movieCardContent}>
        <Text style={styles.movieTitle}>{movie.title}</Text>
        <Text style={styles.movieReleaseDate}>
          Release date -{' '}
          {new Date(movie.release_date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.movieDescription}>{movie.description}</Text>
      </View>
      <View style={styles.movieArrowWrap}>
        <MaterialIcons name="arrow-forward" size={22} color="#000000" />
      </View>
    </Pressable>
  );
}

function TicketCard({
  show,
  onPress,
}: {
  show: ShowWithFormat;
  onPress: ShowPressHandler;
}) {
  return (
    <Pressable style={styles.ticketShell} onPress={() => onPress(show)}>
      <View style={styles.ticketCardFrame}>
        <View
          style={[
            styles.ticketMain,
            {
              borderLeftColor: getAccentColor(show.format),
              borderRightColor: getAccentColor(show.format),
            },
          ]}>
          <Text style={styles.ticketTime}>
            {new Date(show.show_timing).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
          <GradientText
            text={show.format}
            colors={getFormatGradient(show.format)}
            style={styles.ticketFormatText}
          />
        </View>
        <View
          style={[
            styles.ticketStub,
            {
              borderLeftColor: getAccentColor(show.format),
              borderRightColor: getAccentColor(show.format),
            },
          ]}>
          <Text style={styles.ticketPrice}>{show.price_label}</Text>
        </View>
      </View>
      <View style={styles.ticketLeftCutout} />
      <View style={styles.ticketRightCutout} />
    </Pressable>
  );
}

function SeatSelectionCard({
  show,
  onSeatCountPress,
}: {
  show: ShowWithFormat;
  onSeatCountPress: SeatCountPressHandler;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>How many seats do you want?</Text>
      <Text style={styles.seatSelectionSubtitle}>
        {new Date(show.show_timing).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}{' '}
        {show.format}
      </Text>
      <View style={styles.seatOptionsRow}>
        {SEAT_OPTIONS.map((seatCount) => (
          <Pressable
            key={seatCount}
            style={styles.seatOption}
            onPress={() => onSeatCountPress(seatCount, show)}>
            <Text style={styles.seatOptionText}>{seatCount}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function PaymentOptionButton({
  method,
  isSelected,
  onPress,
}: {
  method: PaymentMethod;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.paymentOptionButton, isSelected ? styles.paymentOptionButtonSelected : null]}
      onPress={onPress}>
      {method === 'upi' ? <UPILogo selected={isSelected} /> : <StripeLogo selected={isSelected} />}
    </Pressable>
  );
}

function BookingSummaryCard({
  booking,
  selectedPaymentMethod,
  onPaymentMethodSelect,
  onPayPress,
}: {
  booking: BookingData;
  selectedPaymentMethod?: PaymentMethod;
  onPaymentMethodSelect: (method: PaymentMethod) => void;
  onPayPress: PaymentPressHandler;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Booking Summary</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Booking ID</Text>
        <Text style={styles.summaryValue}>{booking.booking_id}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Show ID</Text>
        <Text style={styles.summaryValue}>{booking.show_id}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Seats</Text>
        <Text style={styles.summaryValue}>{booking.seat_numbers.join(', ')}</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Ticket(s) price</Text>
        <Text style={styles.summaryValue}>{formatCurrency(booking.pricing.tickets_price)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Convenience Fees</Text>
        <Text style={styles.summaryValue}>{formatCurrency(booking.pricing.convenience_fee)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryTotalLabel}>Order Total</Text>
        <Text style={styles.summaryTotalValue}>{formatCurrency(booking.pricing.order_total)}</Text>
      </View>
      <View style={styles.paymentOptionsRow}>
        <PaymentOptionButton
          method="upi"
          isSelected={selectedPaymentMethod === 'upi'}
          onPress={() => onPaymentMethodSelect('upi')}
        />
        <PaymentOptionButton
          method="stripe"
          isSelected={selectedPaymentMethod === 'stripe'}
          onPress={() => onPaymentMethodSelect('stripe')}
        />
      </View>
      <Pressable
        style={[styles.primaryAction, !selectedPaymentMethod ? styles.primaryActionDisabled : null]}
        onPress={() => selectedPaymentMethod && onPayPress(booking, selectedPaymentMethod)}
        disabled={!selectedPaymentMethod}>
        <Text style={styles.primaryActionText}>
          {selectedPaymentMethod
            ? `Pay with ${selectedPaymentMethod.toUpperCase()}`
            : 'Choose Payment Option'}
        </Text>
      </Pressable>
    </View>
  );
}

function BookingConfirmationCard({ booking }: { booking: BookingData }) {
  return (
    <View style={styles.confirmationCard}>
      <View style={styles.confirmationHeader}>
        {
          booking.payment_info.payment_status === "success" ? (
            <>
            <MaterialIcons name="check-circle" size={26} color="#6DFF99" />
        <Text style={styles.confirmationTitle}>Booking Confirmed</Text>
            </>
          ) : 
          (
            <>
            <MaterialIcons name="error" size={26} color="#f1d900" />
        <Text style={styles.confirmationTitle}>Booking Pending</Text>
            </>
          )
        }
        
      </View>
      <Text style={styles.confirmationBookingId}>Booking ID: {booking.booking_id}</Text>
      <View style={styles.ticketCard}>
        <View style={styles.ticketHeaderRow}>
          <Text style={styles.ticketHeaderTitle}>Movie Ticket</Text>
          {
            booking.status === 'pending'?(
              <>
            <Text style={styles.ticketHeaderStatusPending}>{booking.status.toUpperCase()}</Text>
              </>
            ):
            <Text style={styles.ticketHeaderStatusSuccess}>{booking.status.toUpperCase()}</Text>
          }
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.ticketMetaLabel}>Show</Text>
          <Text style={styles.ticketMetaValue}>{booking.show_id}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.ticketMetaLabel}>Seats</Text>
          <Text style={styles.ticketMetaValue}>{booking.seat_numbers.join(', ')}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.ticketMetaLabel}>Paid</Text>
          <Text style={styles.ticketMetaValue}>{formatCurrency(booking.payment_info.payment_amount)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.ticketMetaLabel}>Method</Text>
          <Text style={styles.ticketMetaValue}>{booking.payment_info.payment_method.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

export function IntentAttachment({
  attachment,
  selectedPaymentMethod,
  onMoviePress,
  onShowPress,
  onSeatCountPress,
  onPaymentMethodSelect,
  onPaymentPress,
}: {
  attachment: ChatAttachment;
  selectedPaymentMethod?: PaymentMethod;
  onMoviePress: MoviePressHandler;
  onShowPress: ShowPressHandler;
  onSeatCountPress: SeatCountPressHandler;
  onPaymentMethodSelect: (method: PaymentMethod) => void;
  onPaymentPress: PaymentPressHandler;
}) {
  if (attachment.intent === 'search_all_movies') {
    return (
      <View style={styles.attachmentBlock}>
        {attachment.data.data.movies.map((movie, index) => (
          <View key={movie.id}>
            <MovieListCard movie={movie} onPress={onMoviePress} />
            {index < attachment.data.data.movies.length - 1 ? <View style={styles.contentDivider} /> : null}
          </View>
        ))}
      </View>
    );
  }

  if (attachment.intent === 'movie_show_timetable') {
    const movie = attachment.data.movie_details.data.movie;
    const venues = flattenShows(attachment.data.show_timings.data);

    return (
      <View style={styles.attachmentBlock}>
        <View style={styles.showcaseHeader}>
          <Image source={{ uri: movie.poster_url }} contentFit="cover" style={styles.showcasePoster} />
          <View style={styles.showcaseInfo}>
            <Text style={styles.showcaseMovieTitle}>{movie.title}</Text>
            <Text style={styles.showcaseMovieDate}>
              Release date -{' '}
              {new Date(movie.release_date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.showcaseMovieDescription}>{movie.description}</Text>
          </View>
        </View>
        <View style={styles.showcaseColumns}>
          {venues.map((venue) => (
            <View key={venue.id} style={styles.showcaseColumn}>
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={11} color="#FFFFFF" />
                <Text style={styles.locationText}>{venue.name}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ticketRow}
                keyboardShouldPersistTaps="handled">
                {venue.normalizedShows.map((show) => (
                  <TicketCard key={show.id} show={show} onPress={onShowPress} />
                ))}
              </ScrollView>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (attachment.intent === 'seat_selection') {
    return (
      <View style={styles.attachmentBlock}>
        <SeatSelectionCard show={attachment.data.show} onSeatCountPress={onSeatCountPress} />
      </View>
    );
  }

  if (attachment.intent === 'query_seat_availability') {
    return (
      <View style={styles.attachmentBlock}>
        <View style={styles.seatAvailabilityCard}>
          <Text style={styles.seatAvailabilityValue}>{attachment.data.available_seats}</Text>
          <Text style={styles.seatAvailabilityLabel}>seats available</Text>
        </View>
      </View>
    );
  }

  if (attachment.intent === 'book_movie') {
    return (
      <View style={styles.attachmentBlock}>
        <BookingSummaryCard
          booking={attachment.data.data}
          selectedPaymentMethod={selectedPaymentMethod}
          onPaymentMethodSelect={onPaymentMethodSelect}
          onPayPress={onPaymentPress}
        />
      </View>
    );
  }

  return (
    <View style={styles.attachmentBlock}>
      <BookingConfirmationCard booking={attachment.data.data} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  messageBubble: {
    maxWidth: '90%',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  userMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(194, 192, 192, 0.24)',
    marginLeft: 28,
  },
  assistantMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(71, 71, 71, 0.36)',
    marginRight: 28,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  attachmentBlock: {
    gap: 12,
  },
  movieCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  moviePoster: {
    width: 134,
    height: 199,
  },
  movieCardContent: {
    flex: 1,
    paddingTop: 2,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '400',
  },
  movieReleaseDate: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '200',
    marginTop: 6,
    opacity: 0.9,
  },
  movieDescription: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '300',
    marginTop: 14,
  },
  movieArrowWrap: {
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingLeft: 4,
  },
  contentDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginVertical: 12,
  },
  showcaseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  showcasePoster: {
    width: 131,
    height: 195,
  },
  showcaseInfo: {
    flex: 1,
    paddingTop: 2,
  },
  showcaseMovieTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
  },
  showcaseMovieDate: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    lineHeight: 12,
    marginTop: 6,
  },
  showcaseMovieDescription: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
  },
  showcaseColumns: {
    gap: 14,
    marginTop: 14,
  },
  showcaseColumn: {
    width: '100%',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
    marginLeft: 2,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  ticketRow: {
    gap: 12,
    paddingRight: 14,
  },
  ticketShell: {
    position: 'relative',
    width: 112,
    height: 56,
    justifyContent: 'center',
  },
  ticketCardFrame: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#FBFBFD',
    shadowColor: '#25053A',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  ticketMain: {
    flex: 1,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketStub: {
    height: 18,
    backgroundColor: '#F1F1F6',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(90, 90, 90, 0.3)',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketLeftCutout: {
    position: 'absolute',
    left: -7,
    top: 21,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#62009B',
  },
  ticketRightCutout: {
    position: 'absolute',
    right: -7,
    top: 21,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#62009B',
  },
  ticketTime: {
    color: '#5A5A5A',
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  ticketFormatText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.25,
    textAlign: 'center',
  },
  gradientTextMask: {
    opacity: 0,
  },
  ticketPrice: {
    color: '#2F2F38',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.15,
    textAlign: 'center',
  },
  seatAvailabilityCard: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    backgroundColor: 'rgba(194, 192, 192, 0.24)',
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  seatAvailabilityValue: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '600',
  },
  seatAvailabilityLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    marginTop: 4,
  },
  summaryCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(194, 192, 192, 0.24)',
    padding: 18,
    gap: 12,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
  },
  seatSelectionSubtitle: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 14,
    lineHeight: 18,
  },
  seatOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  seatOption: {
    minWidth: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  seatOptionText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 14,
    lineHeight: 18,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    flexShrink: 1,
    textAlign: 'right',
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  summaryTotalLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  summaryTotalValue: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  paymentOptionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  paymentOptionButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  paymentOptionButtonSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  logoWrap: {
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upiLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  upiBrandText: {
    color: '#6B6B6B',
    fontSize: 20,
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  upiBrandTextSelected: {
    color: '#4F4F4F',
  },
  upiArrowWrap: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upiArrowOrange: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 0,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#F47C20',
    right: 2,
    top: 1,
    transform: [{ skewY: '-18deg' }],
  },
  upiArrowGreen: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#2DBD6E',
    right: -1,
    top: 2,
    transform: [{ skewY: '18deg' }],
  },
  upiTagline: {
    marginTop: 1,
    color: '#7B7B7B',
    fontSize: 6,
    lineHeight: 8,
    fontStyle: 'italic',
    letterSpacing: 0.45,
  },
  upiTaglineSelected: {
    color: '#636363',
  },
  stripeText: {
    color: '#635BFF',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '900',
    textTransform: 'lowercase',
    letterSpacing: -0.7,
  },
  stripeTextSelected: {
    color: '#4E47E5',
  },
  paymentOptionText: {
    color: '#FFFFFF',
  },
  paymentOptionTextSelected: {
    color: '#4D007A',
  },
  primaryAction: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryActionDisabled: {
    opacity: 0.55,
  },
  primaryActionText: {
    color: '#4D007A',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  confirmationCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(194, 192, 192, 0.24)',
    padding: 18,
    gap: 14,
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmationTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
  },
  confirmationBookingId: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
  },
  ticketCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(71, 71, 71, 0.45)',
    padding: 16,
    gap: 10,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  ticketHeaderStatusSuccess: {
    color: '#6DFF99',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  ticketHeaderStatusPending: {
    color: '#f1d900',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  ticketMetaLabel: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 13,
    lineHeight: 16,
  },
  ticketMetaValue: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    flexShrink: 1,
    textAlign: 'right',
  },
});
