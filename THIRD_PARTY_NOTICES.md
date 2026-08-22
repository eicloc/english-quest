# Third-party data and speech notices

The application code and the generated dictionary data are separate works. The
machine-readable hashes, source dates and upstream URLs used for the checked-in
dictionary build are recorded in
`public/content/dictionary/sources.json`.

## Dictionary data

- **New General Service List 1.2 (NGSL)** — Charles Browne, Brent Culligan and
  Joseph Phillips. The checked-in rank list is distributed under CC BY-SA 4.0.
- **English Wiktionary via Wiktextract/Kaikki** — pronunciation and selected
  lexical data derived from Wiktionary. Wiktionary text is available under CC
  BY-SA and GFDL; the generated data retains source identifiers and this notice.
- **Tatoeba** — English and Mandarin sentence pairs, distributed under CC BY
  2.0 FR. Each retained example includes its source sentence ID.
- **ECDICT** — bilingual definitions, parts of speech and phrase translations.
  Its phonetic field is intentionally not used for the displayed US/UK IPA.
  The ECDICT repository is MIT licensed,
  but it aggregates material from multiple upstream dictionaries. Perform a
  formal provenance review before a commercial release.
- **English Quest supplemental terms** — four existing quest terms absent from
  the ranked NGSL file. They are library-only, clearly marked with rank/band 0,
  and do not alter the assessment vocabulary or scoring.
- **Wikimedia Commons pronunciation recordings** — freely licensed recordings
  selected from Wiktionary/Wiktextract pronunciation metadata. The generated
  `pronunciation-audio.json` records the author, Commons description page,
  license name and license URL for every retained audio file. Audio remains
  hosted by Wikimedia Commons and is requested only when its word is selected.

Only the lightweight generated index and letter shards are committed. The raw
ECDICT, Wiktextract and Tatoeba exports are intentionally excluded.

## Speech runtime

- **Browser SpeechSynthesis** — primary runtime voice for quest prompts and the
  fallback when a dictionary recording is unavailable.
- **kokoro-js 1.2.1** — Apache License 2.0; used only as the final fallback.
- **Kokoro-82M-v1.0-ONNX** — Apache License 2.0. Model files are loaded from
  Hugging Face after the learner's first speech request and are not bundled in
  the GitHub Pages artifact.
- **Transformers.js and ONNX Runtime Web** — used transitively by kokoro-js;
  see their package notices for the applicable Apache/MIT licenses.
