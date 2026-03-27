export interface GapSentence {
  /** Full sentence with the blank shown as ___ */
  sentence: string;
  /** English translation for context */
  en: string;
  /** The correct word that fills the gap */
  answer: string;
  /** Three wrong options */
  distractors: string[];
}

export const gapSentences: GapSentence[] = [
  // Ser / Estar
  { sentence: "Yo ___ estudiante.", en: "I am a student.", answer: "soy", distractors: ["estoy", "tengo", "voy"] },
  { sentence: "Ella ___ en la escuela.", en: "She is at school.", answer: "está", distractors: ["es", "tiene", "va"] },
  { sentence: "Nosotros ___ de México.", en: "We are from Mexico.", answer: "somos", distractors: ["estamos", "tenemos", "vamos"] },
  { sentence: "El café ___ caliente.", en: "The coffee is hot.", answer: "está", distractors: ["es", "tiene", "hay"] },

  // Tener
  { sentence: "Yo ___ hambre.", en: "I am hungry.", answer: "tengo", distractors: ["soy", "estoy", "hago"] },
  { sentence: "Ella ___ veinte años.", en: "She is twenty years old.", answer: "tiene", distractors: ["es", "está", "hace"] },
  { sentence: "Nosotros ___ una pregunta.", en: "We have a question.", answer: "tenemos", distractors: ["somos", "estamos", "hacemos"] },

  // Ir
  { sentence: "Yo ___ al mercado.", en: "I go to the market.", answer: "voy", distractors: ["soy", "estoy", "tengo"] },
  { sentence: "Ellos ___ a la playa.", en: "They go to the beach.", answer: "van", distractors: ["son", "están", "tienen"] },
  { sentence: "Tú ___ a la escuela.", en: "You go to school.", answer: "vas", distractors: ["eres", "estás", "tienes"] },

  // Querer / Poder
  { sentence: "Yo ___ aprender español.", en: "I want to learn Spanish.", answer: "quiero", distractors: ["puedo", "tengo", "hablo"] },
  { sentence: "Ella no ___ venir hoy.", en: "She cannot come today.", answer: "puede", distractors: ["quiere", "tiene", "sabe"] },
  { sentence: "Nosotros ___ ir al cine.", en: "We want to go to the movies.", answer: "queremos", distractors: ["podemos", "tenemos", "vamos"] },

  // Hablar / Comer / Vivir
  { sentence: "Yo ___ español.", en: "I speak Spanish.", answer: "hablo", distractors: ["como", "vivo", "tengo"] },
  { sentence: "Tú ___ en la ciudad.", en: "You live in the city.", answer: "vives", distractors: ["comes", "hablas", "tienes"] },
  { sentence: "Ellos ___ en el restaurante.", en: "They eat at the restaurant.", answer: "comen", distractors: ["viven", "hablan", "tienen"] },

  // Gustar
  { sentence: "Me ___ la música.", en: "I like music.", answer: "gusta", distractors: ["gustan", "gusto", "gustas"] },
  { sentence: "Nos ___ las vacaciones.", en: "We like vacations.", answer: "gustan", distractors: ["gusta", "gustamos", "gusto"] },

  // Hacer / Saber
  { sentence: "¿Qué ___ tú?", en: "What are you doing?", answer: "haces", distractors: ["sabes", "tienes", "eres"] },
  { sentence: "Yo no ___ la respuesta.", en: "I don't know the answer.", answer: "sé", distractors: ["soy", "hago", "tengo"] },

  // Prepositions / Articles
  { sentence: "El libro está ___ la mesa.", en: "The book is on the table.", answer: "sobre", distractors: ["bajo", "entre", "sin"] },
  { sentence: "Vamos ___ la tienda.", en: "We go to the store.", answer: "a", distractors: ["de", "en", "por"] },
  { sentence: "Esto es ___ ti.", en: "This is for you.", answer: "para", distractors: ["por", "con", "sin"] },
  { sentence: "Estudio español ___ mi maestra.", en: "I study Spanish with my teacher.", answer: "con", distractors: ["sin", "para", "por"] },

  // Hay
  { sentence: "___ un gato en la casa.", en: "There is a cat in the house.", answer: "Hay", distractors: ["Es", "Está", "Tiene"] },

  // Mixed
  { sentence: "Ella ___ muy bonita.", en: "She is very pretty.", answer: "es", distractors: ["está", "tiene", "hace"] },
  { sentence: "Yo ___ cansado.", en: "I am tired.", answer: "estoy", distractors: ["soy", "tengo", "hago"] },
  { sentence: "¿___ hora es?", en: "What time is it?", answer: "Qué", distractors: ["Cuál", "Cómo", "Dónde"] },
  { sentence: "Mañana ___ lunes.", en: "Tomorrow is Monday.", answer: "es", distractors: ["está", "hay", "hace"] },
  { sentence: "Hoy ___ mucho calor.", en: "Today it is very hot.", answer: "hace", distractors: ["es", "está", "tiene"] },
];
