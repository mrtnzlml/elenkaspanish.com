// Real quotes from real students — never rewrite, shorten, or rephrase them.
// Separate paragraphs with "\n\n"; the component renders each as its own <p>.
// Order matters: the `featured` entry is the large spotlight quote, the rest
// flow into a two-column masonry in array order, and anything past
// VISIBLE_COUNT goes behind a "Show more" toggle.
export type Testimonial = {
  name: string;
  quote: string;
  featured?: boolean;
};

export const VISIBLE_COUNT = 10;

// Splits off the first sentence, which the cards set large as a headline.
// Styling only: lead + rest is still the quote word for word.
export function splitLead(quote: string): { lead: string; rest: string[] } {
  const m = quote.match(/^(.+?[.!?])\s+([\s\S]*)$/);
  return m ? { lead: m[1], rest: m[2].split("\n\n") } : { lead: quote, rest: [] };
}

export const testimonials: Testimonial[] = [
  {
    name: "Šárka S.",
    featured: true,
    quote:
      "I can confidently say that Elena is an excellent Spanish teacher. Her lessons are always well-prepared, engaging, and tailored to my level. She explains grammar clearly and makes even difficult topics easy to understand. What I appreciate the most is her patience and positive attitude—she creates a comfortable environment where it’s not stressful to make mistakes, which really helps with learning. The classes are dynamic and include a good balance of speaking, listening, and grammar practice. Thanks to her teaching style, I have improved my Spanish significantly and feel much more confident when using the language. I would highly recommend Elena to anyone looking for a professional, friendly, and effective Spanish teacher.",
  },
  {
    name: "Venuse D.",
    quote:
      "I’m really happy with my Spanish lessons with Elena. She is always perfectly prepared and explains everything clearly and in a way that is easy to understand.\n\nShe is kind, patient, friendly, and creates a relaxed atmosphere where I feel comfortable speaking and making mistakes. I also really appreciate how well she adapts the lessons to my needs and keeps them interesting and varied.\n\nI always learn something new and leave each lesson feeling that I’ve made progress. I can highly recommend Elena to anyone looking for a professional, supportive, and genuinely lovely Spanish teacher!",
  },
  {
    name: "Miroslav S.",
    quote:
      "Learning made fun again! Elena has guided me through my first Spanish words into basic conversations, all in six months. I will go further, and I recommend that everyone join me.",
  },
  {
    name: "Lea P.",
    quote:
      "Elena is an amazing teacher. She tailored the whole curriculum to my needs and the way I learn most effectively. The lessons are productive, fun, and actually make me look forward to studying. I’ve made huge progress and can’t recommend her enough!",
  },
  {
    name: "Michal S.",
    quote:
      "The lessons were great, well-prepared, beneficial, and operationally adjusted for the next session. A huge difference compared to only learning with Duolingo.",
  },
  {
    name: "Tereza K.",
    quote:
      "Great teacher who creates a friendly and supportive atmosphere. The explanations are clear and easy to understand and the lessons are always adapted to my needs. Her approach makes Spanish enjoyable and fun.",
  },
  {
    name: "Petr Š.",
    quote:
      "I am very satisfied, 10/10. Careful preparation and lessons adapted to my needs. She makes sure to keep speaking Spanish even when I slip into English, while still using language I can understand. She covers cultural and regional differences, which matter a lot in Spanish, especially between Europe and Latin America. Unusual and interesting exercises and homework.",
  },
  {
    name: "Natálie D.",
    quote: "The lesson was amazing, and the teacher was very skilled and kind.",
  },
];
