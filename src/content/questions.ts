import type {
  AssessmentQuestion,
  ChoiceQuestion,
  Mode,
  OralQuestion,
  PhonicsQuestion,
  QuestionOption,
  SceneHotspotQuestion,
  WordReadingQuestion,
} from "@/features/assessment/types";
import { vocabularyById } from "./vocabulary";

const bothModes: Mode[] = ["teacher-led", "self-play"];
const teacherMode: Mode[] = ["teacher-led"];
const manualRubric = {
  score0: "暂时不会",
  score1: "提示后完成",
  score2: "独立完成",
};

function vocabOption(id: string): QuestionOption {
  const asset = vocabularyById[id];
  return {
    id: asset.id,
    label: asset.word,
    zh: asset.zh,
    pronunciationWord: asset.word,
    emoji: asset.emoji,
    imageSrc: asset.imageSrc,
    alt: asset.word,
  };
}

const oralQuestions: OralQuestion[] = [
  ["hello-name", "Hello! What’s your name?", "你好！你叫什么名字？"],
  ["hello-feeling", "How are you today?", "你今天感觉怎么样？"],
  ["hello-age", "How old are you?", "你几岁了？"],
  ["hello-like-english", "Do you like English?", "你喜欢英语吗？"],
  ["hello-color", "What color do you like?", "你喜欢什么颜色？"],
].map(([id, promptEn, promptZh]) => ({
  id,
  stageId: "hello",
  type: "oral-manual",
  skill: "speaking",
  promptEn,
  promptZh,
  audioText: promptEn,
  manualRubric,
  enabledInModes: teacherMode,
}));

const listeningSpecs = [
  ["listen-apple", "Point to the apple.", "请找到苹果。", "apple", ["apple", "banana", "ball", "book"]],
  ["listen-dog", "Find the dog.", "请找到小狗。", "dog", ["dog", "cat", "rabbit", "fish"]],
  ["listen-pencil", "Show me the pencil.", "请找到铅笔。", "pencil", ["pencil", "book", "schoolbag", "ball"]],
  ["listen-rabbit", "Where is the rabbit?", "兔子在哪里？", "rabbit", ["rabbit", "bird", "cat", "dog"]],
  ["listen-teacher", "Can you find the teacher?", "你能找到老师吗？", "teacher", ["teacher", "mother", "rabbit", "cat"]],
  ["listen-banana", "Find the banana.", "请找到香蕉。", "banana", ["banana", "apple", "sun", "ball"]],
  ["listen-book", "Point to the book.", "请找到书。", "book", ["book", "pencil", "schoolbag", "car"]],
  ["listen-bird", "Can you find the bird?", "你能找到小鸟吗？", "bird", ["bird", "fish", "rabbit", "cat"]],
] as const;

const listeningQuestions: ChoiceQuestion[] = listeningSpecs.map(
  ([id, promptEn, promptZh, correctOptionId, optionIds], index) => ({
    id,
    stageId: "word-forest",
    type: "audio-image-choice",
    skill: index < 4 ? "listening" : "vocabulary",
    promptEn,
    promptZh,
    audioText: promptEn,
    options: optionIds.map(vocabOption),
    correctOptionId,
    enabledInModes: bothModes,
    maxAttempts: 2,
  }),
);

const classroomHotspots: SceneHotspotQuestion[] = [
  ["class-teacher", "Find the teacher.", "找到老师。", "teacher"],
  ["class-cat", "Where is the cat?", "小猫在哪里？", "cat"],
  ["class-book", "Find the book.", "找到书。", "book"],
  ["class-pencil", "Find the pencil.", "找到铅笔。", "pencil"],
  ["class-clock", "Can you find the clock?", "你能找到时钟吗？", "clock"],
].map(([id, promptEn, promptZh, hotspotId]) => ({
  id,
  stageId: "classroom",
  type: "scene-hotspot",
  skill: "sceneComprehension",
  promptEn,
  promptZh,
  audioText: promptEn,
  sceneId: "classroom-main",
  hotspotId,
  enabledInModes: bothModes,
  maxAttempts: 2,
}));

const classroomCount: ChoiceQuestion = {
  id: "class-schoolbags",
  stageId: "classroom",
  type: "single-choice",
  skill: "sceneComprehension",
  promptEn: "How many schoolbags can you see?",
  promptZh: "你能看到几个书包？",
  audioText: "How many schoolbags can you see?",
  sceneId: "classroom-main",
  options: [
    { id: "one", label: "1", pronunciationWord: "one", alt: "one schoolbag", emoji: "1️⃣" },
    { id: "two", label: "2", pronunciationWord: "two", alt: "two schoolbags", emoji: "2️⃣" },
    { id: "three", label: "3", pronunciationWord: "three", alt: "three schoolbags", emoji: "3️⃣" },
  ],
  correctOptionId: "two",
  enabledInModes: bothModes,
  maxAttempts: 2,
};

const parkHotspots: SceneHotspotQuestion[] = [
  ["park-dog", "Find the dog.", "找到小狗。", "dog"],
  ["park-ball", "Where is the ball?", "球在哪里？", "ball"],
  ["park-fish", "Find the fish.", "找到小鱼。", "fish"],
  ["park-bike", "Who is riding a bike?", "谁正在骑自行车？", "boy-bike"],
  ["park-sun", "Can you find the sun?", "你能找到太阳吗？", "sun"],
].map(([id, promptEn, promptZh, hotspotId]) => ({
  id,
  stageId: "park",
  type: "scene-hotspot",
  skill: "sceneComprehension",
  promptEn,
  promptZh,
  audioText: promptEn,
  sceneId: "park-main",
  hotspotId,
  enabledInModes: bothModes,
  maxAttempts: 2,
}));

const parkChoices: ChoiceQuestion[] = [
  {
    id: "park-birds",
    stageId: "park",
    type: "single-choice",
    skill: "sceneComprehension",
    promptEn: "How many birds can you see?",
    promptZh: "你能看到几只鸟？",
    audioText: "How many birds can you see?",
    sceneId: "park-main",
    options: [
      { id: "one", label: "1", pronunciationWord: "one", emoji: "1️⃣", alt: "one bird" },
      { id: "two", label: "2", pronunciationWord: "two", emoji: "2️⃣", alt: "two birds" },
      { id: "three", label: "3", pronunciationWord: "three", emoji: "3️⃣", alt: "three birds" },
    ],
    correctOptionId: "two",
    enabledInModes: bothModes,
    maxAttempts: 2,
  },
  {
    id: "park-boy-doing",
    stageId: "park",
    type: "single-choice",
    skill: "sentenceComprehension",
    promptEn: "What is the boy doing?",
    promptZh: "男孩正在做什么？",
    audioText: "What is the boy doing?",
    sceneId: "park-main",
    options: [
      { id: "reading", label: "He is reading.", pronunciationWord: "reading", emoji: "📖", alt: "reading" },
      { id: "riding", label: "He is riding a bike.", pronunciationWord: "riding", emoji: "🚲", alt: "riding a bike" },
      { id: "sleeping", label: "He is sleeping.", pronunciationWord: "sleeping", emoji: "😴", alt: "sleeping" },
    ],
    correctOptionId: "riding",
    enabledInModes: bothModes,
    maxAttempts: 2,
  },
  {
    id: "park-fish-place",
    stageId: "park",
    type: "single-choice",
    skill: "sentenceComprehension",
    promptEn: "Where is the fish?",
    promptZh: "小鱼在哪里？",
    audioText: "Where is the fish?",
    sceneId: "park-main",
    options: [
      { id: "pond", label: "In the pond.", pronunciationWord: "pond", emoji: "💧", alt: "in the pond" },
      { id: "tree", label: "Under the tree.", pronunciationWord: "tree", emoji: "🌳", alt: "under the tree" },
      { id: "bench", label: "On the bench.", pronunciationWord: "bench", emoji: "🪑", alt: "on the bench" },
    ],
    correctOptionId: "pond",
    enabledInModes: bothModes,
    maxAttempts: 2,
  },
];

const readingWords = ["cat", "dog", "book", "ball", "tree", "apple", "rabbit", "teacher", "schoolbag"];
const readingQuestions: WordReadingQuestion[] = readingWords.map((word) => ({
  id: `read-${word}`,
  stageId: "reading",
  type: "word-reading-manual",
  skill: "wordRecognition",
  promptEn: word,
  promptZh: "试着读一读，再说说它的意思。",
  audioText: word,
  word,
  enabledInModes: teacherMode,
}));

const cvcWords = ["cat", "dog", "sun", "bed", "map", "pig", "hot", "sit"];
const pseudoWords = ["lat", "mip", "sog", "dap"];
const phonicsQuestions: PhonicsQuestion[] = [
  ...cvcWords.map((word) => ({
    id: `phonics-${word}`,
    stageId: "phonics",
    type: "phonics-manual" as const,
    skill: "phonics" as const,
    promptEn: word,
    promptZh: "听听每个字母音，再把它们连起来。",
    audioText: word,
    word,
    isPseudoWord: false,
    enabledInModes: teacherMode,
  })),
  ...pseudoWords.map((word) => ({
    id: `phonics-${word}`,
    stageId: "phonics",
    type: "phonics-manual" as const,
    skill: "phonics" as const,
    promptEn: word,
    promptZh: "这些是魔法单词，试着把它们读出来吧！",
    audioText: word,
    word,
    isPseudoWord: true,
    enabledInModes: teacherMode,
  })),
];

const sentenceQuestions: ChoiceQuestion[] = [
  {
    id: "sentence-red-ball",
    promptEn: "I have a red ball.",
    promptZh: "我有一个红色的球。",
    options: [
      { id: "red", emoji: "🔴", label: "red ball", pronunciationWord: "red", alt: "a red ball", accent: "#F87171" },
      { id: "blue", emoji: "🔵", label: "blue ball", pronunciationWord: "blue", alt: "a blue ball", accent: "#60A5FA" },
      { id: "yellow", emoji: "🟡", label: "yellow ball", pronunciationWord: "yellow", alt: "a yellow ball", accent: "#FACC15" },
    ],
    correctOptionId: "red",
  },
  {
    id: "sentence-cat-under",
    promptEn: "The cat is under the table.",
    promptZh: "猫在桌子下面。",
    options: [
      { id: "under", illustration: "cat-under-table" as const, label: "under", pronunciationWord: "under", alt: "cat under the table" },
      { id: "on", illustration: "cat-on-table" as const, label: "on", pronunciationWord: "on", alt: "cat on the table" },
      { id: "beside", illustration: "cat-beside-table" as const, label: "beside", pronunciationWord: "beside", alt: "cat beside the table" },
    ],
    correctOptionId: "under",
  },
  {
    id: "sentence-mother-teacher",
    promptEn: "My mother is a teacher.",
    promptZh: "我的妈妈是一名老师。",
    options: [
      { id: "teacher", emoji: "👩‍🏫", label: "mother + teacher", pronunciationWord: "teacher", alt: "mother is a teacher" },
      { id: "doctor", emoji: "👩‍⚕️", label: "mother + doctor", pronunciationWord: "doctor", alt: "mother is a doctor" },
      { id: "farmer", emoji: "👩‍🌾", label: "mother + farmer", pronunciationWord: "farmer", alt: "mother is a farmer" },
    ],
    correctOptionId: "teacher",
  },
  {
    id: "sentence-like-fruit",
    promptEn: "I like apples, but I don’t like bananas.",
    promptZh: "我喜欢苹果，但不喜欢香蕉。",
    options: [
      { id: "apple-yes", emoji: "🍎✅  🍌➖", label: "apple ✓", pronunciationWord: "apple", alt: "likes apples, not bananas" },
      { id: "banana-yes", emoji: "🍎➖  🍌✅", label: "banana ✓", pronunciationWord: "banana", alt: "likes bananas, not apples" },
      { id: "both", emoji: "🍎✅  🍌✅", label: "both", pronunciationWord: "both", alt: "likes both" },
    ],
    correctOptionId: "apple-yes",
  },
  {
    id: "sentence-school-item",
    promptEn: "I put my book in my schoolbag.",
    promptZh: "我把书放进书包里。",
    options: [
      { id: "bag", emoji: "📖 ➡️ 🎒", label: "In my schoolbag.", pronunciationWord: "schoolbag", alt: "book in the schoolbag" },
      { id: "tree", emoji: "📖\n🌳", label: "Under the tree.", pronunciationWord: "tree", alt: "book under the tree" },
      { id: "car", emoji: "📖 ➡️ 🚗", label: "In the car.", pronunciationWord: "car", alt: "book in the car" },
    ],
    correctOptionId: "bag",
  },
  {
    id: "sentence-dog-action",
    promptEn: "The little dog can run.",
    promptZh: "小狗会跑。",
    options: [
      { id: "run", emoji: "🐶💨", label: "The dog can run.", pronunciationWord: "run", alt: "dog can run" },
      { id: "read", emoji: "🐶📖", label: "The dog can read.", pronunciationWord: "read", alt: "dog can read" },
      { id: "sing", emoji: "🐶🎤", label: "The dog can sing.", pronunciationWord: "sing", alt: "dog can sing" },
    ],
    correctOptionId: "run",
  },
].map((question) => ({
  ...question,
  stageId: "sentence",
  type: "sentence-choice",
  skill: "sentenceComprehension",
  audioText: question.promptEn,
  enabledInModes: bothModes,
  maxAttempts: 2,
}));

export const questions: AssessmentQuestion[] = [
  ...oralQuestions,
  ...listeningQuestions,
  ...classroomHotspots,
  classroomCount,
  ...parkHotspots,
  ...parkChoices,
  ...readingQuestions,
  ...phonicsQuestions,
  ...sentenceQuestions,
];

export const questionById: Record<string, AssessmentQuestion> = Object.fromEntries(
  questions.map((question) => [question.id, question]),
);

export function getQuestionsForStage(stageId: string, mode: Mode) {
  return questions.filter(
    (question) => question.stageId === stageId && question.enabledInModes.includes(mode),
  );
}
