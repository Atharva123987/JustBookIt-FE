import {
  AIIntent,
  AIQueryResponse,
  BookingData,
  MovieSummary,
  ShowTiming,
  TheatreLayout,
} from '@/services/ai-chat';

export type IntentResponse<T extends AIIntent> = Extract<AIQueryResponse, { intent: T }>;
export type PaymentMethod = 'stripe';
export type ShowWithFormat = ShowTiming & { format: string };

export type ChatAttachment =
  | { intent: 'search_all_movies'; data: IntentResponse<'search_all_movies'>['api_data'] }
  | { intent: 'movie_show_timetable'; data: IntentResponse<'movie_show_timetable'>['api_data'] }
  | { intent: 'query_seats'; data: IntentResponse<'query_seats'>['api_data'] }
  | { intent: 'query_seat_availability'; data: IntentResponse<'query_seat_availability'>['api_data'] }
  | { intent: 'book_movie'; data: IntentResponse<'book_movie'>['api_data'] }
  | { intent: 'get_booking'; data: IntentResponse<'get_booking'>['api_data'] }
  | { intent: 'seat_selection'; data: { show: ShowWithFormat } };

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  attachment?: ChatAttachment;
};

export type ChatContext = {
  selectedMovieId?: string;
  selectedShowId?: string;
  bookingId?: string;
  pendingShow?: ShowWithFormat;
  seatLayout?: TheatreLayout;
  selectedSeatNumbers?: string[];
  selectedPaymentMethod?: PaymentMethod;
};

export type MoviePressHandler = (movie: MovieSummary) => void;
export type ShowPressHandler = (show: ShowWithFormat) => void;
export type SeatCountPressHandler = (seatCount: number, show: ShowWithFormat) => void;
export type PaymentPressHandler = (booking: BookingData, method: PaymentMethod) => void;
export type SeatToggleHandler = (seatNumber: string) => void;
export type SeatProceedHandler = () => void;
