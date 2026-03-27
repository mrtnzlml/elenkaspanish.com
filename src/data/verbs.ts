export interface VerbChallenge {
  infinitive: string;
  meaning: string;
  pronoun: string;
  tense: string;
  answer: string;
}

export const verbs: VerbChallenge[] = [
  // Hablar - to speak (present)
  { infinitive: "hablar", meaning: "to speak", pronoun: "yo", tense: "presente", answer: "hablo" },
  { infinitive: "hablar", meaning: "to speak", pronoun: "tú", tense: "presente", answer: "hablas" },
  { infinitive: "hablar", meaning: "to speak", pronoun: "él/ella", tense: "presente", answer: "habla" },
  { infinitive: "hablar", meaning: "to speak", pronoun: "nosotros", tense: "presente", answer: "hablamos" },
  { infinitive: "hablar", meaning: "to speak", pronoun: "ellos/ellas", tense: "presente", answer: "hablan" },

  // Comer - to eat (present)
  { infinitive: "comer", meaning: "to eat", pronoun: "yo", tense: "presente", answer: "como" },
  { infinitive: "comer", meaning: "to eat", pronoun: "tú", tense: "presente", answer: "comes" },
  { infinitive: "comer", meaning: "to eat", pronoun: "él/ella", tense: "presente", answer: "come" },
  { infinitive: "comer", meaning: "to eat", pronoun: "nosotros", tense: "presente", answer: "comemos" },
  { infinitive: "comer", meaning: "to eat", pronoun: "ellos/ellas", tense: "presente", answer: "comen" },

  // Vivir - to live (present)
  { infinitive: "vivir", meaning: "to live", pronoun: "yo", tense: "presente", answer: "vivo" },
  { infinitive: "vivir", meaning: "to live", pronoun: "tú", tense: "presente", answer: "vives" },
  { infinitive: "vivir", meaning: "to live", pronoun: "él/ella", tense: "presente", answer: "vive" },
  { infinitive: "vivir", meaning: "to live", pronoun: "nosotros", tense: "presente", answer: "vivimos" },
  { infinitive: "vivir", meaning: "to live", pronoun: "ellos/ellas", tense: "presente", answer: "viven" },

  // Ser - to be (present, irregular)
  { infinitive: "ser", meaning: "to be", pronoun: "yo", tense: "presente", answer: "soy" },
  { infinitive: "ser", meaning: "to be", pronoun: "tú", tense: "presente", answer: "eres" },
  { infinitive: "ser", meaning: "to be", pronoun: "él/ella", tense: "presente", answer: "es" },
  { infinitive: "ser", meaning: "to be", pronoun: "nosotros", tense: "presente", answer: "somos" },
  { infinitive: "ser", meaning: "to be", pronoun: "ellos/ellas", tense: "presente", answer: "son" },

  // Tener - to have (present, irregular)
  { infinitive: "tener", meaning: "to have", pronoun: "yo", tense: "presente", answer: "tengo" },
  { infinitive: "tener", meaning: "to have", pronoun: "tú", tense: "presente", answer: "tienes" },
  { infinitive: "tener", meaning: "to have", pronoun: "él/ella", tense: "presente", answer: "tiene" },
  { infinitive: "tener", meaning: "to have", pronoun: "nosotros", tense: "presente", answer: "tenemos" },
  { infinitive: "tener", meaning: "to have", pronoun: "ellos/ellas", tense: "presente", answer: "tienen" },

  // Ir - to go (present, irregular)
  { infinitive: "ir", meaning: "to go", pronoun: "yo", tense: "presente", answer: "voy" },
  { infinitive: "ir", meaning: "to go", pronoun: "tú", tense: "presente", answer: "vas" },
  { infinitive: "ir", meaning: "to go", pronoun: "él/ella", tense: "presente", answer: "va" },
  { infinitive: "ir", meaning: "to go", pronoun: "nosotros", tense: "presente", answer: "vamos" },
  { infinitive: "ir", meaning: "to go", pronoun: "ellos/ellas", tense: "presente", answer: "van" },

  // Querer - to want (present, irregular)
  { infinitive: "querer", meaning: "to want", pronoun: "yo", tense: "presente", answer: "quiero" },
  { infinitive: "querer", meaning: "to want", pronoun: "tú", tense: "presente", answer: "quieres" },
  { infinitive: "querer", meaning: "to want", pronoun: "él/ella", tense: "presente", answer: "quiere" },
  { infinitive: "querer", meaning: "to want", pronoun: "nosotros", tense: "presente", answer: "queremos" },
  { infinitive: "querer", meaning: "to want", pronoun: "ellos/ellas", tense: "presente", answer: "quieren" },

  // Poder - to be able to (present, irregular)
  { infinitive: "poder", meaning: "to be able to", pronoun: "yo", tense: "presente", answer: "puedo" },
  { infinitive: "poder", meaning: "to be able to", pronoun: "tú", tense: "presente", answer: "puedes" },
  { infinitive: "poder", meaning: "to be able to", pronoun: "él/ella", tense: "presente", answer: "puede" },
  { infinitive: "poder", meaning: "to be able to", pronoun: "nosotros", tense: "presente", answer: "podemos" },
  { infinitive: "poder", meaning: "to be able to", pronoun: "ellos/ellas", tense: "presente", answer: "pueden" },
];
