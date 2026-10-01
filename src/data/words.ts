export interface WordPair {
  es: string;
  en: string;
}

export interface WordCategory {
  name: string;
  label: string;
  words: WordPair[];
}

export const categories: WordCategory[] = [
  {
    name: "greetings",
    label: "Greetings",
    words: [
      { es: "Hola", en: "Hello" },
      { es: "Buenos días", en: "Good morning" },
      { es: "Buenas tardes", en: "Good afternoon" },
      { es: "Buenas noches", en: "Good night" },
      { es: "¿Cómo estás?", en: "How are you?" },
      { es: "Bien, gracias", en: "Fine, thank you" },
      { es: "¿Qué tal?", en: "What's up?" },
      { es: "Mucho gusto", en: "Nice to meet you" },
      { es: "Adiós", en: "Goodbye" },
      { es: "Hasta luego", en: "See you later" },
      { es: "Hasta mañana", en: "See you tomorrow" },
      { es: "Por favor", en: "Please" },
      { es: "Gracias", en: "Thank you" },
      { es: "De nada", en: "You're welcome" },
      { es: "Lo siento", en: "I'm sorry" },
    ],
  },
  {
    name: "essentials",
    label: "Essentials",
    words: [
      { es: "Sí", en: "Yes" },
      { es: "No", en: "No" },
      { es: "Tal vez", en: "Maybe" },
      { es: "¿Dónde está...?", en: "Where is...?" },
      { es: "¿Cuánto cuesta?", en: "How much does it cost?" },
      { es: "No entiendo", en: "I don't understand" },
      { es: "¿Puede repetir?", en: "Can you repeat?" },
      { es: "Hablo un poco de español", en: "I speak a little Spanish" },
      { es: "¿Habla inglés?", en: "Do you speak English?" },
      { es: "Necesito ayuda", en: "I need help" },
      { es: "¿Cómo se dice...?", en: "How do you say...?" },
      { es: "Más despacio, por favor", en: "Slower, please" },
      { es: "Tengo una pregunta", en: "I have a question" },
      { es: "¡Claro!", en: "Of course!" },
      { es: "No hay problema", en: "No problem" },
    ],
  },
  {
    name: "food",
    label: "Food & Drink",
    words: [
      { es: "El agua", en: "Water" },
      { es: "El café", en: "Coffee" },
      { es: "La cerveza", en: "Beer" },
      { es: "El pan", en: "Bread" },
      { es: "La comida", en: "Food / Meal" },
      { es: "El desayuno", en: "Breakfast" },
      { es: "El almuerzo", en: "Lunch" },
      { es: "La cena", en: "Dinner" },
      { es: "La cuenta, por favor", en: "The check, please" },
      { es: "Tengo hambre", en: "I'm hungry" },
      { es: "Tengo sed", en: "I'm thirsty" },
      { es: "Delicioso", en: "Delicious" },
      { es: "La propina", en: "The tip" },
      { es: "El menú", en: "The menu" },
      { es: "Sin picante", en: "Not spicy" },
    ],
  },
  {
    name: "travel",
    label: "Travel",
    words: [
      { es: "El aeropuerto", en: "Airport" },
      { es: "La estación", en: "Station" },
      { es: "El hotel", en: "Hotel" },
      { es: "El boleto", en: "Ticket" },
      { es: "La maleta", en: "Suitcase" },
      { es: "El pasaporte", en: "Passport" },
      { es: "A la derecha", en: "To the right" },
      { es: "A la izquierda", en: "To the left" },
      { es: "Derecho", en: "Straight ahead" },
      { es: "Cerca", en: "Near" },
      { es: "Lejos", en: "Far" },
      { es: "La playa", en: "Beach" },
      { es: "El mercado", en: "Market" },
      { es: "El baño", en: "Bathroom" },
      { es: "La salida", en: "Exit" },
    ],
  },
  {
    name: "numbers",
    label: "Numbers & Time",
    words: [
      { es: "Uno", en: "One" },
      { es: "Dos", en: "Two" },
      { es: "Tres", en: "Three" },
      { es: "Cuatro", en: "Four" },
      { es: "Cinco", en: "Five" },
      { es: "Diez", en: "Ten" },
      { es: "Veinte", en: "Twenty" },
      { es: "Cincuenta", en: "Fifty" },
      { es: "Cien", en: "One hundred" },
      { es: "Mil", en: "One thousand" },
      { es: "Primero", en: "First" },
      { es: "Último", en: "Last" },
      { es: "Hoy", en: "Today" },
      { es: "Mañana", en: "Tomorrow" },
      { es: "Ayer", en: "Yesterday" },
    ],
  },
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getAllWords(): WordPair[] {
  return categories.flatMap((c) => c.words);
}
