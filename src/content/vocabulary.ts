import type { AvatarDefinition, VocabularyAsset } from "@/features/assessment/types";

export const vocabulary: VocabularyAsset[] = [
  { id: "apple", word: "apple", zh: "苹果", emoji: "🍎", audioText: "apple", category: "food" },
  { id: "banana", word: "banana", zh: "香蕉", emoji: "🍌", audioText: "banana", category: "food" },
  { id: "cat", word: "cat", zh: "猫", emoji: "🐱", audioText: "cat", category: "animal" },
  { id: "dog", word: "dog", zh: "狗", emoji: "🐶", audioText: "dog", category: "animal" },
  { id: "bird", word: "bird", zh: "鸟", emoji: "🐦", audioText: "bird", category: "animal" },
  { id: "fish", word: "fish", zh: "鱼", emoji: "🐟", audioText: "fish", category: "animal" },
  { id: "book", word: "book", zh: "书", emoji: "📘", audioText: "book", category: "school" },
  { id: "pencil", word: "pencil", zh: "铅笔", emoji: "✏️", audioText: "pencil", category: "school" },
  { id: "schoolbag", word: "schoolbag", zh: "书包", emoji: "🎒", audioText: "schoolbag", category: "school" },
  { id: "ball", word: "ball", zh: "球", emoji: "⚽", audioText: "ball", category: "object" },
  { id: "car", word: "car", zh: "汽车", emoji: "🚗", audioText: "car", category: "object" },
  { id: "tree", word: "tree", zh: "树", emoji: "🌳", audioText: "tree", category: "nature" },
  { id: "sun", word: "sun", zh: "太阳", emoji: "☀️", audioText: "sun", category: "nature" },
  { id: "teacher", word: "teacher", zh: "老师", emoji: "🧑‍🏫", audioText: "teacher", category: "person" },
  { id: "mother", word: "mother", zh: "妈妈", emoji: "👩", audioText: "mother", category: "person" },
  { id: "rabbit", word: "rabbit", zh: "兔子", emoji: "🐰", audioText: "rabbit", category: "animal" },
];

export const vocabularyById = Object.fromEntries(vocabulary.map((item) => [item.id, item]));

export const avatars: AvatarDefinition[] = [
  { id: "dog", label: "小狗", emoji: "🐶", color: "#DFF3FF" },
  { id: "cat", label: "小猫", emoji: "🐱", color: "#FFD4E5" },
  { id: "robot", label: "小机器人", emoji: "🤖", color: "#E6E1FF" },
  { id: "rabbit", label: "小兔子", emoji: "🐰", color: "#CFF3C5" },
];
