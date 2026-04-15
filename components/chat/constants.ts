export const QUICK_PROMPTS = [
  'Show me all movies near me.',
  'Show me Batman shows near me.',
  'Can you find movies for 5pm tomorrow?',
];

export const PROMPTS_BY_INTENT: Record<string, string[]> = {
  default: [
    'Show me all movies near me.',
    'Show me Batman shows near me.',
    'Can you find movies for 5pm tomorrow?',
  ],
  search_all_movies:[
    'Check shows for a movie'
  ],
  movie_show_timetable: [
    'Book this movie',
    'Check seat availability',
  ],
  query_seat_availability: [
    '2 seats',
    '3 seats',
    'Proceed to booking',
  ],
  book_movie: [
    'Show my booking',
  ],
};

export const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6];
