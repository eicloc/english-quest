import type { GreetingOralQuestion, GreetingQuestion, GreetingSkill, GreetingStage, GreetingSpellingQuestion } from "@/features/greetings/types";

export const greetingStages: { id: GreetingStage; title: string; subtitle: string; emoji: string }[] = [
  { id: "hello-oral", title: "Hello! · 开口交朋友", subtitle: "你好！· 问候和名字", emoji: "👋" },
  { id: "hello-spelling", title: "Hello! · 字母拼词", subtitle: "你好！· 拼出6个单词", emoji: "🧩" },
  { id: "how-oral", title: "How are you? · 问好与道别", subtitle: "你好吗？· 关心朋友", emoji: "💬" },
  { id: "how-spelling", title: "How are you? · 字母拼词", subtitle: "你好吗？· 拼出8个单词", emoji: "🔤" },
];

export const greetingSkillLabels: Record<GreetingSkill, string> = {
  responding: "回应交流",
  initiating: "主动提问与问候",
  "hello-spelling": "Hello! 拼词",
  "how-spelling": "How are you? 拼词",
};

const helloOral: GreetingOralQuestion[] = [
  {
    id: "hello-hi", part: "hello", stage: "hello-oral", skill: "responding", kind: "oral",
    instructionZh: "Jenny 在向你问好，你会怎么回应？", speaker: "Jenny · 詹妮", promptEn: "Hi!", translationZh: "嗨！你好！",
    examples: [{ en: "Hi!", zh: "你好！" }, { en: "Hello!", zh: "你好！" }],
    teacherGuide: "面向孩子挥手，读出Jenny的台词后等待。两种问候都接受，不要求逐字模仿。",
    independentCriteria: "无需领说，能用Hi或Hello回应。",
  },
  {
    id: "hello-hello", part: "hello", stage: "hello-oral", skill: "responding", kind: "oral",
    instructionZh: "Li Ming 来了，接着和他说一句吧。", speaker: "Li Ming · 李明", promptEn: "Hello!", translationZh: "你好！",
    examples: [{ en: "Hello!", zh: "你好！" }, { en: "Hi!", zh: "你好！" }],
    teacherGuide: "换一个人物再次问候，观察孩子能否迁移，而非只记住上一题的声音。",
    independentCriteria: "听到Hello后，独立作出合适的问候。",
  },
  {
    id: "hello-jenny-introduction", part: "hello", stage: "hello-oral", skill: "responding", kind: "oral",
    instructionZh: "先回应Jenny的问好，再告诉她你的名字。", speaker: "Jenny · 詹妮", promptEn: "Hi! I am Jenny.", translationZh: "你好！我叫詹妮。",
    examples: [{ en: "Hi! I’m {name}.", zh: "你好！我叫{name}。" }, { en: "Hello! My name is {name}.", zh: "你好！我叫{name}。" }],
    teacherGuide: "让孩子说自己的名字，中文名也可以。I am、I’m和My name is均接受。不要让孩子把Jenny的名字当作自己的名字照读。",
    independentCriteria: "能回应问候，并用自己的名字介绍自己；可分两小句说。",
  },
  {
    id: "hello-answer-name", part: "hello", stage: "hello-oral", skill: "responding", kind: "oral",
    instructionZh: "Danny 想认识你，请告诉他你的名字。", speaker: "Danny · 丹尼", promptEn: "What’s your name?", translationZh: "你叫什么名字？",
    examples: [{ en: "My name is {name}.", zh: "我叫{name}。" }, { en: "I’m {name}.", zh: "我叫{name}。" }],
    teacherGuide: "接受孩子自己的中文名字，不额外要求英文名。自然且完整的介绍均可。",
    independentCriteria: "听懂姓名问题，用My name is或I’m加自己的名字回答。",
  },
  {
    id: "hello-start-conversation", part: "hello", stage: "hello-oral", skill: "initiating", kind: "oral",
    instructionZh: "这次由你先开口。", sceneZh: "第一次见到新朋友，请主动问好，再介绍自己。",
    examples: [{ en: "Hello! I’m {name}.", zh: "你好！我叫{name}。" }, { en: "Hi! My name is {name}.", zh: "你好！我叫{name}。" }],
    teacherGuide: "教师先保持微笑，不先说Hello。给孩子几秒思考；孩子开口后再自然回应。",
    independentCriteria: "没有教师先领说，主动问好并介绍自己的名字。",
  },
  {
    id: "hello-ask-name", part: "hello", stage: "hello-oral", skill: "initiating", kind: "oral",
    instructionZh: "你想知道朋友的名字，该怎么问？", sceneZh: "Jenny 走到你面前。请用英语问问她叫什么名字。",
    examples: [{ en: "What’s your name?", zh: "你叫什么名字？" }],
    teacherGuide: "等孩子自己问。之后教师扮Jenny回答“My name is Jenny.”（我叫詹妮）。句子可分小段，但不要求拼读。",
    independentCriteria: "能主动说出What’s your name?，让对方知道是在问姓名。",
  },
];

const howOral: GreetingOralQuestion[] = [
  {
    id: "how-answer", part: "how-are-you", stage: "how-oral", skill: "responding", kind: "oral",
    instructionZh: "Jenny 在关心你，请回答她。", speaker: "Jenny · 詹妮", promptEn: "How are you?", translationZh: "你好吗？",
    examples: [{ en: "I’m fine, thanks.", zh: "我很好，谢谢。" }, { en: "Fine, thanks.", zh: "很好，谢谢。" }],
    teacherGuide: "听懂问候并自然回答即可。若只说I’m fine，可提示表达感谢，再记录提示后完成。",
    independentCriteria: "独立表达自己很好，并说thanks；接受Fine, thanks。",
  },
  {
    id: "how-returned-question", part: "how-are-you", stage: "how-oral", skill: "responding", kind: "oral",
    instructionZh: "Jenny 回答后也问了你，你会接哪一句？", speaker: "Jenny · 詹妮", promptEn: "I’m fine. How are you?", translationZh: "我很好。你呢？",
    examples: [{ en: "I’m fine, thanks.", zh: "我很好，谢谢。" }, { en: "Fine, thanks.", zh: "很好，谢谢。" }],
    teacherGuide: "本题承接教材的相互问候，观察孩子是否听出后半句是在问自己。无需再重复整段对话。",
    independentCriteria: "能接住对方的反问，回答自己的状态并表示感谢。",
  },
  {
    id: "how-ask-friend", part: "how-are-you", stage: "how-oral", skill: "initiating", kind: "oral",
    instructionZh: "这次请你先关心朋友。", sceneZh: "见到一位老朋友，请主动用英语问问他好不好。",
    examples: [{ en: "How are you?", zh: "你好吗？" }, { en: "Hi! How are you?", zh: "你好！你好吗？" }],
    teacherGuide: "不要先给How开头。孩子问后，教师自然回答“I’m fine, thanks.”（我很好，谢谢）。",
    independentCriteria: "主动用How are you询问对方，可先加Hi或Hello。",
  },
  {
    id: "how-answer-and-ask", part: "how-are-you", stage: "how-oral", skill: "initiating", kind: "oral",
    instructionZh: "先回答，再关心一下Li Ming。", speaker: "Li Ming · 李明", promptEn: "Hi! How are you?", translationZh: "你好！你好吗？",
    examples: [{ en: "I’m fine. How are you?", zh: "我很好。你呢？" }, { en: "I’m fine, thanks. How are you?", zh: "我很好，谢谢。你呢？" }],
    teacherGuide: "允许先答I’m fine，再说How are you，两轮完成也可以。教师最后回应“I’m fine, thanks.”（我很好，谢谢）。",
    independentCriteria: "回答自己的状态后，独立把How are you问回给对方。",
  },
  {
    id: "how-answer-goodbye", part: "how-are-you", stage: "how-oral", skill: "responding", kind: "oral",
    instructionZh: "Danny 要离开了，你怎么回应？", speaker: "Danny · 丹尼", promptEn: "Goodbye!", translationZh: "再见！",
    examples: [{ en: "Bye!", zh: "再见！" }, { en: "Goodbye!", zh: "再见！" }, { en: "See you later!", zh: "回头见！" }],
    teacherGuide: "三种道别均接受，不要求一次全说。孩子可以配合挥手。",
    independentCriteria: "听到道别，独立使用一种合适的道别语回应。",
  },
  {
    id: "how-start-goodbye", part: "how-are-you", stage: "how-oral", skill: "initiating", kind: "oral",
    instructionZh: "离开前，请你先说一句。", sceneZh: "你准备回家了。请主动和朋友用英语道别。",
    examples: [{ en: "Goodbye!", zh: "再见！" }, { en: "Bye!", zh: "再见！" }, { en: "Bye. See you later!", zh: "再见。回头见！" }],
    teacherGuide: "教师不先挥手领说，等待孩子主动道别；接受See you later单独使用。",
    independentCriteria: "根据离开情境主动道别，使用其中一种表达即可。",
  },
];

function spelling(part: GreetingSpellingQuestion["part"], words: [string, string][]): GreetingSpellingQuestion[] {
  return words.map(([word, meaningZh]) => ({ id: `spell-${word}`, kind: "spelling", part, stage: part === "hello" ? "hello-spelling" : "how-spelling", skill: part === "hello" ? "hello-spelling" : "how-spelling", word, meaningZh }));
}

export const greetingQuestions: GreetingQuestion[] = [
  ...helloOral,
  ...spelling("hello", [["hi", "嗨/你好"], ["hello", "你好"], ["name", "名字"], ["what", "什么"], ["your", "你的"], ["my", "我的"]]),
  ...howOral,
  ...spelling("how-are-you", [["fine", "好的/健康的"], ["goodbye", "再见"], ["bye", "再见"], ["how", "怎样/如何"], ["you", "你"], ["thanks", "谢谢"], ["see", "见到/看见"], ["later", "稍后/以后"]]),
];

export const greetingQuestionById = Object.fromEntries(greetingQuestions.map((question) => [question.id, question]));
export const personalizeGreeting = (text: string, name: string) => text.replaceAll("{name}", name);
