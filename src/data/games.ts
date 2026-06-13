export type Game = {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
};

export const games: Game[] = [
  {
    title: "Flashcards",
    description: "Flip cards to test your vocabulary. Track what you know and what needs practice.",
    href: "/games/flashcards",
    icon: "&#127183;",
    color: "bg-blue-50",
  },
  {
    title: "Memory Match",
    description: "Find matching Spanish-English pairs in a grid of face-down cards.",
    href: "/games/memory-match",
    icon: "&#129504;",
    color: "bg-purple-50",
  },
  {
    title: "Speed Quiz",
    description: "How many words can you translate in 60 seconds? Race the clock!",
    href: "/games/speed-quiz",
    icon: "&#9889;",
    color: "bg-amber-50",
  },
  {
    title: "Sentence Builder",
    description: "Arrange scrambled Spanish words into the correct sentence order.",
    href: "/games/sentence-builder",
    icon: "&#128221;",
    color: "bg-green-50",
  },
  {
    title: "Verb Conjugation",
    description: "Master Spanish verb forms. Given a verb and pronoun, type the conjugation.",
    href: "/games/verb-conjugation",
    icon: "&#9999;&#65039;",
    color: "bg-rose-50",
  },
  {
    title: "Listening Quiz",
    description: "Hear a Spanish word spoken aloud, then pick the correct English translation.",
    href: "/games/listening-quiz",
    icon: "&#127911;",
    color: "bg-cyan-50",
  },
  {
    title: "Hangman",
    description: "Guess the Spanish word letter by letter from an English clue.",
    href: "/games/hangman",
    icon: "&#128128;",
    color: "bg-gray-50",
  },
  {
    title: "Fill the Gap",
    description: "Pick the correct word to complete a Spanish sentence. Tests grammar in context.",
    href: "/games/fill-the-gap",
    icon: "&#128300;",
    color: "bg-indigo-50",
  },
  {
    title: "Accent Fixer",
    description: "Accents are missing! Click the right letters to add á, é, í, ó, ú, or ñ.",
    href: "/games/accent-fixer",
    icon: "&#9996;",
    color: "bg-orange-50",
  },
];
