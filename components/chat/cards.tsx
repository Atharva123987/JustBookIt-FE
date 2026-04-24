import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaskedView from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BookingData, MovieSummary, TheatreLayout } from '@/services/ai-chat';

import { SEAT_OPTIONS } from './constants';
import {
  ChatAttachment,
  MoviePressHandler,
  PaymentMethod,
  PaymentPressHandler,
  SeatCountPressHandler,
  SeatProceedHandler,
  SeatToggleHandler,
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
        <View style={styles.movieArrowButton}>
          <MaterialIcons name="arrow-forward" size={18} color="#4D007A" />
        </View>
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

function SeatMapCard({
  layout,
  selectedSeatNumbers,
  onSeatToggle,
  onProceedToBooking,
}: {
  layout: TheatreLayout;
  selectedSeatNumbers: string[];
  onSeatToggle: SeatToggleHandler;
  onProceedToBooking: SeatProceedHandler;
}) {
  const exitSet = new Set(layout.exits);
  const verticalAisles = new Set(layout.aisles?.vertical_after_seat_indexes ?? []);
  const horizontalAisles = new Set(layout.aisles?.horizontal_after_rows ?? []);
  const seatLookup = new Map(
    layout.seat_rows.flatMap((row) => row.seats.map((seat) => [seat.seat_number, seat] as const))
  );
  const selectedSeatTotal = selectedSeatNumbers.reduce(
    (sum, seatNumber) => sum + (seatLookup.get(seatNumber)?.cost ?? 0),
    0
  );

  return (
    <View style={styles.seatMapCard}>
      <View style={styles.seatMapHeader}>
        <View>
          <Text style={styles.summaryTitle}>Choose Your Seats</Text>
          <Text style={styles.seatMapSubtitle}>
            Screen {layout.screen_number} - {layout.show_type}
          </Text>
          {typeof layout.available_seats === 'number' ? (
            <Text style={styles.availableSeatCount}>
              {layout.available_seats} seats available
            </Text>
          ) : null}
        </View>
        <View style={styles.seatPriceBadge}>
          <Text style={styles.seatPriceLabel}>From</Text>
          <Text style={styles.seatPriceValue}>{formatCurrency(layout.price_label)}</Text>
        </View>
      </View>

      <View style={styles.seatLegendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendAvailable]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendSelected]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendReserved]} />
          <Text style={styles.legendText}>Reserved</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendBooked]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.seatMapViewport}>
          <View style={styles.seatMapTopRow}>
            <ExitChip visible={exitSet.has('top-left')} side="left" />
            <View style={styles.seatMapTopSpacer} />
            <ExitChip visible={exitSet.has('top-right')} side="right" />
          </View>

          <View style={styles.seatGridShell}>
            <View style={styles.exitColumn}>
              <ExitChip visible={exitSet.has('middle-left')} side="left" compact />
            </View>

            <View style={styles.seatGrid}>
              {layout.seat_rows.map((row) => (
                <View key={row.row} style={styles.seatRowWrap}>
                  <View style={styles.seatRow}>
                    <Text style={styles.rowLabel}>{row.row}</Text>
                    <View style={styles.seatRowSeats}>
                      {row.seats.map((seat, seatIndex) => {
                        const isSelected = selectedSeatNumbers.includes(seat.seat_number);
                        const isDisabled = seat.status !== 'available';

                        return (
                          <View key={seat.seat_number} style={styles.seatCell}>
                            <Pressable
                              onPress={() => onSeatToggle(seat.seat_number)}
                              disabled={isDisabled}
                              style={[
                                styles.seatButton,
                                seat.type === 'VIP' ? styles.vipSeat : styles.regularSeat,
                                seat.status === 'booked' ? styles.bookedSeat : null,
                                seat.status === 'reserved' ? styles.reservedSeat : null,
                                isSelected ? styles.selectedSeat : null,
                              ]}>
                              <Text
                                style={[
                                  styles.seatButtonText,
                                  isDisabled ? styles.disabledSeatText : null,
                                  isSelected ? styles.selectedSeatText : null,
                                ]}>
                                {seat.seat_number}
                              </Text>
                            </Pressable>
                            {verticalAisles.has(seatIndex + 1) ? <View style={styles.verticalAisle} /> : null}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  {horizontalAisles.has(row.row) ? <View style={styles.horizontalAisle} /> : null}
                </View>
              ))}
            </View>

            <View style={styles.exitColumn} />
          </View>

          <View style={styles.seatMapBottomRow}>
            <ExitChip visible={exitSet.has('bottom-left')} side="left" />
            <View style={styles.selectedSeatSummary}>
              <Text style={styles.selectedSeatSummaryLabel}>Selected</Text>
              <Text style={styles.selectedSeatSummaryValue}>
                {selectedSeatNumbers.length > 0 ? selectedSeatNumbers.join(', ') : 'Tap seats or type A1, A2'}
              </Text>
              <Text style={styles.selectedSeatSummaryCost}>
                Total: {formatCurrency(selectedSeatTotal)}
              </Text>
            </View>
            <ExitChip visible={exitSet.has('bottom-right')} side="right" />
          </View>

          <View style={styles.screenBottomWrap}>
            <View style={styles.screenArc} />
            <Text style={styles.screenLabel}>SCREEN THIS WAY</Text>
          </View>

          <Pressable
            style={[
              styles.primaryAction,
              selectedSeatNumbers.length === 0 ? styles.primaryActionDisabled : null,
            ]}
            disabled={selectedSeatNumbers.length === 0}
            onPress={onProceedToBooking}>
            <Text style={styles.primaryActionText}>Proceed To Booking</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function ExitChip({
  visible,
  side,
  compact = false,
}: {
  visible: boolean;
  side: 'left' | 'right';
  compact?: boolean;
}) {
  if (!visible) {
    return <View style={compact ? styles.exitChipSpacerCompact : styles.exitChipSpacer} />;
  }

  return (
    <View style={[styles.exitChip, compact ? styles.exitChipCompact : null]}>
      <MaterialIcons name={side === 'left' ? 'west' : 'east'} size={compact ? 12 : 14} color="#91721b" />
      <Text style={styles.exitChipText}>EXIT</Text>
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
      <StripeLogo selected={isSelected} />
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
  const showTimeLabel =
    typeof booking.show_timing_epoch === 'number'
      ? new Date(booking.show_timing_epoch * 1000).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : null;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Booking Summary</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Booking ID</Text>
        <Text style={styles.summaryValue}>{booking.booking_id}</Text>
      </View>
      {booking.movie_name || booking.movie_poster || showTimeLabel ? (
        <View style={styles.summaryTicketCard}>
          <View style={styles.ticketHeaderRow}>
            <Text style={styles.ticketHeaderTitle}>Movie Ticket</Text>
            <Text style={styles.ticketHeaderStatusPending}>PENDING</Text>
          </View>
          <View style={styles.confirmedMovieRow}>
            {booking.movie_poster ? (
              <Image
                source={{ uri: booking.movie_poster }}
                contentFit="cover"
                style={styles.confirmedMoviePoster}
              />
            ) : null}
            <View style={styles.confirmedMovieInfo}>
              {booking.movie_name ? (
                <Text style={styles.confirmedMovieTitle}>{booking.movie_name}</Text>
              ) : null}
              {showTimeLabel ? (
                <Text style={styles.confirmedMovieTime}>{showTimeLabel}</Text>
              ) : null}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Show ID</Text>
          <Text style={styles.summaryValue}>{booking.show_id}</Text>
        </View>
      )}
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
          method="stripe"
          isSelected={selectedPaymentMethod === 'stripe' || !selectedPaymentMethod}
          onPress={() => onPaymentMethodSelect('stripe')}
        />
      </View>
      <Pressable
        style={styles.primaryAction}
        onPress={() => onPayPress(booking, 'stripe')}>
        <Text style={styles.primaryActionText}>Pay with STRIPE</Text>
      </Pressable>
    </View>
  );
}

function BookingConfirmationCard({ booking }: { booking: BookingData }) {
  const isConfirmed =
    booking.status === 'confirmed' || booking.payment_info.payment_status === 'success';
  const showTimeLabel =
    typeof booking.show_timing_epoch === 'number'
      ? new Date(booking.show_timing_epoch * 1000).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : null;

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
        {isConfirmed &&
        (booking.movie_name || booking.movie_poster || showTimeLabel) ? (
          <View style={styles.confirmedMovieRow}>
            {booking.movie_poster ? (
              <Image
                source={{ uri: booking.movie_poster }}
                contentFit="cover"
                style={styles.confirmedMoviePoster}
              />
            ) : null}
            <View style={styles.confirmedMovieInfo}>
              {booking.movie_name ? (
                <Text style={styles.confirmedMovieTitle}>{booking.movie_name}</Text>
              ) : null}
              {showTimeLabel ? (
                <Text style={styles.confirmedMovieTime}>{showTimeLabel}</Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.summaryRow}>
            <Text style={styles.ticketMetaLabel}>Show</Text>
            <Text style={styles.ticketMetaValue}>{booking.show_id}</Text>
          </View>
        )}
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
  selectedSeatNumbers,
  onMoviePress,
  onShowPress,
  onSeatCountPress,
  onSeatToggle,
  onSeatProceed,
  onPaymentMethodSelect,
  onPaymentPress,
}: {
  attachment: ChatAttachment;
  selectedPaymentMethod?: PaymentMethod;
  selectedSeatNumbers: string[];
  onMoviePress: MoviePressHandler;
  onShowPress: ShowPressHandler;
  onSeatCountPress: SeatCountPressHandler;
  onSeatToggle: SeatToggleHandler;
  onSeatProceed: SeatProceedHandler;
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

  if (attachment.intent === 'query_seats') {
    if (!attachment.data.data) {
      return null;
    }

    return (
      <View style={styles.attachmentBlock}>
        <SeatMapCard
          layout={attachment.data.data}
          selectedSeatNumbers={selectedSeatNumbers}
          onSeatToggle={onSeatToggle}
          onProceedToBooking={onSeatProceed}
        />
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
    if (!attachment.data.data) {
      return null;
    }

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

  if (!attachment.data.data) {
    return null;
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
    justifyContent: 'center',
    paddingLeft: 8,
  },
  movieArrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#160021',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
  seatMapCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
    padding: 18,
    gap: 14,
  },
  seatMapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  seatMapSubtitle: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 13,
    lineHeight: 17,
    marginTop: 4,
  },
  availableSeatCount: {
    color: '#A8F6B9',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 8,
  },
  seatPriceBadge: {
    borderRadius: 14,
    backgroundColor: 'rgba(32, 0, 48, 0.34)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'flex-end',
  },
  seatPriceLabel: {
    color: 'rgba(255, 255, 255, 0.66)',
    fontSize: 10,
    lineHeight: 12,
  },
  seatPriceValue: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  seatLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendAvailable: {
    backgroundColor: '#2FAE57',
  },
  legendSelected: {
    backgroundColor: '#72D7FF',
  },
  legendReserved: {
    backgroundColor: '#E2A546',
  },
  legendBooked: {
    backgroundColor: '#564266',
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 15,
  },
  seatMapViewport: {
    minWidth: 470,
    gap: 12,
  },
  seatMapTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  seatMapTopSpacer: {
    flex: 1,
    minHeight: 1,
  },
  screenBottomWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  screenArc: {
    width: '88%',
    height: 38,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.68)',
    opacity: 0.95,
  },
  screenLabel: {
    color: 'rgba(255, 255, 255, 0.76)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: -2,
  },
  seatGridShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exitColumn: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatGrid: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  seatRowWrap: {
    gap: 10,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    width: 16,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  seatRowSeats: {
    flexDirection: 'row',
    gap: 8,
  },
  seatCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatButton: {
    width: 46,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 4,
  },
  vipSeat: {
    backgroundColor: '#202f0900',
    borderColor: '#7AF09A',
    borderWidth:2
  },
  regularSeat: {
    backgroundColor: '#2fae5700',
    borderColor: '#72E08F',
    borderWidth:2
  },
  reservedSeat : {
    backgroundColor: '#717171',
    borderColor: '#717171',
  },
  bookedSeat: {
   backgroundColor: '#717171',
    borderColor: '#717171',
  },
  selectedSeat: {
    backgroundColor: '#72E08F',
    borderColor: '#72E08F',
  },
  seatButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  disabledSeatText: {
    color: 'rgba(255, 255, 255, 0.72)',
  },
  selectedSeatText: {
    color: '#123C52',
  },
  seatMapBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectedSeatSummary: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(32, 0, 48, 0.32)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectedSeatSummaryLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  selectedSeatSummaryValue: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  selectedSeatSummaryCost: {
    color: '#A8F6B9',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 6,
  },
  verticalAisle: {
    width: 18,
    height: 2,
    marginHorizontal: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  horizontalAisle: {
    height: 14,
    marginLeft: 28,
    marginRight: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  exitChip: {
    minWidth: 60,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 104, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 104, 0)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  exitChipCompact: {
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  exitChipText: {
    color: '#ff6600',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  exitChipSpacer: {
    minWidth: 60,
    height: 30,
  },
  exitChipSpacerCompact: {
    minWidth: 52,
    height: 28,
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
  summaryTicketCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(32, 0, 48, 0.22)',
    padding: 14,
    gap: 10,
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
  confirmedMovieRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  confirmedMoviePoster: {
    width: 64,
    height: 88,
    borderRadius: 10,
  },
  confirmedMovieInfo: {
    flex: 1,
    gap: 6,
  },
  confirmedMovieTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  confirmedMovieTime: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
  },
});


