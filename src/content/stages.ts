import type { Mode, StageDefinition } from "@/features/assessment/types";

export const stages: StageDefinition[] = [
  { id: "hello", order: 1, title: "Hello Gate", titleZh: "打招呼之门", description: "Say hello and warm up", icon: "👋", accent: "#FFD4E5", enabledInModes: ["teacher-led", "self-play"] },
  { id: "word-forest", order: 2, title: "Word Forest", titleZh: "单词森林", description: "Listen and find the picture", icon: "🌲", accent: "#CFF3C5", enabledInModes: ["teacher-led", "self-play"], shuffleQuestions: true },
  { id: "classroom", order: 3, title: "Classroom Hunt", titleZh: "教室寻宝", description: "Explore the classroom", icon: "🏫", accent: "#DFF3FF", enabledInModes: ["teacher-led", "self-play"] },
  { id: "park", order: 4, title: "Park Adventure", titleZh: "公园冒险", description: "Look, listen and discover", icon: "🚲", accent: "#FFF0B8", enabledInModes: ["teacher-led", "self-play"] },
  { id: "reading", order: 5, title: "Reading Magic", titleZh: "单词魔法", description: "Read the magic cards", icon: "📖", accent: "#E9DEFF", enabledInModes: ["teacher-led"] },
  { id: "phonics", order: 6, title: "Phonics Lab", titleZh: "拼读实验室", description: "Build words from sounds", icon: "🧪", accent: "#DFF3FF", enabledInModes: ["teacher-led"] },
  { id: "sentence", order: 7, title: "Sentence Bridge", titleZh: "句子小桥", description: "Connect words and meaning", icon: "🌉", accent: "#FFD4E5", enabledInModes: ["teacher-led", "self-play"], shuffleQuestions: true },
];

export const treasureStage: StageDefinition = {
  id: "treasure",
  order: 8,
  title: "Treasure Chest",
  titleZh: "冒险宝箱",
  description: "Adventure complete!",
  icon: "🎁",
  accent: "#FFD86B",
  enabledInModes: ["teacher-led", "self-play"],
};

export function getPlayableStages(mode: Mode) {
  return stages.filter((stage) => stage.enabledInModes.includes(mode));
}

export const stageById = Object.fromEntries(stages.map((stage) => [stage.id, stage]));
