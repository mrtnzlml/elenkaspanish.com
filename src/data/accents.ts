export interface AccentWord {
  /** The word with correct accents */
  correct: string;
  /** English meaning */
  en: string;
}

export const accentWords: AccentWord[] = [
  // Common words with á
  { correct: "está", en: "is (location/state)" },
  { correct: "más", en: "more" },
  { correct: "papá", en: "dad" },
  { correct: "mamá", en: "mom" },
  { correct: "detrás", en: "behind" },
  { correct: "además", en: "besides" },
  { correct: "quizás", en: "perhaps" },

  // Common words with é
  { correct: "café", en: "coffee" },
  { correct: "también", en: "also" },
  { correct: "después", en: "after" },
  { correct: "inglés", en: "English" },
  { correct: "interés", en: "interest" },
  { correct: "bebé", en: "baby" },

  // Common words with í
  { correct: "aquí", en: "here" },
  { correct: "allí", en: "there" },
  { correct: "así", en: "like this" },
  { correct: "país", en: "country" },
  { correct: "maíz", en: "corn" },
  { correct: "raíz", en: "root" },

  // Common words with ó
  { correct: "corazón", en: "heart" },
  { correct: "lección", en: "lesson" },
  { correct: "información", en: "information" },
  { correct: "avión", en: "airplane" },
  { correct: "camión", en: "truck" },
  { correct: "canción", en: "song" },
  { correct: "estación", en: "station" },

  // Common words with ú
  { correct: "menú", en: "menu" },
  { correct: "algún", en: "some" },
  { correct: "común", en: "common" },
  { correct: "según", en: "according to" },
  { correct: "ningún", en: "none" },

  // Question words
  { correct: "qué", en: "what" },
  { correct: "cómo", en: "how" },
  { correct: "dónde", en: "where" },
  { correct: "cuándo", en: "when" },
  { correct: "cuánto", en: "how much" },
  { correct: "cuál", en: "which" },
  { correct: "quién", en: "who" },
  { correct: "porqué", en: "reason / why (noun)" },

  // Words with ñ (not an accent but commonly confused)
  { correct: "español", en: "Spanish" },
  { correct: "mañana", en: "tomorrow / morning" },
  { correct: "año", en: "year" },
  { correct: "niño", en: "boy / child" },
  { correct: "señor", en: "sir / Mr." },
  { correct: "pequeño", en: "small" },
  { correct: "baño", en: "bathroom" },
  { correct: "sueño", en: "dream / sleep" },

  // Multiple accents / ñ
  { correct: "teléfono", en: "telephone" },
  { correct: "música", en: "music" },
  { correct: "número", en: "number" },
  { correct: "público", en: "public" },
  { correct: "fácil", en: "easy" },
  { correct: "difícil", en: "difficult" },
  { correct: "rápido", en: "fast" },
  { correct: "último", en: "last" },
  { correct: "próximo", en: "next" },
  { correct: "miércoles", en: "Wednesday" },
  { correct: "sábado", en: "Saturday" },
];
