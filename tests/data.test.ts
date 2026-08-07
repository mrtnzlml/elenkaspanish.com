import { describe, it, expect } from "vitest";
import { categories, getAllWords, shuffle, wordOfTheDay } from "../src/data/words";
import { sentences } from "../src/data/sentences";
import { verbs } from "../src/data/verbs";
import { accentWords } from "../src/data/accents";
import { gapSentences } from "../src/data/fill-the-gap";
import { seasons, seasonFor, FLAG_BASE, DEFAULT_CUT } from "../src/data/picado-seasons";

// ---------------------------------------------------------------------------
// words.ts
// ---------------------------------------------------------------------------
describe("words.ts", () => {
  it("has at least 5 categories", () => {
    expect(categories.length).toBeGreaterThanOrEqual(5);
  });

  it("each category has a name, label, and non-empty words array", () => {
    for (const cat of categories) {
      expect(cat.name.trim(), `category missing name`).toBeTruthy();
      expect(cat.label.trim(), `category missing label`).toBeTruthy();
      expect(cat.words.length, `category "${cat.name}" has no words`).toBeGreaterThan(0);
    }
  });

  it("each word pair has non-empty es and en", () => {
    for (const cat of categories) {
      for (const w of cat.words) {
        expect(w.es.trim(), `empty Spanish in ${cat.name}`).toBeTruthy();
        expect(w.en.trim(), `empty English in ${cat.name}`).toBeTruthy();
      }
    }
  });

  it("no duplicate Spanish words across all categories", () => {
    const all = getAllWords().map((w) => w.es.toLowerCase());
    const dupes = all.filter((w, i) => all.indexOf(w) !== i);
    expect(dupes, "duplicate Spanish words found").toEqual([]);
  });

  it("each category has at least 10 words (enough for game rounds)", () => {
    for (const cat of categories) {
      expect(
        cat.words.length,
        `category "${cat.name}" needs ≥10 words`,
      ).toBeGreaterThanOrEqual(10);
    }
  });

  it("total word count is ≥ 50", () => {
    expect(getAllWords().length).toBeGreaterThanOrEqual(50);
  });

  describe("shuffle()", () => {
    it("returns same length", () => {
      expect(shuffle([1, 2, 3, 4, 5])).toHaveLength(5);
    });

    it("contains all original elements", () => {
      const arr = [1, 2, 3, 4, 5];
      expect(shuffle(arr).sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it("does not mutate the input", () => {
      const arr = [1, 2, 3];
      const copy = [...arr];
      shuffle(arr);
      expect(arr).toEqual(copy);
    });
  });

  describe("getAllWords()", () => {
    it("returns the sum of all category word counts", () => {
      const total = categories.reduce((s, c) => s + c.words.length, 0);
      expect(getAllWords()).toHaveLength(total);
    });
  });
});

describe("wordOfTheDay", () => {
  const DAY = 86_400_000;
  it("is deterministic within a UTC day", () => {
    expect(wordOfTheDay(new Date("2026-07-04T00:00:01Z"))).toEqual(
      wordOfTheDay(new Date("2026-07-04T23:59:59Z")),
    );
  });
  it("returns a pair from the pool", () => {
    expect(getAllWords()).toContainEqual(wordOfTheDay(new Date("2026-01-15T12:00:00Z")));
  });
  it("changes on consecutive days and cycles after the pool length", () => {
    const d0 = new Date("2026-03-01T12:00:00Z");
    const d1 = new Date(d0.getTime() + DAY);
    const dn = new Date(d0.getTime() + getAllWords().length * DAY);
    expect(wordOfTheDay(d0)).not.toEqual(wordOfTheDay(d1));
    expect(wordOfTheDay(dn)).toEqual(wordOfTheDay(d0));
  });
});

// ---------------------------------------------------------------------------
// sentences.ts
// ---------------------------------------------------------------------------
describe("sentences.ts", () => {
  it("has at least 15 sentences (used by sentence-builder)", () => {
    expect(sentences.length).toBeGreaterThanOrEqual(15);
  });

  it("each sentence has a non-empty English translation", () => {
    for (const s of sentences) {
      expect(s.en.trim()).toBeTruthy();
    }
  });

  it("each sentence has an es array with at least 2 words", () => {
    for (const s of sentences) {
      expect(s.es.length, `"${s.en}" needs ≥2 Spanish words`).toBeGreaterThanOrEqual(2);
    }
  });

  it("es arrays contain only non-empty strings", () => {
    for (const s of sentences) {
      for (const word of s.es) {
        expect(typeof word).toBe("string");
        expect(word.trim(), `empty word in "${s.en}"`).toBeTruthy();
      }
    }
  });

  it("no duplicate English sentences", () => {
    const ens = sentences.map((s) => s.en.toLowerCase());
    const dupes = ens.filter((e, i) => ens.indexOf(e) !== i);
    expect(dupes).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// verbs.ts
// ---------------------------------------------------------------------------
describe("verbs.ts", () => {
  it("has at least 30 challenges", () => {
    expect(verbs.length).toBeGreaterThanOrEqual(30);
  });

  it("each verb has all required non-empty fields", () => {
    for (const v of verbs) {
      expect(v.infinitive.trim(), "missing infinitive").toBeTruthy();
      expect(v.meaning.trim(), "missing meaning").toBeTruthy();
      expect(v.pronoun.trim(), "missing pronoun").toBeTruthy();
      expect(v.tense.trim(), "missing tense").toBeTruthy();
      expect(v.answer.trim(), "missing answer").toBeTruthy();
    }
  });

  it("no duplicate pronoun + infinitive combinations", () => {
    const keys = verbs.map((v) => `${v.pronoun}|${v.infinitive}`);
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(dupes).toEqual([]);
  });

  it("answers are lowercase", () => {
    for (const v of verbs) {
      expect(v.answer, `answer "${v.answer}" not lowercase`).toBe(v.answer.toLowerCase());
    }
  });

  it("covers at least 5 distinct verbs", () => {
    const infinitives = new Set(verbs.map((v) => v.infinitive));
    expect(infinitives.size).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// accents.ts
// ---------------------------------------------------------------------------
describe("accents.ts", () => {
  const ACCENTED = /[áéíóúñ]/;

  it("has at least 50 words", () => {
    expect(accentWords.length).toBeGreaterThanOrEqual(50);
  });

  it("each entry has non-empty correct and en fields", () => {
    for (const w of accentWords) {
      expect(w.correct.trim()).toBeTruthy();
      expect(w.en.trim()).toBeTruthy();
    }
  });

  it("every 'correct' word contains at least one accented character or ñ", () => {
    for (const w of accentWords) {
      expect(
        ACCENTED.test(w.correct),
        `"${w.correct}" has no accent/ñ`,
      ).toBe(true);
    }
  });

  it("no duplicate words", () => {
    const words = accentWords.map((w) => w.correct.toLowerCase());
    const dupes = words.filter((w, i) => words.indexOf(w) !== i);
    expect(dupes).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// fill-the-gap.ts
// ---------------------------------------------------------------------------
describe("fill-the-gap.ts", () => {
  it("has at least 20 sentences", () => {
    expect(gapSentences.length).toBeGreaterThanOrEqual(20);
  });

  it("each sentence contains ___ placeholder", () => {
    for (const q of gapSentences) {
      expect(q.sentence, `"${q.en}" missing ___`).toContain("___");
    }
  });

  it("each question has exactly 3 distractors", () => {
    for (const q of gapSentences) {
      expect(q.distractors, `"${q.en}" needs 3 distractors`).toHaveLength(3);
    }
  });

  it("answer never appears among its own distractors", () => {
    for (const q of gapSentences) {
      expect(
        q.distractors.map((d) => d.toLowerCase()),
        `"${q.en}": answer "${q.answer}" is also a distractor`,
      ).not.toContain(q.answer.toLowerCase());
    }
  });

  it("all distractors are non-empty strings", () => {
    for (const q of gapSentences) {
      for (const d of q.distractors) {
        expect(typeof d).toBe("string");
        expect(d.trim()).toBeTruthy();
      }
    }
  });

  it("each question has non-empty en and answer", () => {
    for (const q of gapSentences) {
      expect(q.en.trim()).toBeTruthy();
      expect(q.answer.trim()).toBeTruthy();
    }
  });

  it("no duplicate sentences", () => {
    const sents = gapSentences.map((q) => q.sentence);
    const dupes = sents.filter((s, i) => sents.indexOf(s) !== i);
    expect(dupes).toEqual([]);
  });

  it("no duplicate distractors within a single question", () => {
    for (const q of gapSentences) {
      const lower = q.distractors.map((d) => d.toLowerCase());
      const dupes = lower.filter((d, i) => lower.indexOf(d) !== i);
      expect(dupes, `"${q.en}" has duplicate distractors`).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// picado-seasons.ts
// ---------------------------------------------------------------------------
describe("picado-seasons.ts", () => {
  const d = (iso: string) => new Date(iso + "T12:00:00");
  it("every season has a name, cut, colors, and window", () => {
    expect(seasons.length).toBeGreaterThanOrEqual(3); // CLAUDE.md invites adding holidays
    for (const s of seasons) {
      expect(s.cut.trim()).toBeTruthy();
      expect(s.colors.length).toBeGreaterThanOrEqual(3);
      expect(s.start.length).toBe(2);
      expect(s.end.length).toBe(2);
    }
    expect(FLAG_BASE.startsWith("M0 0H40")).toBe(true);
    expect(DEFAULT_CUT.trim()).toBeTruthy();
  });
  it("resolves windows inclusively", () => {
    expect(seasonFor(d("2026-08-31"))).toBeNull();
    expect(seasonFor(d("2026-09-01"))?.name).toBe("patrias");
    expect(seasonFor(d("2026-09-30"))?.name).toBe("patrias");
    expect(seasonFor(d("2026-10-14"))).toBeNull();
    expect(seasonFor(d("2026-10-15"))?.name).toBe("muertos");
    expect(seasonFor(d("2026-11-08"))?.name).toBe("muertos");
    expect(seasonFor(d("2026-11-09"))).toBeNull();
    expect(seasonFor(d("2026-11-14"))).toBeNull();
  });
  it("navidad wraps the year end", () => {
    expect(seasonFor(d("2026-11-15"))?.name).toBe("navidad");
    expect(seasonFor(d("2026-12-25"))?.name).toBe("navidad");
    expect(seasonFor(d("2027-01-03"))?.name).toBe("navidad");
    expect(seasonFor(d("2027-01-08"))?.name).toBe("navidad");
    expect(seasonFor(d("2027-01-09"))).toBeNull();
    expect(seasonFor(d("2026-07-04"))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Cross-data consistency
// ---------------------------------------------------------------------------
describe("cross-data consistency", () => {
  it("hangman filter produces at least 20 single-word entries", () => {
    // Hangman filters: no spaces, length ≥ 3
    const hangmanWords = getAllWords().filter(
      (w) => !w.es.includes(" ") && w.es.length >= 3,
    );
    expect(hangmanWords.length).toBeGreaterThanOrEqual(20);
  });

  it("listening quiz has enough words for 4-option questions (≥ 4 distinct en values)", () => {
    const uniqueEn = new Set(getAllWords().map((w) => w.en));
    expect(uniqueEn.size).toBeGreaterThanOrEqual(4);
  });

  it("speed quiz has enough words for 4-option questions", () => {
    const uniqueEn = new Set(getAllWords().map((w) => w.en));
    expect(uniqueEn.size).toBeGreaterThanOrEqual(4);
  });
});
