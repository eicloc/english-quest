import type { GrammarStageDefinition } from "@/features/grammar/types";

export const grammarStages: GrammarStageDefinition[] = [
  { id: "pronouns", order: 1, title: "Pronoun Base", titleZh: "人称基地", description: "认识第一、第二、第三人称", icon: "🧑‍🚀", accent: "#DFF3FF" },
  { id: "be", order: 2, title: "Be Station", titleZh: "Be 动词站", description: "选对 am、is 和 are", icon: "🚉", accent: "#FFD4E5" },
  { id: "plurals", order: 3, title: "Plural House", titleZh: "名词变身屋", description: "让一个变成许多个", icon: "🏠", accent: "#CFF3C5" },
  { id: "demonstratives", order: 4, title: "Pointing Planet", titleZh: "指示词星球", description: "分清远近和单复数", icon: "🪐", accent: "#E9DEFF" },
  { id: "there-be", order: 5, title: "There Town", titleZh: "There 小镇", description: "看看那里有什么", icon: "🏘️", accent: "#FFF0B8" },
  { id: "have-has", order: 6, title: "Have Lab", titleZh: "Have/Has 实验室", description: "谁拥有、谁用 has", icon: "🔬", accent: "#DFF3FF" },
  { id: "verbs", order: 7, title: "Action Valley", titleZh: "动词行动谷", description: "挑战第三人称单数", icon: "🏃", accent: "#CFF3C5" },
  { id: "negatives", order: 8, title: "Negative Cave", titleZh: "否定句山洞", description: "学会说不和没有", icon: "🕯️", accent: "#E9DEFF" },
  { id: "questions", order: 9, title: "Question Castle", titleZh: "疑问句城堡", description: "把问题问清楚", icon: "🏰", accent: "#FFD4E5" },
  { id: "mixed", order: 10, title: "Galaxy Challenge", titleZh: "综合终极关", description: "把所有语法能量连起来", icon: "🌟", accent: "#FFD86B" },
];

export const grammarStageById = Object.fromEntries(grammarStages.map((stage) => [stage.id, stage]));
