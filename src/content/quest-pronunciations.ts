export type QuestPronunciation = {
  ipaUS: string | null;
  ipaUK: string | null;
};

// Compact assessment-only projection of the committed dictionary shards.
// Keeping this in the client bundle makes answer feedback immediate without
// loading the full dictionary index and one or more letter shards.
export const questPronunciations = {
  apple: { ipaUS: "/ˈæpəl/", ipaUK: "/ˈæpəl/" },
  ball: { ipaUS: "/bɔl/", ipaUK: "/bɔːl/" },
  banana: { ipaUS: "/bəˈnænə/", ipaUK: "/bəˈnɑːnə/" },
  bed: { ipaUS: "/ˈbɛd/", ipaUK: "/ˈbɛd/" },
  bench: { ipaUS: null, ipaUK: null },
  beside: { ipaUS: "/bɪˈsaɪd/", ipaUK: "/bɪˈsaɪd/" },
  bicycle: { ipaUS: null, ipaUK: null },
  bird: { ipaUS: "/ˈbɝd/", ipaUK: "/ˈbɜɪ̯d/" },
  blue: { ipaUS: null, ipaUK: null },
  book: { ipaUS: "/bʊk/", ipaUK: "/bʊk/" },
  both: { ipaUS: "/boʊθ/", ipaUK: "/boʊθ/" },
  car: { ipaUS: "/kɑɹ/", ipaUK: "/kɑː/" },
  cat: { ipaUS: "/ˈkæt/", ipaUK: "/ˈkæt/" },
  clock: { ipaUS: "/klɑk/", ipaUK: "/klɒk/" },
  desk: { ipaUS: "/dɛsk/", ipaUK: "/dɛsk/" },
  doctor: { ipaUS: null, ipaUK: null },
  dog: { ipaUS: null, ipaUK: null },
  door: { ipaUS: "/doɹ/", ipaUK: "/dɔː/" },
  egg: { ipaUS: "/ɛɡ/", ipaUK: "/ɛɡ/" },
  farmer: { ipaUS: null, ipaUK: null },
  fish: { ipaUS: "/ˈfɪʃ/", ipaUK: "/ˈfɪʃ/" },
  flower: { ipaUS: "/ˈfloʊɚ/", ipaUK: "/ˈfləʊə/" },
  girl: { ipaUS: "/ˈɡɜɹl/", ipaUK: "/ˈɡɜːl/" },
  goat: { ipaUS: null, ipaUK: null },
  hat: { ipaUS: "/hæt/", ipaUK: "/hat/" },
  hot: { ipaUS: "/hɑt/", ipaUK: "/hɒt/" },
  insect: { ipaUS: null, ipaUK: null },
  leg: { ipaUS: "/ˈlɛɡ/", ipaUK: "/ˈlɛɡ/" },
  map: { ipaUS: "/mæp/", ipaUK: "/mæp/" },
  mother: { ipaUS: "/ˈmʌðɚ/", ipaUK: "/ˈmʌð.ə/" },
  octopus: { ipaUS: null, ipaUK: null },
  on: { ipaUS: "/än/", ipaUK: "/ɒn/" },
  one: { ipaUS: "/wʌn/", ipaUK: "/wʌn/" },
  pencil: { ipaUS: null, ipaUK: null },
  pig: { ipaUS: "/ˈpɪɡ/", ipaUK: "/ˈpɪɡ/" },
  pond: { ipaUS: null, ipaUK: null },
  rabbit: { ipaUS: "/ˈɹæbɪt/", ipaUK: "/ˈɹæbɪt/" },
  // The dictionary's single "read" IPA is the past-tense pronunciation; hide
  // it here because this assessment uses the present-tense verb.
  read: { ipaUS: null, ipaUK: null },
  reading: { ipaUS: null, ipaUK: null },
  red: { ipaUS: "/ɹɛd/", ipaUK: "/ɹɛd/" },
  riding: { ipaUS: null, ipaUK: null },
  ruler: { ipaUS: null, ipaUK: null },
  run: { ipaUS: "/ɹʌn/", ipaUK: "/ɹʌn/" },
  schoolbag: { ipaUS: "/ˈskuːl.bæɡ/", ipaUK: "/ˈskuːl.bæɡ/" },
  sing: { ipaUS: "/ˈsɪŋ/", ipaUK: "/ˈsɪŋ/" },
  sit: { ipaUS: "/sɪt/", ipaUK: "/sɪt/" },
  sleeping: { ipaUS: null, ipaUK: null },
  student: { ipaUS: "/ˈstjuː.dn̩t/", ipaUK: "/ˈstjuː.dn̩t/" },
  sun: { ipaUS: "/sʌn/", ipaUK: "/sʌn/" },
  teacher: { ipaUS: "/ˈti.t͡ʃɚ/", ipaUK: "/ˈtiː.t͡ʃəː/" },
  three: { ipaUS: null, ipaUK: null },
  top: { ipaUS: "/tɑp/", ipaUK: "/tɒp/" },
  tree: { ipaUS: "/tɹiː/", ipaUK: "/tɹiː/" },
  two: { ipaUS: null, ipaUK: null },
  under: { ipaUS: "/ˈʌndɚ/", ipaUK: "/ˈʌndə/" },
  window: { ipaUS: "/ˈwɪndoʊ/", ipaUK: "/ˈwɪndəʊ/" },
  yellow: { ipaUS: "/ˈjɛloʊ/", ipaUK: "/ˈjɛlə/" },
} satisfies Record<string, QuestPronunciation>;

export function getQuestPronunciation(word: string): QuestPronunciation | undefined {
  return questPronunciations[word.trim().toLowerCase() as keyof typeof questPronunciations];
}
