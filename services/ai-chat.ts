import Constants from 'expo-constants';
import { Platform } from 'react-native';

const AUTH_TOKEN = 'test';
const DEFAULT_PORT = '3000';
const LOCALHOST_BASE_URL = `https://localhost:${DEFAULT_PORT}`;
const REQUEST_TIMEOUT_MS = 45000;

export type AIIntent =
  | 'search_all_movies'
  | 'movie_show_timetable'
  | 'query_seats'
  | 'query_seat_availability'
  | 'book_movie'
  | 'get_booking'
  | 'small_talk'
  | 'unknown'
  | 'unsupported_feature'
  | 'need_more_info';

export type MovieSummary = {
  id: string;
  title: string;
  release_date: string;
  description: string;
  poster_url: string;
};

export type ShowTiming = {
  id: string;
  movie_id: string;
  movie_title: string;
  screen_number: number;
  show_timing: string;
  show_timing_epoch: number;
  show_type: string;
  location_id: string;
  price_label: string;
};

export type ShowVenue = {
  id: string;
  name: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  shows: Record<string, ShowTiming[]>;
};

export type MovieDetails = {
  id: string;
  title: string;
  duration: number;
  release_date: string;
  genres: string[];
  cast: string[];
  description: string;
  poster_url: string;
};

export type TheatreExit =
  | 'bottom-left'
  | 'bottom-right'
  | 'middle-left'
  | 'middle-right'
  | 'top-left'
  | 'top-right';

export type TheatreSeatStatus = 'available' | 'booked' | 'reserved';
export type TheatreSeatType = 'VIP' | 'Regular' | string;

export type TheatreSeat = {
  type: TheatreSeatType;
  status: TheatreSeatStatus;
  seat_number: string;
  cost: number;
  booking_id?: string;
};

export type TheatreSeatRow = {
  row: string;
  seats: TheatreSeat[];
};

export type TheatreAisles = {
  vertical_after_seat_indexes?: number[];
  horizontal_after_rows?: string[];
};

export type TheatreLayout = {
  id: string;
  movie_id: string;
  movie_title: string;
  screen_number: number;
  show_timing_epoch: number;
  show_type: string;
  location_id: string;
  exits: TheatreExit[];
  seat_rows: TheatreSeatRow[];
  aisles?: TheatreAisles;
  price_label: number;
  available_seats?: number | null;
};

export type BookingData = {
  id: string;
  booking_id: string;
  user_id: string;
  show_id: string;
  movie_name?: string;
  movie_poster?: string;
  show_timing_epoch?: number;
  seat_numbers: string[];
  pricing: {
    tickets_price: number;
    convenience_fee: number;
    order_total: number;
  };
  payment_info: {
    payment_id: string;
    payment_status: string;
    payment_method: string;
    transaction_time: string;
    payment_amount: number;
    convenience_fees?: number;
  };
  status: string;
  payment_link?: string;
};

export type AIQueryRequest = {
  q: string;
  movieId?: string;
  showId?: string;
  bookingId?: string;
  seatNumbers?: string[];
  deviceId?: string;
};

export type AIQueryResponse =
  | {
    intent: 'search_all_movies';
    chat_response: string;
    api_data: {
      data: {
        movies: MovieSummary[];
        nextCursor: string | null;
      };
      error?: string | null;
    };
  }
  | {
    intent: 'movie_show_timetable';
    chat_response: string;
    api_data: {
      movie_details: {
        data: {
          movie: MovieDetails;
        };
      };
      show_timings: {
        data: ShowVenue[];
        error?: string | null;
      };
    };
  }
  | {
    intent: 'query_seats';
    chat_response: string;
    api_data: {
      data: TheatreLayout | null;
      available_seats?: number | null;
      error?: string | null;
    };
  }
  | {
    intent: 'query_seat_availability';
    chat_response: string;
    api_data: {
      available_seats: number | null;
      error?: string | null;
    };
  }
  | {
    intent: 'book_movie';
    chat_response: string;
    api_data: {
      data: BookingData | null;
      error?: string | null;
    };
  }
  | {
    intent: 'get_booking';
    chat_response: string;
    api_data: {
      data: BookingData | null;
      error?: string | null;
    };
  }
  | {
    intent: 'small_talk';
    chat_response: string;
  }
  | {
    intent: 'unknown';
    chat_response: string;
  }
  | {
    intent: 'unsupported_feature';
    chat_response: string;
  }
  | {
    intent: 'need_more_info';
    chat_response: string;
  };

type RawMovie = {
  id: string;
  title: string;
  release_date: string;
  poster_url: string;
  description?: string;
};

type RawMovieDetails = {
  id: string;
  title: string;
  duration: number;
  release_date: string;
  genres?: string[];
  cast?: string[];
  description?: string;
  poster_url: string;
};

type RawShowTiming = {
  id: string;
  movie_id: string;
  movie_title: string;
  screen_number: number;
  show_timing_epoch: number;
  show_type: string;
  location_id: string;
  show_timing: string;
  price_label?: number;
  payment_amount?: number;
};

type RawShowVenue = {
  id: string;
  name: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  shows: Array<Record<string, RawShowTiming[]>> | Record<string, RawShowTiming[]>;
};

type RawTheatreSeat = {
  type: TheatreSeatType;
  status: TheatreSeatStatus;
  seat_number?: string;
  cost: number;
  booking_id?: string;
};

type RawTheatreSeatRow = {
  row: string;
  seats: RawTheatreSeat[];
};

type RawTheatreAisles = {
  vertical_after_seat_indexes?: number[];
  horizontal_after_rows?: string[];
};

type RawTheatreLayout = {
  id: string;
  movie_id: string;
  movie_title: string;
  screen_number: number;
  show_timing_epoch: number;
  show_type: string;
  location_id: string;
  exits: TheatreExit[];
  seat_rows: RawTheatreSeatRow[];
  aisles?: RawTheatreAisles;
  price_label: number;
};

type RawBookingData = {
  id: string;
  booking_id: string;
  user_id: string;
  show_id: string;
  movie_name?: string;
  movieName?: string;
  movie_poster?: string;
  moviePoster?: string;
  poster_url?: string;
  movie_poster_url?: string;
  show_timing_epoch?: number;
  showTimingEpoch?: number;
  seat_numbers: string[];
  payment_info: {
    payment_id: string;
    payment_status: string;
    payment_method: string;
    transaction_time: string;
    payment_amount: number;
    convenience_fees?: number;
  };
  status: string;
  payment_link?: string;
};

type RawAIQueryResponse =
  | {
    intent: 'search_all_movies';
    chat_response: string;
    api_data: {
      data: {
        movies: RawMovie[] | null;
        nextCursor: string | null;
      };
      error?: string | null;
    };
  }
  | {
    intent: 'movie_show_timetable';
    chat_response: string;
    api_data: {
      movie_details: {
        data: {
          movie: RawMovieDetails;
        };
      };
      show_timings: {
        data: RawShowVenue[] | null;
        error?: string | null;
      };
    };
  }
  | {
    intent: 'query_seats';
    chat_response: string;
    api_data: {
      data: RawTheatreLayout | null;
      available_seats?: number | null;
      error?: string | null;
    };
  }
  | {
    intent: 'query_seat_availability';
    chat_response: string;
    api_data: {
      available_seats: number | null;
      error?: string | null;
    };
  }
  | {
    intent: 'book_movie';
    chat_response: string;
    api_data: {
      data: RawBookingData | null;
      error?: string | null;
    };
  }
  | {
    intent: 'get_booking';
    chat_response: string;
    api_data: {
      data: RawBookingData | null;
      error?: string | null;
    };
  }
  | {
    intent: 'small_talk';
    chat_response: string;
  }
  | {
    intent: 'unknown';
    chat_response: string;
  }
  | {
    intent: 'unsupported_feature';
    chat_response: string;
  }
  | {
    intent: 'need_more_info';
    chat_response: string;
  };

function extractHostCandidate(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  const withProtocol = normalizedValue.includes('://')
    ? normalizedValue
    : `http://${normalizedValue}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.hostname || null;
  } catch {
    const matchedHost = normalizedValue.match(/([0-9]{1,3}(?:\.[0-9]{1,3}){3}|localhost)/i);
    return matchedHost?.[1] ?? null;
  }
}

function resolveApiBaseUrl() {
const configuredBaseUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  const hostCandidate =
    extractHostCandidate(Constants.expoConfig?.hostUri) ??
    extractHostCandidate(Constants.linkingUri) ??
    extractHostCandidate((Constants as typeof Constants & {
      expoGoConfig?: { debuggerHost?: string | null };
    }).expoGoConfig?.debuggerHost);

  if (hostCandidate && hostCandidate !== 'localhost') {
    return `http://${hostCandidate}:${DEFAULT_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  return LOCALHOST_BASE_URL;
}

export function buildAIRequest(request: AIQueryRequest) {
  const baseUrl = resolveApiBaseUrl();
  const query = new URLSearchParams({ q: request.q });
  const body: Record<string, unknown> = {};

  if (request.movieId) {
    body.movieId = request.movieId;
    body.movie_id = request.movieId;
  }
  if (request.showId) {
    body.showId = request.showId;
    body.show_id = request.showId;
  }
  if (request.bookingId) {
    body.bookingId = request.bookingId;
  }
  if (request.seatNumbers && request.seatNumbers.length > 0) {
    body.seatNumbers = request.seatNumbers;
    body.seat_numbers = request.seatNumbers;
  }
  

  return {
    url: `${baseUrl}/ai/query?${query.toString()}`,
    options: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Device-Id': request.deviceId ?? '',
      },
      body: JSON.stringify(body),
    },
    body,
    baseUrl,
  };
}

function formatCurrency(value?: number) {
  return `\u20B9 ${value}+`;
}

function derivePricing(paymentAmount: number, convenienceFees?: number) {
  const convenienceFee = convenienceFees ?? 0;
  const ticketsPrice = Math.max(paymentAmount, 0);

  return {
    tickets_price: ticketsPrice,
    convenience_fee: convenienceFee,
    order_total: paymentAmount + convenienceFee,
  };
}

function normalizeMovie(movie: RawMovie): MovieSummary {
  return {
    id: movie.id,
    title: movie.title,
    release_date: movie.release_date,
    poster_url: movie.poster_url,
    description: movie.description ?? 'Details will appear here once the movie metadata is available from the API.',
  };
}

function normalizeMovieDetails(movie: RawMovieDetails): MovieDetails {
  return {
    id: movie.id,
    title: movie.title,
    duration: movie.duration,
    release_date: movie.release_date,
    genres: movie.genres ?? [],
    cast: movie.cast ?? [],
    description: movie.description ?? '',
    poster_url: movie.poster_url,
  };
}

function buildFallbackMovieDetails(): MovieDetails {
  return {
    id: 'unknown-movie',
    title: 'Movie details unavailable',
    duration: 0,
    release_date: new Date(0).toISOString(),
    genres: [],
    cast: [],
    description: '',
    poster_url: '',
  };
}

function normalizeShowTiming(show: RawShowTiming): ShowTiming {
  const paymentAmount = show.payment_amount ?? 0;

  return {
    id: show.id,
    movie_id: show.movie_id,
    movie_title: show.movie_title,
    screen_number: show.screen_number,
    show_timing_epoch: show.show_timing_epoch,
    show_type: show.show_type,
    location_id: show.location_id,
    show_timing: show.show_timing,
    price_label: formatCurrency(show.price_label) ?? formatCurrency(paymentAmount),
  };
}

function normalizeShowVenue(venue: RawShowVenue): ShowVenue {
  const normalizedShowsSource = Array.isArray(venue.shows)
    ? venue.shows.reduce<Record<string, RawShowTiming[]>>((accumulator, showGroup) => {
      Object.entries(showGroup).forEach(([format, shows]) => {
        accumulator[format] = [...(accumulator[format] ?? []), ...(Array.isArray(shows) ? shows : [])];
      });

      return accumulator;
    }, {})
    : venue.shows;

  return {
    id: venue.id,
    name: venue.name,
    address: venue.address,
    location: venue.location,
    shows: Object.fromEntries(
      Object.entries(normalizedShowsSource).map(([format, shows]) => [
        format,
        shows.map((show) => normalizeShowTiming(show)),
      ])
    ),
  };
}

function normalizeTheatreLayout(data: RawTheatreLayout): TheatreLayout {
  return {
    id: data.id,
    movie_id: data.movie_id,
    movie_title: data.movie_title,
    screen_number: data.screen_number,
    show_timing_epoch: data.show_timing_epoch,
    show_type: data.show_type,
    location_id: data.location_id,
    exits: data.exits ?? [],
    seat_rows: (data.seat_rows ?? []).map((row) => ({
      row: row.row,
      seats: (row.seats ?? []).map((seat, seatIndex) => ({
        type: seat.type,
        status: seat.status,
        seat_number: seat.seat_number?.trim() || `${row.row}${seatIndex + 1}`,
        cost: data.price_label ?? seat.cost ?? 0,
        booking_id: seat.booking_id,
      })),
    })),
    aisles: data.aisles
      ? {
          vertical_after_seat_indexes: data.aisles.vertical_after_seat_indexes ?? [],
          horizontal_after_rows: data.aisles.horizontal_after_rows ?? [],
        }
      : undefined,
    price_label: data.price_label ?? 0,
    available_seats: null,
  };
}

function normalizeBooking(data: RawBookingData): BookingData {
  return {
    id: data.id,
    booking_id: data.booking_id,
    user_id: data.user_id,
    show_id: data.show_id,
    movie_name: data.movie_name ?? data.movieName,
    movie_poster: data.movie_poster ?? data.moviePoster ?? data.movie_poster_url ?? data.poster_url,
    show_timing_epoch: data.show_timing_epoch ?? data.showTimingEpoch,
    seat_numbers: data.seat_numbers,
    pricing: derivePricing(data.payment_info.payment_amount, data.payment_info.convenience_fees),
    payment_info: data.payment_info,
    status: data.status,
    payment_link: data.payment_link,
  };
}

function normalizeAIResponse(response: RawAIQueryResponse): AIQueryResponse {
  console.log("response.intent", response.intent)
  switch (response.intent) {
    case 'search_all_movies':
      return {
        ...response,
        api_data: {
          data: {
            movies: (response.api_data.data?.movies ?? []).map(normalizeMovie),
            nextCursor: response.api_data.data?.nextCursor ?? null,
          },
          error: response.api_data.error ?? null,
        },
      };
    case 'movie_show_timetable':
      return {
        ...response,
        api_data: {
          movie_details: {
            data: {
              movie: response.api_data.movie_details?.data?.movie
                ? normalizeMovieDetails(response.api_data.movie_details.data.movie)
                : buildFallbackMovieDetails(),
            },
          },
          show_timings: {
            data: (response.api_data.show_timings.data ?? []).map(normalizeShowVenue),
            error: response.api_data.show_timings.error ?? null,
          },
        },
      };
    case 'query_seats':
      const normalizedLayout = response.api_data.data ? normalizeTheatreLayout(response.api_data.data) : null;

      if (normalizedLayout) {
        normalizedLayout.available_seats =
          typeof response.api_data.available_seats === 'number'
            ? response.api_data.available_seats
            : null;
      }

      return {
        ...response,
        api_data: {
          data: normalizedLayout,
          available_seats:
            typeof response.api_data.available_seats === 'number'
              ? response.api_data.available_seats
              : null,
          error: response.api_data.error ?? null,
        },
      };
    case 'query_seat_availability':
      return {
        ...response,
        api_data: {
          available_seats:
            typeof response.api_data.available_seats === 'number'
              ? response.api_data.available_seats
              : null,
          error: response.api_data.error ?? null,
        },
      };
    case 'book_movie':
      return {
        ...response,
        api_data: {
          data: response.api_data.data ? normalizeBooking(response.api_data.data) : null,
          error: response.api_data.error ?? null,
        },
      };
    case 'get_booking':
      return {
        ...response,
        api_data: {
          data: response.api_data.data ? normalizeBooking(response.api_data.data) : null,
          error: response.api_data.error ?? null,
        },
      };
    case 'unsupported_feature':
    case 'unknown':
    case 'small_talk':
    case 'need_more_info':
      return { ...response }
    default:
      throw new Error('Unsupported intent returned by AI API.');
  }
}

const MOCK_THEATRE_LAYOUT_TEMPLATE: RawTheatreLayout = {
  id: '68b200000000000000000001',
  movie_id: '68b02b634cb16581f7773598',
  movie_title: 'The Dark Knight',
  screen_number: 1,
  show_timing_epoch: 1808222400,
  show_type: 'IMAX 2D',
  location_id: '68b0635b4cb16581f77735b4',
  exits: ['bottom-left', 'bottom-right', 'middle-left', 'top-right'],
  aisles: {
    vertical_after_seat_indexes: [2, 5],
    horizontal_after_rows: ['B', 'F'],
  },
  seat_rows: [
    { row: 'A', seats: [{ type: 'VIP', status: 'available', cost: 100 }, { type: 'VIP', status: 'available', cost: 100 }, { type: 'VIP', status: 'booked', cost: 100 }, { type: 'VIP', status: 'available', cost: 100 }, { type: 'VIP', status: 'available', cost: 100 }, { type: 'VIP', status: 'available', cost: 100 }, { type: 'VIP', status: 'available', cost: 100 }] },
    { row: 'B', seats: [{ type: 'VIP', status: 'available', cost: 100 }, { type: 'VIP', status: 'booked', cost: 100 }, { type: 'VIP', status: 'available', cost: 100 }, { type: 'VIP', status: 'available', cost: 100 }, { type: 'VIP', status: 'available', cost: 100 }, { type: 'VIP', status: 'available', cost: 100 }, { type: 'VIP', status: 'available', cost: 100 }] },
    { row: 'C', seats: [{ type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'booked', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'pHwMTIhXMEHN', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'pHwMTIhXMEHN', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'pHwMTIhXMEHN', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }] },
    { row: 'D', seats: [{ type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'booked', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'zhAK0nD9kyCE', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }] },
    { row: 'E', seats: [{ type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'lqItTVKykOMK', cost: 100 }, { type: 'Regular', status: 'booked', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'PXv2VcJwgFGf', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'PXv2VcJwgFGf', cost: 100 }] },
    { row: 'F', seats: [{ type: 'Regular', status: 'reserved', booking_id: 'gFu8GPGoeVEw', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'gFu8GPGoeVEw', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'gFu8GPGoeVEw', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'xD9QK1N4j6n1', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'xD9QK1N4j6n1', cost: 100 }, { type: 'Regular', status: 'booked', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }] },
    { row: 'G', seats: [{ type: 'Regular', status: 'booked', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'gphNP41cgY4k', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'gphNP41cgY4k', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'Vi2LUirkUn53', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'Vi2LUirkUn53', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'KlJTGbXInbuR', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'KlJTGbXInbuR', cost: 100 }] },
    { row: 'H', seats: [{ type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'booked', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'MJ3W5VKINVzN', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'MJ3W5VKINVzN', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'MJ3W5VKINVzN', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'RHRasibUeCJ6', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'RHRasibUeCJ6', cost: 100 }] },
    { row: 'I', seats: [{ type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'booked', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'GrODhWgFMM2D', cost: 100 }, { type: 'Regular', status: 'reserved', booking_id: 'GrODhWgFMM2D', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }] },
    { row: 'J', seats: [{ type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'booked', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }, { type: 'Regular', status: 'available', cost: 100 }] },
  ],
  price_label: 100,
};

export function buildMockSeatQueryResponse(show: ShowTiming): AIQueryResponse {
  const mockLayout: RawTheatreLayout = {
    ...MOCK_THEATRE_LAYOUT_TEMPLATE,
    id: show.id,
    movie_id: show.movie_id,
    movie_title: show.movie_title,
    screen_number: show.screen_number,
    show_timing_epoch: show.show_timing_epoch,
    show_type: show.show_type,
    location_id: show.location_id,
  };

  return normalizeAIResponse({
    intent: 'query_seats',
    chat_response: `Here is the live seating layout for ${show.movie_title}. Pick any available seats or type them in chat like A1, A2.`,
    api_data: {
      data: mockLayout,
      available_seats: 35,
    },
  });
}

export async function queryAI(request: AIQueryRequest): Promise<AIQueryResponse> {
  const { url, options, body, baseUrl } = buildAIRequest(request);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  console.log('[AI API] 🌐 FINAL URL:', url);
  console.log('[AI API] 🌐 METHOD:', options.method);
  const configuredBaseUrl = Constants.expoConfig?.extra?.apiUrl;
console.log("BASE URL:", configuredBaseUrl);
  console.log('[AI API] Request:', {
    configuredBaseUrl: configuredBaseUrl ?? null,
    baseUrl,
    url,
    method: options.method,
    headers: options.headers,
    query: request.q,
    body,
    deviceId: request.deviceId ?? null,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

  try {
    console.log('[AI API] Fetch started');
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    console.log('[AI API] ✅ RESPONSE RECEIVED');

    const responseText = await response.text();
    console.log('[AI API] 📦 STATUS:', response.status);
    console.log('[AI API] 📦 BODY:', responseText);

    console.log('[AI API] Raw Response:', {
      status: response.status,
      ok: response.ok,
      body: responseText,
    });

    if (!response.ok) {
      throw new Error(`AI API request failed with status ${response.status}`);
    }

    let parsedResponse: RawAIQueryResponse;

    try {
      parsedResponse = JSON.parse(responseText) as RawAIQueryResponse;
    } catch {
      throw new Error('AI API returned invalid JSON.');
    }

    const normalizedResponse = normalizeAIResponse(parsedResponse);

    console.log('[AI API] Normalized Response:', normalizedResponse);

    return normalizedResponse;
  } catch (error) {

    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[AI API] ❌ ERROR NAME:', error?.name);
      console.log('[AI API] ❌ ERROR MESSAGE:', error?.message);
      console.log('[AI API] ❌ ERROR FULL:', JSON.stringify(error));

      console.log('[AI API] Request timed out before a response was received.');
      throw new Error(
        `AI API request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds. Check that the backend is reachable from this device.`
      );
    }

    console.log('[AI API] Request failed before a response was received:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
