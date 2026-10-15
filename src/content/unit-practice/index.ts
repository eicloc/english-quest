import { morningQuest, meetQuest } from "./school";
import { reviewQuest } from "./review";
import type { PracticeCollection, PracticeQuest, PracticeQuestId, PracticeSkill } from "@/features/unit-practice/types";

export const practiceQuests: Record<PracticeQuestId, PracticeQuest> = { morning: morningQuest, meet: meetQuest, review: reviewQuest };
export const practiceSkills: Record<PracticeSkill, string> = { responding: "回应交流", initiating: "主动表达", spelling: "字母拼词", sentence: "句子排序" };
export const practiceCollections: Record<PracticeCollection, { title: string; description: string; route: string; storageKey: string; quests: PracticeQuestId[]; backRoute: string; backLabel: string }> = {
  school: { title: "校园礼貌岛", description: "第三、四部分各自闯关，问早、感谢、认识新朋友。", route: "/school-friends", storageKey: "english-school-friends-quest:v1", quests: ["morning", "meet"], backRoute: "/", backLabel: "选择板块" },
  review: { title: "问候交朋友 · 复习挑战", description: "第一、二部分进阶复习：换角色、主动反问、完整对话和两句排序。", route: "/greetings/review", storageKey: "english-greetings-review:v1", quests: ["review"], backRoute: "/greetings/", backLabel: "基础挑战入口" },
};
