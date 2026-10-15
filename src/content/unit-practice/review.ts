import { greetingQuestions } from "@/content/greetings/questions";
import type { PracticeOral, PracticeQuest, PracticeSentence, PracticeSpelling } from "@/features/unit-practice/types";

function oral(id: string, part: "hello" | "how", skill: "responding" | "initiating", instructionZh: string, examples: [string, string][], independentCriteria: string, prompt?: [string, string, string], guide?: string): PracticeOral {
  return { id: `review-${id}`, kind: "oral", stage: `review-${part}-oral`, skill, instructionZh,
    examples: examples.map(([en, zh]) => ({ en, zh })), independentCriteria,
    teacherGuide: guide ?? "复习挑战：先给孩子几秒独立思考，允许分轮说，中文名字也可以。需要句首、示范或动作提示后完成记1分。",
    ...(prompt ? { speaker: prompt[0], promptEn: prompt[1], translationZh: prompt[2] } : { sceneZh: instructionZh }) };
}
function words(part: "hello" | "how"): PracticeSpelling[] {
  return greetingQuestions.filter((q) => q.kind === "spelling" && q.part === (part === "hello" ? "hello" : "how-are-you")).map((q) => {
    if (q.kind !== "spelling") throw new Error("Expected spelling question");
    return { id: `review-${q.id}`, kind: "spelling", stage: `review-${part}-spelling`, skill: "spelling", word: q.word, meaningZh: q.meaningZh };
  });
}
function sentences(part: "hello" | "how", rows: [string[], string][]): PracticeSentence[] {
  return rows.map(([tokens, translationZh], i) => ({ id: `review-${part}-sort-${i + 1}`, stage: `review-${part}-sentence`, kind: "sentence", skill: "sentence", tokens, translationZh }));
}

export const reviewQuest: PracticeQuest = {
  id: "review", collection: "review", title: "Hello! & How are you?", translationZh: "第一、二部分 · 进阶复习", emoji: "🧭",
  description: "换角色、主动反问、完整短对话，再挑战两句相连的排序。只复习教材第2—5页。",
  stages: [
    { id: "review-hello-oral", title: "Hello! · 介绍与反问", emoji: "💬" },
    { id: "review-hello-spelling", title: "Hello! · 中文拼词", emoji: "🔤" },
    { id: "review-hello-sentence", title: "Hello! · 词卡排句子", emoji: "🧩" },
    { id: "review-how-oral", title: "How are you? · 问候小剧场", emoji: "💬" },
    { id: "review-how-spelling", title: "How are you? · 中文拼词", emoji: "🔤" },
    { id: "review-how-sentence", title: "How are you? · 词卡排句子", emoji: "🧩" },
  ],
  questions: [
    oral("intro-jenny", "hello", "responding", "先回应Jenny的问好，再用自己的名字作完整介绍。", [["Hi! I’m {name}.", "嗨！我叫{name}。"], ["Hello! My name is {name}.", "你好！我叫{name}。"]], "独立问好并介绍自己，不把Jenny的名字当成自己的名字。", ["Jenny · 詹妮", "Hi! I am Jenny.", "嗨！我叫詹妮。"]),
    oral("answer-danny", "hello", "responding", "Danny 一口气说了两句，请先问好，再回答名字。", [["Hello! My name is {name}.", "你好！我叫{name}。"]], "从较长台词中听出名字问题，并完整回应。", ["Danny · 丹尼", "Hello! I’m Danny. What’s your name?", "你好！我叫丹尼。你叫什么名字？"]),
    oral("start-name", "hello", "initiating", "新朋友第一次来到你家。请主动问好、介绍自己，再问他的名字。", [["Hi! I’m {name}. What’s your name?", "嗨！我叫{name}。你叫什么名字？"]], "主动完成问候、自我介绍和姓名提问三个步骤；允许分句。"),
    oral("ask-back", "hello", "responding", "先回答新朋友的名字问题，再把同一个问题问回去。", [["My name is {name}. What’s your name?", "我叫{name}。你叫什么名字？"]], "介绍自己后能反问名字，而非只停在回答。", ["新朋友", "What’s your name?", "你叫什么名字？"]),
    oral("role-danny", "hello", "responding", "换角色：这次你扮Danny，老师扮Jenny。请问好并介绍角色的名字。", [["Hello! I’m Danny.", "你好！我叫丹尼。"], ["Hi! My name is Danny.", "嗨！我叫丹尼。"]], "能区分自己的名字和角色名字，按角色介绍Danny。", ["Jenny · 詹妮", "Hi! I’m Jenny.", "嗨！我叫詹妮。"], "先用中文确认孩子选的是Danny；如不想扮角色，可改用自己名字，但说明后再开始。角色名不考拼写。"),
    oral("puppet-interview", "hello", "initiating", "你当小采访员，先问候玩偶，再问名字；听完回答后介绍自己。", [["Hello! What’s your name?", "你好！你叫什么名字？"], ["My name is {name}.", "我叫{name}。"]], "孩子主动开始，和教师完成至少三个轮次，不需要逐句领说。", undefined, "孩子问候并提问后，教师替玩偶回答My name is Li Ming.（我叫李明），再等孩子介绍自己。"),
    oral("full-name", "hello", "responding", "Li Ming 用另一种说法介绍了名字。请问好，并用自己的名字回应。", [["Hi! My name is {name}.", "嗨！我叫{name}。"], ["Hello! I’m {name}.", "你好！我叫{name}。"]], "能理解My name is的介绍，并选择自然的自我介绍回应。", ["Li Ming · 李明", "Hello! My name is Li Ming.", "你好！我叫李明。"]),
    oral("name-scene", "hello", "initiating", "请导演一次新朋友见面：你先开口，和老师互问姓名，再交换谁先问。", [["Hello! I’m {name}. What’s your name?", "你好！我叫{name}。你叫什么名字？"], ["My name is {name}.", "我叫{name}。"]], "孩子在问者和答者之间换角色，各独立完成一次姓名交流。"),
    ...words("hello"),
    ...sentences("hello", [
      [["Hello!", "I’m", "Jenny."], "你好！我叫詹妮。"],
      [["I", "am", "Li Ming."], "我叫李明。"],
      [["Hi!", "My", "name", "is", "Danny."], "嗨！我叫丹尼。"],
      [["What’s", "your", "name?"], "你叫什么名字？"],
      [["Hello!", "I’m", "Li Ming.", "What’s", "your", "name?"], "你好！我叫李明。你叫什么名字？"],
    ]),
    oral("how-ask-back", "how", "responding", "先回应问候、回答自己很好，再关心一下Jenny。", [["Hi! I’m fine, thanks. How are you?", "嗨！我很好，谢谢。你呢？"]], "问好、回答并反问都能独立完成，允许分轮说。", ["Jenny · 詹妮", "Hi! How are you?", "嗨！你好吗？"]),
    oral("how-listen", "how", "responding", "朋友回答后也问了你。听完整句，再说自己的情况。", [["I’m fine, thanks.", "我很好，谢谢。"]], "听出后半句是对自己的问题，不机械复述整段。", ["Danny · 丹尼", "I’m fine. How are you?", "我很好。你呢？"]),
    oral("how-start", "how", "initiating", "见到老朋友，请主动打招呼，再问问他好不好。", [["Hello! How are you?", "你好！你好吗？"]], "主动把问候和How are you连起来说。"),
    oral("how-long", "how", "responding", "朋友先介绍了自己，再问你好不好。请问好、回答，并把问题问回去。", [["Hi! I’m fine, thanks. How are you?", "嗨！我很好，谢谢。你呢？"]], "从较长台词中理解问候，完成回答和反问；可选择补充自己名字。", ["Li Ming · 李明", "Hello! I’m Li Ming. How are you?", "你好！我叫李明。你好吗？"]),
    oral("bye-respond", "how", "responding", "Danny 道别了。请回应再见，再加一句“回头见”。", [["Bye. See you later!", "再见。回头见！"], ["Goodbye! See you later!", "再见！回头见！"]], "独立说出道别并补上See you later。", ["Danny · 丹尼", "Goodbye!", "再见！"]),
    oral("bye-start", "how", "initiating", "你准备离开，请先向朋友道别，再说回头见。", [["Bye. See you later!", "再见。回头见！"]], "根据离开情境主动说出两句道别语。"),
    oral("name-and-how", "how", "responding", "新朋友问你的名字。请回答，再主动问问对方好不好。", [["My name is {name}. How are you?", "我叫{name}。你好吗？"]], "把姓名回答和主动关心连接起来，区分What’s your name与How are you。", ["新朋友", "Hi! What’s your name?", "嗨！你叫什么名字？"]),
    oral("complete-scene", "how", "initiating", "完整小剧场：你先问好，与老师互问姓名和近况，最后主动道别。一步一步轮流说即可。", [["Hello! I’m {name}. What’s your name?", "你好！我叫{name}。你叫什么名字？"], ["How are you?", "你好吗？"], ["I’m fine, thanks.", "我很好，谢谢。"], ["Bye. See you later!", "再见。回头见！"]], "在多个轮次中独立选用问候、姓名、近况和道别，不要求一口气背整段。", undefined, "教师按孩子的问题自然接话，不抢先给下一句。允许孩子用自己的名字，只在卡住时给提示并按提示后完成评分。"),
    ...words("how"),
    ...sentences("how", [
      [["Hi!", "How", "are", "you?"], "嗨！你好吗？"],
      [["I’m", "fine,", "thanks."], "我很好，谢谢。"],
      [["I’m", "fine.", "How", "are", "you?"], "我很好。你呢？"],
      [["Bye.", "See", "you", "later!"], "再见。回头见！"],
      [["I’m", "fine,", "thanks.", "How", "are", "you?"], "我很好，谢谢。你呢？"],
    ]),
  ],
};
