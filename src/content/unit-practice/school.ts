import type { PracticeOral, PracticeQuest, PracticeSpelling, PracticeSentence } from "@/features/unit-practice/types";

function oral(id: string, stage: string, skill: "responding" | "initiating", instructionZh: string, examples: [string, string][], independentCriteria: string, teacherGuide: string, prompt?: [string, string, string]): PracticeOral {
  return { id, stage, skill, kind: "oral", instructionZh, examples: examples.map(([en, zh]) => ({ en, zh })), independentCriteria, teacherGuide,
    ...(prompt ? { speaker: prompt[0], promptEn: prompt[1], translationZh: prompt[2] } : { sceneZh: instructionZh }) };
}
function words(prefix: string, items: [string, string][]): PracticeSpelling[] {
  return items.map(([word, meaningZh]) => ({ id: `${prefix}-spell-${word}`, stage: `${prefix}-spelling`, kind: "spelling", skill: "spelling", word, meaningZh }));
}
function sentences(prefix: string, items: [string[], string][]): PracticeSentence[] {
  return items.map(([tokens, translationZh], i) => ({ id: `${prefix}-sort-${i + 1}`, stage: `${prefix}-sentence`, kind: "sentence", skill: "sentence", tokens, translationZh }));
}

export const morningQuest: PracticeQuest = {
  id: "morning", collection: "school", title: "Good morning!", translationZh: "第三部分 · 早上好！", emoji: "🌞",
  description: "早晨问好、邀请游戏、夸奖和感谢。教材第6—7页。",
  stages: [{ id: "morning-oral", title: "开口问早与感谢", emoji: "💬" }, { id: "morning-spelling", title: "中文拼词", emoji: "🔤" }, { id: "morning-sentence", title: "词卡排句子", emoji: "🧩" }],
  questions: [
    oral("morning-class", "morning-oral", "responding", "Miss Zhang 向大家问早，请回应老师。", [["Good morning, Miss Zhang!", "张老师，早上好！"], ["Good morning!", "早上好！"]], "听懂早晨问候，独立回应Good morning；可加老师称呼。", "教材第6页。教师扮Miss Zhang，读完后等待，不先领说答句。", ["Miss Zhang · 张老师", "Good morning, boys and girls!", "同学们，早上好！"]),
    oral("morning-friend", "morning-oral", "responding", "早晨在校门口遇见Jenny，和她接着说。", [["Good morning!", "早上好！"]], "能在朋友问早后自然回应Good morning。", "教材第7页看图练习。换人物、换场景后再观察孩子是否会回应。", ["Jenny · 詹妮", "Good morning!", "早上好！"]),
    oral("morning-start", "morning-oral", "initiating", "现在是早晨，你走进教室，请先向老师问早。", [["Good morning, Miss Zhang!", "张老师，早上好！"], ["Good morning!", "早上好！"]], "教师没有先开口时，主动使用早晨问候。", "教师先保持微笑，给孩子几秒思考。不要用英语句首提示来替代独立表达。"),
    oral("morning-thank", "morning-oral", "responding", "老师夸你完成得很好，你怎么回应？", [["Thank you!", "谢谢你！"], ["Thanks!", "谢谢！"]], "听到表扬，独立表示感谢；Thank you或Thanks都接受。", "教材第6页。可竖起拇指配合表扬，但不替孩子说谢谢。", ["Miss Zhang · 张老师", "Good job!", "干得好！"]),
    oral("morning-praise", "morning-oral", "initiating", "老师刚完成一幅画，请你主动用英语夸夸老师。", [["Good job!", "干得好！"]], "根据完成任务的情境，主动表达表扬。", "教师展示小画或假装完成任务，等孩子开口，再自然回应Thank you!（谢谢你！）。"),
    oral("morning-play", "morning-oral", "responding", "老师邀请你一起玩，你会怎么回应？", [["Hooray!", "好耶！"], ["OK!", "好呀！"]], "理解一起玩的邀请，独立作出合适的积极回应。", "教材第6页。Hooray为课本表达，也接受自然的OK。可配合准备加入游戏的动作。", ["Miss Zhang · 张老师", "Let’s play.", "一起玩吧。"]),
    ...words("morning", [["good", "好的"], ["morning", "早晨/上午"], ["boys", "男孩们"], ["and", "和"], ["girls", "女孩们"], ["play", "玩/游戏"], ["hooray", "好耶/万岁"], ["job", "工作/任务"], ["thank", "感谢"], ["you", "你/你们"]]),
    ...sentences("morning", [[["Good", "morning!"], "早上好！"], [["Good", "job!"], "干得好！"], [["Thank", "you!"], "谢谢你！"], [["Let’s", "play."], "一起玩吧。"]]),
  ],
};

export const meetQuest: PracticeQuest = {
  id: "meet", collection: "school", title: "Nice to meet you.", translationZh: "第四部分 · 很高兴认识你。", emoji: "🤝",
  description: "介绍自己、认识新朋友，并用too礼貌回应。教材第8—9页。",
  stages: [{ id: "meet-oral", title: "认识新朋友", emoji: "💬" }, { id: "meet-spelling", title: "中文拼词", emoji: "🔤" }, { id: "meet-sentence", title: "词卡排句子", emoji: "🧩" }],
  questions: [
    oral("meet-guoyang", "meet-oral", "responding", "郭阳在介绍自己，请告诉他你的名字并礼貌回应。", [["I’m {name}. Nice to meet you, too.", "我叫{name}。我也很高兴认识你。"], ["My name is {name}. Nice to meet you, too.", "我叫{name}。我也很高兴认识你。"]], "独立介绍自己的名字，并用带too的句子回应；可分轮完成。", "教材第8页Guo Yang先说，Jenny回应。允许使用孩子自己的中文名字。", ["Guo Yang · 郭阳", "My name is Guo Yang. Nice to meet you.", "我叫郭阳。很高兴认识你。"]),
    oral("meet-answer", "meet-oral", "responding", "Danny 说很高兴认识你，你也这样想，该怎么接话？", [["Nice to meet you, too.", "我也很高兴认识你。"]], "独立回应Nice to meet you, too，表达“我也一样”。", "教材第8—9页。本题重点观察too；需要提示“我也”后完成，记1分。不要求逐音完美。", ["Danny · 丹尼", "Nice to meet you.", "很高兴认识你。"]),
    oral("meet-start", "meet-oral", "initiating", "第一次见到新朋友，请主动介绍自己，并告诉对方你很高兴认识他。", [["Hello! I’m {name}. Nice to meet you.", "你好！我叫{name}。很高兴认识你。"]], "主动介绍自己的名字并表达很高兴认识对方；可以分小句说。", "教师先等待，等孩子表达后回应Nice to meet you, too.（我也很高兴认识你）。"),
    oral("meet-jenny", "meet-oral", "responding", "Jenny 想知道你的名字，回答后再说很高兴认识她。", [["My name is {name}. Nice to meet you.", "我叫{name}。很高兴认识你。"], ["I’m {name}. Nice to meet you.", "我叫{name}。很高兴认识你。"]], "听懂名字问题，介绍自己并主动补上初次见面的礼貌表达。", "教材第8页Jenny的台词。这里是先听到姓名问题，因此说Nice to meet you即可，不必机械加too。", ["Jenny · 詹妮", "Hi! I’m Jenny. What’s your name?", "嗨！我叫詹妮。你叫什么名字？"]),
    oral("meet-role", "meet-oral", "responding", "老师扮Panpan，你扮另一位新朋友。请介绍自己，再回应Panpan。", [["Hi! I’m {name}. Nice to meet you, too.", "嗨！我叫{name}。我也很高兴认识你。"]], "换角色后仍会介绍自己并礼貌回应。", "教材第9页角色表演。孩子可扮Sun Wukong，也可用自己的名字。角色姓名不考拼写。", ["Panpan · 盼盼", "Hello! I’m Panpan. Nice to meet you.", "你好！我叫盼盼。很高兴认识你。"]),
    oral("meet-dialogue", "meet-oral", "initiating", "小剧场：请你先问名字，再和老师互相介绍、说很高兴认识你。两人可以轮流接话。", [["Hello! What’s your name?", "你好！你叫什么名字？"], ["My name is {name}. Nice to meet you.", "我叫{name}。很高兴认识你。"], ["Nice to meet you, too.", "我也很高兴认识你。"]], "独立发起姓名问题，并在角色互换中使用Nice to meet you及带too的回应。", "先由孩子问，教师答姓名；孩子介绍并说Nice to meet you，教师回应。再交换先后，让孩子说带too的回应。允许按回合完成。"),
    ...words("meet", [["nice", "好的/令人愉快的"], ["to", "向/到"], ["meet", "遇见/认识"], ["you", "你/你们"], ["too", "也"], ["my", "我的"], ["name", "名字"], ["is", "是"]]),
    ...sentences("meet", [[["Nice", "to", "meet", "you."], "很高兴认识你。"], [["Nice", "to", "meet", "you,", "too."], "我也很高兴认识你。"], [["My", "name", "is", "Guo Yang."], "我叫郭阳。"], [["Hi!", "I’m", "Jenny."], "嗨！我叫詹妮。"]]),
  ],
};
