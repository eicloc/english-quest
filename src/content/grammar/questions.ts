import type {
  GrammarCategoryQuestion,
  GrammarChoiceQuestion,
  GrammarDifficulty,
  GrammarMatchQuestion,
  GrammarQuestion,
  GrammarQuestionVisual,
  GrammarSkill,
  GrammarSortQuestion,
} from "@/features/grammar/types";

type CommonInput = {
  stageId: string;
  id: string;
  skill: GrammarSkill;
  ruleGroup: string;
  difficulty: GrammarDifficulty;
  promptZh: string;
  hintZh: string;
  explanationZh: string;
};

function coverageGroup(stageId: string, ruleGroup: string) {
  const groups: Record<string, Record<string, string>> = {
    pronouns: { person: "person", gender: "gender", replacement: "replacement", number: "number", sentence: "sentence" },
    be: { am: "am", is: "is", are: "are", noun: "agreement", agreement: "agreement", contraction: "contraction", sentence: "sentence" },
    plurals: { s: "s", es: "es", ies: "ies", forms: "regular", irregular: "irregular", same: "same", article: "article", number: "use", sentence: "use" },
    demonstratives: { near: "near", far: "far", distance: "distance", agreement: "agreement", number: "number", sentence: "sentence" },
    "there-be": { affirmative: "affirmative", agreement: "affirmative", negative: "negative", question: "question", answer: "question", sentence: "use" },
    "have-has": { have: "have", has: "has", noun: "agreement", agreement: "agreement", sentence: "sentence" },
    verbs: { base: "base", s: "s", es: "es", ies: "ies", forms: "forms", agreement: "agreement", sentence: "sentence" },
    negatives: { be: "be", do: "do", does: "does", "base-after-do": "base", agreement: "agreement", structure: "structure", sentence: "sentence" },
    questions: { be: "be", do: "do", does: "does", answer: "answer", order: "order", structure: "order", agreement: "agreement" },
    mixed: { demonstratives: "demonstratives", distance: "demonstratives", "there-be": "there-be", agreement: "agreement", plural: "agreement", number: "agreement", negative: "negatives", question: "questions", sentence: "questions", review: "review" },
  };
  return groups[stageId]?.[ruleGroup] ?? ruleGroup;
}

function choice(input: CommonInput & { stem: string; options: string[]; correctAnswer: string }): GrammarChoiceQuestion {
  const sentence = input.stem.replace("___", input.correctAnswer);
  return { ...input, coverageGroup: coverageGroup(input.stageId, input.ruleGroup), type: "choice-gap", promptEn: "Choose the best answer.", audioText: sentence, stem: input.stem, options: input.options, correctAnswer: input.correctAnswer };
}

function sort(input: CommonInput & { tokens: string[]; correctOrder: string[] }): GrammarSortQuestion {
  return { ...input, coverageGroup: coverageGroup(input.stageId, input.ruleGroup), type: "sentence-sort", promptEn: "Build the sentence.", audioText: input.correctOrder.join(" "), tokens: input.tokens, correctOrder: input.correctOrder };
}

function match(input: CommonInput & { left: string[]; right: string[]; pairs: number[] }): GrammarMatchQuestion {
  const leftItems = input.left.map((label, index) => ({ id: `left-${index}`, label }));
  const rightItems = input.right.map((label, index) => ({ id: `right-${index}`, label }));
  return {
    ...input,
    coverageGroup: coverageGroup(input.stageId, input.ruleGroup),
    type: "pair-match",
    promptEn: "Match the pairs.",
    leftItems,
    rightItems,
    correctPairs: Object.fromEntries(input.pairs.map((rightIndex, leftIndex) => [`left-${leftIndex}`, `right-${rightIndex}`])),
  };
}

function categorize(input: CommonInput & { categoryLabels: string[]; itemLabels: string[]; answers: number[] }): GrammarCategoryQuestion {
  const categories = input.categoryLabels.map((label, index) => ({ id: `category-${index}`, label }));
  const items = input.itemLabels.map((label, index) => ({ id: `item-${index}`, label }));
  return {
    ...input,
    coverageGroup: coverageGroup(input.stageId, input.ruleGroup),
    type: "category-sort",
    promptEn: "Put each card in the right group.",
    categories,
    items,
    correctCategories: Object.fromEntries(input.answers.map((categoryIndex, itemIndex) => [`item-${itemIndex}`, `category-${categoryIndex}`])),
  };
}

const pronounQuestions: GrammarQuestion[] = [
  choice({ stageId: "pronouns", id: "pronoun-i", skill: "pronouns", ruleGroup: "person", difficulty: 1, stem: "___ am eight years old.", options: ["I", "He", "They"], correctAnswer: "I", promptZh: "选择表示“我”的人称代词。", hintZh: "说话的人介绍自己时，用哪个词？", explanationZh: "I 表示“我”，属于第一人称单数。" }),
  choice({ stageId: "pronouns", id: "pronoun-you", skill: "pronouns", ruleGroup: "person", difficulty: 1, stem: "___ are my friend.", options: ["You", "She", "It"], correctAnswer: "You", promptZh: "选择表示“你”的人称代词。", hintZh: "正在和对方说话时，要用第二人称。", explanationZh: "You 表示“你/你们”，属于第二人称。" }),
  choice({ stageId: "pronouns", id: "pronoun-he", skill: "pronouns", ruleGroup: "gender", difficulty: 1, stem: "Tom is my brother. ___ is seven.", options: ["He", "She", "We"], correctAnswer: "He", promptZh: "用正确代词替代 Tom。", hintZh: "Tom 是一个男孩。", explanationZh: "He 用来指代一位男性，属于第三人称单数。" }),
  choice({ stageId: "pronouns", id: "pronoun-she", skill: "pronouns", ruleGroup: "gender", difficulty: 1, stem: "Amy is my sister. ___ is six.", options: ["She", "He", "They"], correctAnswer: "She", promptZh: "用正确代词替代 Amy。", hintZh: "Amy 是一个女孩。", explanationZh: "She 用来指代一位女性，属于第三人称单数。" }),
  choice({ stageId: "pronouns", id: "pronoun-it", skill: "pronouns", ruleGroup: "number", difficulty: 2, stem: "This is my cat. ___ is white.", options: ["It", "They", "We"], correctAnswer: "It", promptZh: "用正确代词替代一只猫。", hintZh: "只有一只动物。", explanationZh: "It 常用来指一个动物或物品，属于第三人称单数。" }),
  choice({ stageId: "pronouns", id: "pronoun-we", skill: "pronouns", ruleGroup: "number", difficulty: 2, stem: "Mia and I are friends. ___ play together.", options: ["We", "They", "You"], correctAnswer: "We", promptZh: "“Mia 和我”应该用哪个代词？", hintZh: "这个小组里包含说话的人“我”。", explanationZh: "We 表示“我们”，包含说话者，是第一人称复数。" }),
  choice({ stageId: "pronouns", id: "pronoun-they", skill: "pronouns", ruleGroup: "number", difficulty: 2, stem: "Ben and Leo are brothers. ___ like football.", options: ["They", "He", "We"], correctAnswer: "They", promptZh: "用正确代词替代 Ben 和 Leo。", hintZh: "说的是两个人，而且不包含“我”。", explanationZh: "They 表示“他们/她们/它们”，属于第三人称复数。" }),
  choice({ stageId: "pronouns", id: "pronoun-dogs", skill: "pronouns", ruleGroup: "replacement", difficulty: 3, stem: "The dogs are small. ___ are brown.", options: ["They", "It", "He"], correctAnswer: "They", promptZh: "用正确代词替代多只狗。", hintZh: "dogs 是复数。", explanationZh: "复数的人、动物或物品都可以用 they 指代。" }),
  sort({ stageId: "pronouns", id: "pronoun-sort-we", skill: "pronouns", ruleGroup: "sentence", difficulty: 2, tokens: ["friends.", "are", "We"], correctOrder: ["We", "are", "friends."], promptZh: "排列成“我们是朋友”。", hintZh: "句子以表示“我们”的词开头。", explanationZh: "We 是第一人称复数，放在句首作主语。" }),
  sort({ stageId: "pronouns", id: "pronoun-sort-they", skill: "pronouns", ruleGroup: "sentence", difficulty: 3, tokens: ["teachers.", "They", "are"], correctOrder: ["They", "are", "teachers."], promptZh: "排列成“他们是老师”。", hintZh: "先放主语 They，再放 are。", explanationZh: "英语陈述句通常按“主语 + 动词 + 其他”排列。" }),
  match({ stageId: "pronouns", id: "pronoun-match-person", skill: "pronouns", ruleGroup: "person", difficulty: 2, left: ["I / we", "you", "he / she / it", "they"], right: ["第一人称", "第二人称", "第三人称单数", "第三人称复数"], pairs: [0, 1, 2, 3], promptZh: "把代词和人称配对。", hintZh: "第一人称包含说话者，第二人称指听话者。", explanationZh: "I/we 是第一人称，you 是第二人称，其余这些代词属于第三人称。" }),
  match({ stageId: "pronouns", id: "pronoun-match-number", skill: "pronouns", ruleGroup: "number", difficulty: 2, left: ["he", "it", "we", "they"], right: ["单数男生", "单数动物或物品", "复数且包含我", "复数且不包含我"], pairs: [0, 1, 2, 3], promptZh: "把代词和数量含义配对。", hintZh: "注意 we 与 they 是否包含说话的人。", explanationZh: "He/it 是单数；we/they 是复数，但 we 包含说话者。" }),
  categorize({ stageId: "pronouns", id: "pronoun-category-person", skill: "pronouns", ruleGroup: "person", difficulty: 3, categoryLabels: ["第一人称", "第二人称", "第三人称"], itemLabels: ["I", "we", "you", "he", "she", "it", "they"], answers: [0, 0, 1, 2, 2, 2, 2], promptZh: "把代词放入正确的人称组。", hintZh: "先找包含“我”的词，再找表示“你”的词。", explanationZh: "人称由说话者、听话者和其他人或物来区分。" }),
  categorize({ stageId: "pronouns", id: "pronoun-category-number", skill: "pronouns", ruleGroup: "number", difficulty: 3, categoryLabels: ["单数", "复数"], itemLabels: ["I", "he", "she", "it", "we", "they"], answers: [0, 0, 0, 0, 1, 1], promptZh: "把代词分成单数和复数。", hintZh: "we 和 they 都表示不止一个。", explanationZh: "I/he/she/it 是单数，we/they 是复数；you 可表示单数或复数，本题不放入分类。" }),
];

const beQuestions: GrammarQuestion[] = [
  choice({ stageId: "be", id: "be-i-am", skill: "beAgreement", ruleGroup: "am", difficulty: 1, stem: "I ___ happy.", options: ["am", "is", "are"], correctAnswer: "am", promptZh: "选择正确的 be 动词。", hintZh: "I 有自己专用的 be 动词。", explanationZh: "I 后面使用 am：I am happy." }),
  choice({ stageId: "be", id: "be-you-are", skill: "beAgreement", ruleGroup: "are", difficulty: 1, stem: "You ___ kind.", options: ["are", "am", "is"], correctAnswer: "are", promptZh: "选择正确的 be 动词。", hintZh: "you 后面不用 am。", explanationZh: "You 后面使用 are，无论表示“你”还是“你们”。" }),
  choice({ stageId: "be", id: "be-he-is", skill: "beAgreement", ruleGroup: "is", difficulty: 1, stem: "He ___ my brother.", options: ["is", "are", "am"], correctAnswer: "is", promptZh: "选择正确的 be 动词。", hintZh: "he 是第三人称单数。", explanationZh: "He/she/it 后面使用 is。" }),
  choice({ stageId: "be", id: "be-she-is", skill: "beAgreement", ruleGroup: "is", difficulty: 1, stem: "She ___ a teacher.", options: ["is", "am", "are"], correctAnswer: "is", promptZh: "选择正确的 be 动词。", hintZh: "she 表示一个人。", explanationZh: "She 是第三人称单数，所以使用 is。" }),
  choice({ stageId: "be", id: "be-it-is", skill: "beAgreement", ruleGroup: "is", difficulty: 2, stem: "It ___ a red kite.", options: ["is", "are", "am"], correctAnswer: "is", promptZh: "选择正确的 be 动词。", hintZh: "it 是第三人称单数。", explanationZh: "It 后面使用 is。" }),
  choice({ stageId: "be", id: "be-we-are", skill: "beAgreement", ruleGroup: "are", difficulty: 2, stem: "We ___ ready.", options: ["are", "is", "am"], correctAnswer: "are", promptZh: "选择正确的 be 动词。", hintZh: "we 表示复数。", explanationZh: "We/they 和复数名词后面使用 are。" }),
  choice({ stageId: "be", id: "be-they-are", skill: "beAgreement", ruleGroup: "are", difficulty: 2, stem: "They ___ at school.", options: ["are", "is", "am"], correctAnswer: "are", promptZh: "选择正确的 be 动词。", hintZh: "they 表示复数。", explanationZh: "They 后面使用 are。" }),
  choice({ stageId: "be", id: "be-friends-are", skill: "beAgreement", ruleGroup: "noun", difficulty: 3, stem: "My friends ___ funny.", options: ["are", "is", "am"], correctAnswer: "are", promptZh: "根据名词单复数选择 be 动词。", hintZh: "friends 结尾有 s，表示多人。", explanationZh: "复数名词 friends 后面使用 are。" }),
  sort({ stageId: "be", id: "be-sort-ready", skill: "beAgreement", ruleGroup: "sentence", difficulty: 2, tokens: ["ready.", "am", "I"], correctOrder: ["I", "am", "ready."], promptZh: "排列成“我准备好了”。", hintZh: "I 后面紧跟 am。", explanationZh: "正确语序是 I am ready." }),
  sort({ stageId: "be", id: "be-sort-cat", skill: "beAgreement", ruleGroup: "sentence", difficulty: 2, tokens: ["small.", "cat", "The", "is"], correctOrder: ["The", "cat", "is", "small."], promptZh: "排列成“这只猫很小”。", hintZh: "The cat 是单数主语。", explanationZh: "单数名词 cat 后面使用 is。" }),
  match({ stageId: "be", id: "be-match-subject", skill: "beAgreement", ruleGroup: "agreement", difficulty: 2, left: ["I", "you", "she", "they"], right: ["am", "are（you）", "is", "are（they）"], pairs: [0, 1, 2, 3], promptZh: "把主语和正确的 be 动词配对。", hintZh: "I-am，单数第三人称-is，复数-are。", explanationZh: "am 只跟 I；is 跟第三人称单数；are 跟 you、we、they。" }),
  match({ stageId: "be", id: "be-match-short", skill: "beAgreement", ruleGroup: "contraction", difficulty: 3, left: ["I am", "you are", "she is", "we are"], right: ["I’m", "you’re", "she’s", "we’re"], pairs: [0, 1, 2, 3], promptZh: "把完整形式和缩写配对。", hintZh: "缩写里的撇号代替被省略的字母。", explanationZh: "I’m、you’re、she’s、we’re 分别是对应 be 动词结构的常见缩写。" }),
  categorize({ stageId: "be", id: "be-category-forms", skill: "beAgreement", ruleGroup: "agreement", difficulty: 3, categoryLabels: ["am", "is", "are"], itemLabels: ["I", "he", "the dog", "you", "we", "the books"], answers: [0, 1, 1, 2, 2, 2], promptZh: "把主语放到正确的 be 动词下面。", hintZh: "先找 I，再区分单数和复数。", explanationZh: "I-am；第三人称单数-is；you、复数主语-are。" }),
  categorize({ stageId: "be", id: "be-category-number", skill: "beAgreement", ruleGroup: "noun", difficulty: 3, categoryLabels: ["使用 is", "使用 are"], itemLabels: ["my mother", "the apple", "Ben", "my parents", "two cats", "Amy and I"], answers: [0, 0, 0, 1, 1, 1], promptZh: "根据主语单复数分类。", hintZh: "两个人或两个以上物品使用 are。", explanationZh: "单数人名和名词使用 is，复数名词或并列主语使用 are。" }),
];

const pluralQuestions: GrammarQuestion[] = [
  choice({ stageId: "plurals", id: "plural-books", skill: "nounNumber", ruleGroup: "s", difficulty: 1, stem: "I have two ___.", options: ["books", "book", "bookes"], correctAnswer: "books", promptZh: "选择 book 的正确复数。", hintZh: "大多数名词直接加 s。", explanationZh: "book 的规则复数是 books。" }),
  choice({ stageId: "plurals", id: "plural-buses", skill: "nounNumber", ruleGroup: "es", difficulty: 2, stem: "There are three ___.", options: ["buses", "buss", "bus"], correctAnswer: "buses", promptZh: "选择 bus 的正确复数。", hintZh: "以 s 结尾的名词通常加 es。", explanationZh: "bus 以 s 结尾，复数形式是 buses。" }),
  choice({ stageId: "plurals", id: "plural-babies", skill: "nounNumber", ruleGroup: "ies", difficulty: 2, stem: "The two ___ are sleeping.", options: ["babies", "babys", "baby"], correctAnswer: "babies", promptZh: "选择 baby 的正确复数。", hintZh: "辅音字母加 y 结尾时，要变 y。", explanationZh: "baby 变复数时去 y 加 ies：babies。" }),
  choice({ stageId: "plurals", id: "plural-children", skill: "nounNumber", ruleGroup: "irregular", difficulty: 2, stem: "The ___ are playing.", options: ["children", "childs", "child"], correctAnswer: "children", promptZh: "选择 child 的正确复数。", hintZh: "这是一个不规则复数。", explanationZh: "child 的复数不是 childs，而是 children。" }),
  choice({ stageId: "plurals", id: "plural-men", skill: "nounNumber", ruleGroup: "irregular", difficulty: 2, stem: "Two ___ are teachers.", options: ["men", "mans", "man"], correctAnswer: "men", promptZh: "选择 man 的正确复数。", hintZh: "这是一个变化元音的不规则复数。", explanationZh: "man 的复数是 men。" }),
  choice({ stageId: "plurals", id: "plural-mice", skill: "nounNumber", ruleGroup: "irregular", difficulty: 3, stem: "I can see three ___.", options: ["mice", "mouses", "mouse"], correctAnswer: "mice", promptZh: "选择 mouse 的正确复数。", hintZh: "这个词的复数不是直接加 s。", explanationZh: "mouse 的不规则复数是 mice。" }),
  choice({ stageId: "plurals", id: "plural-sheep", skill: "nounNumber", ruleGroup: "same", difficulty: 3, stem: "Five ___ are on the farm.", options: ["sheep", "sheeps", "sheepes"], correctAnswer: "sheep", promptZh: "选择 sheep 的正确复数。", hintZh: "这个词单复数形式相同。", explanationZh: "sheep 的单数和复数写法都是 sheep。" }),
  choice({ stageId: "plurals", id: "plural-an-apple", skill: "nounNumber", ruleGroup: "article", difficulty: 1, stem: "This is ___ apple.", options: ["an", "a", "two"], correctAnswer: "an", promptZh: "选择正确的冠词。", hintZh: "apple 以元音音素开头。", explanationZh: "单数可数名词前使用 a/an；元音音素前使用 an。" }),
  sort({ stageId: "plurals", id: "plural-sort-apples", skill: "nounNumber", ruleGroup: "sentence", difficulty: 2, tokens: ["apples.", "two", "have", "I"], correctOrder: ["I", "have", "two", "apples."], promptZh: "排列成“我有两个苹果”。", hintZh: "two 后面的名词要用复数。", explanationZh: "数量大于一时，可数名词 apple 使用复数 apples。" }),
  sort({ stageId: "plurals", id: "plural-sort-children", skill: "nounNumber", ruleGroup: "sentence", difficulty: 3, tokens: ["playing.", "children", "Three", "are"], correctOrder: ["Three", "children", "are", "playing."], promptZh: "排列成“三个孩子正在玩”。", hintZh: "Three 后面使用 child 的不规则复数。", explanationZh: "Three children 是复数主语，所以后面使用 are。" }),
  match({ stageId: "plurals", id: "plural-match-regular", skill: "nounNumber", ruleGroup: "forms", difficulty: 2, left: ["cat", "box", "baby", "book"], right: ["cats", "boxes", "babies", "books"], pairs: [0, 1, 2, 3], promptZh: "把单数名词和复数形式配对。", hintZh: "注意 s、es 和 ies 三种结尾。", explanationZh: "普通词加 s；以 x 等结尾加 es；辅音+y 通常变 ies。" }),
  match({ stageId: "plurals", id: "plural-match-irregular", skill: "nounNumber", ruleGroup: "irregular", difficulty: 3, left: ["child", "man", "tooth", "mouse"], right: ["children", "men", "teeth", "mice"], pairs: [0, 1, 2, 3], promptZh: "把不规则单数和复数配对。", hintZh: "这些词不能只在结尾加 s。", explanationZh: "children、men、teeth、mice 都是不规则复数，需要单独记忆。" }),
  categorize({ stageId: "plurals", id: "plural-category-rule", skill: "nounNumber", ruleGroup: "forms", difficulty: 3, categoryLabels: ["规则复数", "不规则复数"], itemLabels: ["dogs", "boxes", "babies", "children", "women", "feet", "mice"], answers: [0, 0, 0, 1, 1, 1, 1], promptZh: "把复数词分成规则和不规则两组。", hintZh: "能用 s、es、ies 规则解释的放在一组。", explanationZh: "规则复数遵循词尾变化；children、women、feet、mice 等不规则复数需要单独记忆。" }),
  categorize({ stageId: "plurals", id: "plural-category-number", skill: "nounNumber", ruleGroup: "number", difficulty: 2, categoryLabels: ["单数", "复数"], itemLabels: ["an apple", "one child", "the mouse", "two apples", "three children", "many mice"], answers: [0, 0, 0, 1, 1, 1], promptZh: "根据数量分组。", hintZh: "one/a/an 表示一个，two/three/many 表示多个。", explanationZh: "数量词和名词形式必须一致。" }),
];

const demonstrativeQuestions: GrammarQuestion[] = [
  choice({ stageId: "demonstratives", id: "demo-this", skill: "demonstratives", ruleGroup: "near", difficulty: 1, stem: "___ is my pencil here.", options: ["This", "These", "Those"], correctAnswer: "This", promptZh: "选择表示“这个”的指示词。", hintZh: "东西离说话者近，而且只有一个。", explanationZh: "近处单数使用 this。" }),
  choice({ stageId: "demonstratives", id: "demo-that", skill: "demonstratives", ruleGroup: "far", difficulty: 1, stem: "___ is your bag over there.", options: ["That", "This", "These"], correctAnswer: "That", promptZh: "选择表示“那个”的指示词。", hintZh: "东西在远处，而且只有一个。", explanationZh: "远处单数使用 that。" }),
  choice({ stageId: "demonstratives", id: "demo-these", skill: "demonstratives", ruleGroup: "near", difficulty: 1, stem: "___ are my books here.", options: ["These", "This", "That"], correctAnswer: "These", promptZh: "选择表示“这些”的指示词。", hintZh: "东西在近处，而且不止一个。", explanationZh: "近处复数使用 these。" }),
  choice({ stageId: "demonstratives", id: "demo-those", skill: "demonstratives", ruleGroup: "far", difficulty: 1, stem: "___ are birds in the sky.", options: ["Those", "That", "This"], correctAnswer: "Those", promptZh: "选择表示“那些”的指示词。", hintZh: "鸟在远处，而且有多只。", explanationZh: "远处复数使用 those。" }),
  choice({ stageId: "demonstratives", id: "demo-this-is", skill: "demonstratives", ruleGroup: "agreement", difficulty: 2, stem: "This ___ a red apple.", options: ["is", "are", "am"], correctAnswer: "is", promptZh: "选择与 this 搭配的 be 动词。", hintZh: "this 表示单数。", explanationZh: "This/that 是单数，后面使用 is。" }),
  choice({ stageId: "demonstratives", id: "demo-these-are", skill: "demonstratives", ruleGroup: "agreement", difficulty: 2, stem: "These ___ my shoes.", options: ["are", "is", "am"], correctAnswer: "are", promptZh: "选择与 these 搭配的 be 动词。", hintZh: "these 表示复数。", explanationZh: "These/those 是复数，后面使用 are。" }),
  choice({ stageId: "demonstratives", id: "demo-that-cat", skill: "demonstratives", ruleGroup: "number", difficulty: 2, stem: "Look at ___ cat over there.", options: ["that", "those", "these"], correctAnswer: "that", promptZh: "选择正确的指示词。", hintZh: "cat 是单数，而且在远处。", explanationZh: "远处单数名词 cat 前使用 that。" }),
  choice({ stageId: "demonstratives", id: "demo-those-trees", skill: "demonstratives", ruleGroup: "number", difficulty: 3, stem: "Look at ___ tall trees over there.", options: ["those", "that", "this"], correctAnswer: "those", promptZh: "选择正确的指示词。", hintZh: "trees 是复数，而且在远处。", explanationZh: "远处复数名词 trees 前使用 those。" }),
  sort({ stageId: "demonstratives", id: "demo-sort-book", skill: "demonstratives", ruleGroup: "sentence", difficulty: 2, tokens: ["book.", "my", "is", "This"], correctOrder: ["This", "is", "my", "book."], promptZh: "排列成“这是我的书”。", hintZh: "This 与 is 放在句首。", explanationZh: "近处单数结构是 This is ..." }),
  sort({ stageId: "demonstratives", id: "demo-sort-trees", skill: "demonstratives", ruleGroup: "sentence", difficulty: 3, tokens: ["trees.", "are", "big", "Those"], correctOrder: ["Those", "are", "big", "trees."], promptZh: "排列成“那些是大树”。", hintZh: "Those 表示远处复数，后接 are。", explanationZh: "远处复数结构是 Those are ..." }),
  match({ stageId: "demonstratives", id: "demo-match-meaning", skill: "demonstratives", ruleGroup: "distance", difficulty: 2, left: ["近处一个", "远处一个", "近处多个", "远处多个"], right: ["this", "that", "these", "those"], pairs: [0, 1, 2, 3], promptZh: "把远近和数量与指示词配对。", hintZh: "先分单数 this/that，再分复数 these/those。", explanationZh: "this/these 表示近处；that/those 表示远处。" }),
  match({ stageId: "demonstratives", id: "demo-match-be", skill: "demonstratives", ruleGroup: "agreement", difficulty: 2, left: ["This", "That", "These", "Those"], right: ["is（this）", "is（that）", "are（these）", "are（those）"], pairs: [0, 1, 2, 3], promptZh: "把指示词和 be 动词配对。", hintZh: "单数用 is，复数用 are。", explanationZh: "This/that 搭配 is；these/those 搭配 are。" }),
  categorize({ stageId: "demonstratives", id: "demo-category-distance", skill: "demonstratives", ruleGroup: "distance", difficulty: 3, categoryLabels: ["近处", "远处"], itemLabels: ["this", "these", "that", "those"], answers: [0, 0, 1, 1], promptZh: "按远近给指示词分类。", hintZh: "th 开头的两组中，各有一个近处词和一个远处词。", explanationZh: "this/these 指近处，that/those 指远处。" }),
  categorize({ stageId: "demonstratives", id: "demo-category-number", skill: "demonstratives", ruleGroup: "number", difficulty: 3, categoryLabels: ["单数", "复数"], itemLabels: ["this book", "that dog", "these books", "those dogs"], answers: [0, 0, 1, 1], promptZh: "按单复数给短语分类。", hintZh: "this/that 对应一个，these/those 对应多个。", explanationZh: "指示词和后面的名词必须在单复数上保持一致。" }),
];

const thereBeQuestions: GrammarQuestion[] = [
  choice({ stageId: "there-be", id: "there-is-cat", skill: "thereBe", ruleGroup: "affirmative", difficulty: 1, stem: "___ a cat on the chair.", options: ["There is", "There are", "They are"], correctAnswer: "There is", promptZh: "选择“有一只猫”的正确开头。", hintZh: "a cat 是单数。", explanationZh: "There is 后接单数名词。" }),
  choice({ stageId: "there-be", id: "there-are-books", skill: "thereBe", ruleGroup: "affirmative", difficulty: 1, stem: "___ three books on the desk.", options: ["There are", "There is", "It is"], correctAnswer: "There are", promptZh: "选择“有三本书”的正确开头。", hintZh: "three books 是复数。", explanationZh: "There are 后接复数名词。" }),
  choice({ stageId: "there-be", id: "there-is-water", skill: "thereBe", ruleGroup: "affirmative", difficulty: 2, stem: "___ some water in the cup.", options: ["There is", "There are", "They are"], correctAnswer: "There is", promptZh: "选择正确的 there be 结构。", hintZh: "water 在这里不可数，按单数处理。", explanationZh: "不可数名词 water 通常搭配 There is。" }),
  choice({ stageId: "there-be", id: "there-not-dog", skill: "thereBe", ruleGroup: "negative", difficulty: 2, stem: "___ a dog in the room.", options: ["There isn’t", "There aren’t", "It isn’t"], correctAnswer: "There isn’t", promptZh: "表达“房间里没有一只狗”。", hintZh: "a dog 是单数。", explanationZh: "单数否定使用 There isn’t。" }),
  choice({ stageId: "there-be", id: "there-not-cats", skill: "thereBe", ruleGroup: "negative", difficulty: 2, stem: "___ any cats here.", options: ["There aren’t", "There isn’t", "They aren’t"], correctAnswer: "There aren’t", promptZh: "表达“这里没有猫”。", hintZh: "cats 是复数。", explanationZh: "复数否定使用 There aren’t。" }),
  choice({ stageId: "there-be", id: "there-question-one", skill: "thereBe", ruleGroup: "question", difficulty: 2, stem: "___ a park near here?", options: ["Is there", "Are there", "There is"], correctAnswer: "Is there", promptZh: "选择询问“附近有公园吗”的开头。", hintZh: "a park 是单数，疑问句把 is 放到 there 前。", explanationZh: "单数 there be 疑问句使用 Is there ...?" }),
  choice({ stageId: "there-be", id: "there-question-many", skill: "thereBe", ruleGroup: "question", difficulty: 2, stem: "___ any apples in the bag?", options: ["Are there", "Is there", "There are"], correctAnswer: "Are there", promptZh: "选择询问“包里有苹果吗”的开头。", hintZh: "apples 是复数。", explanationZh: "复数 there be 疑问句使用 Are there ...?" }),
  choice({ stageId: "there-be", id: "there-short-answer", skill: "thereBe", ruleGroup: "answer", difficulty: 3, stem: "Are there two birds? Yes, ___.", options: ["there are", "there is", "they are"], correctAnswer: "there are", promptZh: "选择正确的简短回答。", hintZh: "问题用 Are there 开头。", explanationZh: "Are there ...? 的肯定简短回答是 Yes, there are." }),
  sort({ stageId: "there-be", id: "there-sort-birds", skill: "thereBe", ruleGroup: "sentence", difficulty: 2, tokens: ["birds", "There", "three", "are", "outside."], correctOrder: ["There", "are", "three", "birds", "outside."], promptZh: "排列成“外面有三只鸟”。", hintZh: "复数数量 three birds 前使用 There are。", explanationZh: "正确结构是 There are + 复数名词。" }),
  sort({ stageId: "there-be", id: "there-sort-question", skill: "thereBe", ruleGroup: "question", difficulty: 3, tokens: ["there", "cat", "a", "Is", "?"], correctOrder: ["Is", "there", "a", "cat", "?"], promptZh: "排列成“有一只猫吗？”", hintZh: "疑问句以 Is 开头。", explanationZh: "There is 的一般疑问句把 is 提到 there 前。" }),
  match({ stageId: "there-be", id: "there-match-halves", skill: "thereBe", ruleGroup: "agreement", difficulty: 2, left: ["There is", "There are", "There isn’t", "There aren’t"], right: ["a cat here.", "two cats here.", "a dog here.", "any dogs here."], pairs: [0, 1, 2, 3], promptZh: "连接正确的句子前后半部分。", hintZh: "is/isn’t 接单数，are/aren’t 接复数。", explanationZh: "there be 的 be 动词由后面名词的单复数决定。" }),
  match({ stageId: "there-be", id: "there-match-answers", skill: "thereBe", ruleGroup: "answer", difficulty: 3, left: ["Is there a pen?", "Are there two pens?", "Is there a dog?", "Are there any dogs?"], right: ["Yes, there is.", "Yes, there are.", "No, there isn’t.", "No, there aren’t."], pairs: [0, 1, 2, 3], promptZh: "把问题和简短回答配对。", hintZh: "is 对应 is/isn’t，are 对应 are/aren’t。", explanationZh: "简短回答保留问题中的 is 或 are。" }),
  categorize({ stageId: "there-be", id: "there-category-form", skill: "thereBe", ruleGroup: "agreement", difficulty: 3, categoryLabels: ["There is", "There are"], itemLabels: ["one apple", "a teacher", "some milk", "two apples", "many children", "three boxes"], answers: [0, 0, 0, 1, 1, 1], promptZh: "把名词短语放到正确结构下面。", hintZh: "一个或不可数用 is，多个用 are。", explanationZh: "there be 与紧随其后的名词保持单复数一致。" }),
  categorize({ stageId: "there-be", id: "there-category-question", skill: "thereBe", ruleGroup: "question", difficulty: 3, categoryLabels: ["Is there ...?", "Are there ...?"], itemLabels: ["a book", "one child", "any water", "two books", "any children", "many flowers"], answers: [0, 0, 0, 1, 1, 1], promptZh: "为名词短语选择正确的疑问句开头。", hintZh: "先判断单数、复数或不可数。", explanationZh: "单数或不可数用 Is there；复数用 Are there。" }),
];

const haveHasQuestions: GrammarQuestion[] = [
  choice({ stageId: "have-has", id: "have-i", skill: "haveHas", ruleGroup: "have", difficulty: 1, stem: "I ___ a blue bag.", options: ["have", "has", "am"], correctAnswer: "have", promptZh: "选择正确的“有”。", hintZh: "I 后面使用动词原形。", explanationZh: "I/you/we/they 后面使用 have。" }),
  choice({ stageId: "have-has", id: "have-you", skill: "haveHas", ruleGroup: "have", difficulty: 1, stem: "You ___ a new book.", options: ["have", "has", "are"], correctAnswer: "have", promptZh: "选择正确的“有”。", hintZh: "you 后面不用 has。", explanationZh: "You 后面使用 have。" }),
  choice({ stageId: "have-has", id: "has-he", skill: "haveHas", ruleGroup: "has", difficulty: 1, stem: "He ___ a little dog.", options: ["has", "have", "is"], correctAnswer: "has", promptZh: "选择正确的“有”。", hintZh: "he 是第三人称单数。", explanationZh: "He/she/it 后面使用 has。" }),
  choice({ stageId: "have-has", id: "has-she", skill: "haveHas", ruleGroup: "has", difficulty: 1, stem: "She ___ two pencils.", options: ["has", "have", "are"], correctAnswer: "has", promptZh: "选择正确的“有”。", hintZh: "看主语 she，不要被 pencils 干扰。", explanationZh: "动词形式由主语 she 决定，所以使用 has。" }),
  choice({ stageId: "have-has", id: "has-dog", skill: "haveHas", ruleGroup: "noun", difficulty: 2, stem: "The dog ___ a long tail.", options: ["has", "have", "is"], correctAnswer: "has", promptZh: "根据主语选择 have 或 has。", hintZh: "the dog 是第三人称单数。", explanationZh: "单数名词作主语时使用 has。" }),
  choice({ stageId: "have-has", id: "have-we", skill: "haveHas", ruleGroup: "have", difficulty: 2, stem: "We ___ English class today.", options: ["have", "has", "are"], correctAnswer: "have", promptZh: "选择正确的动词。", hintZh: "we 是第一人称复数。", explanationZh: "We 后面使用 have。" }),
  choice({ stageId: "have-has", id: "have-they", skill: "haveHas", ruleGroup: "have", difficulty: 2, stem: "They ___ three kites.", options: ["have", "has", "are"], correctAnswer: "have", promptZh: "选择正确的动词。", hintZh: "they 是第三人称复数。", explanationZh: "They 后面使用 have。" }),
  choice({ stageId: "have-has", id: "have-names", skill: "haveHas", ruleGroup: "noun", difficulty: 3, stem: "Tom and Amy ___ a ball.", options: ["have", "has", "is"], correctAnswer: "have", promptZh: "根据并列主语选择 have 或 has。", hintZh: "Tom and Amy 是两个人。", explanationZh: "并列主语表示复数，因此使用 have。" }),
  sort({ stageId: "have-has", id: "have-sort-kite", skill: "haveHas", ruleGroup: "sentence", difficulty: 2, tokens: ["kite.", "a", "has", "She"], correctOrder: ["She", "has", "a", "kite."], promptZh: "排列成“她有一个风筝”。", hintZh: "She 后面使用 has。", explanationZh: "正确结构是 She has + 名词。" }),
  sort({ stageId: "have-has", id: "have-sort-books", skill: "haveHas", ruleGroup: "sentence", difficulty: 2, tokens: ["books.", "two", "We", "have"], correctOrder: ["We", "have", "two", "books."], promptZh: "排列成“我们有两本书”。", hintZh: "We 后面使用 have。", explanationZh: "正确结构是 We have + 名词。" }),
  match({ stageId: "have-has", id: "have-match-subject", skill: "haveHas", ruleGroup: "agreement", difficulty: 2, left: ["I", "he", "we", "the cat"], right: ["have（I）", "has（he）", "have（we）", "has（cat）"], pairs: [0, 1, 2, 3], promptZh: "把主语和正确形式配对。", hintZh: "第三人称单数用 has，其余这些主语用 have。", explanationZh: "I/we 使用 have；he 和单数名词 the cat 使用 has。" }),
  match({ stageId: "have-has", id: "have-match-sentence", skill: "haveHas", ruleGroup: "noun", difficulty: 3, left: ["My sister", "My parents", "The bird", "The children"], right: ["has a doll.", "have a car.", "has two wings.", "have new bags."], pairs: [0, 1, 2, 3], promptZh: "连接正确的句子。", hintZh: "先判断左边主语是单数还是复数。", explanationZh: "单数主语搭配 has，复数主语搭配 have。" }),
  categorize({ stageId: "have-has", id: "have-category", skill: "haveHas", ruleGroup: "agreement", difficulty: 3, categoryLabels: ["have", "has"], itemLabels: ["I", "you", "we", "they", "she", "it", "Ben", "the dog"], answers: [0, 0, 0, 0, 1, 1, 1, 1], promptZh: "把主语放到 have 或 has 下面。", hintZh: "第三人称单数放在 has 组。", explanationZh: "he/she/it 和单数名词用 has；I/you/we/they 用 have。" }),
  categorize({ stageId: "have-has", id: "have-category-number", skill: "haveHas", ruleGroup: "noun", difficulty: 3, categoryLabels: ["单数主语，用 has", "复数主语，用 have"], itemLabels: ["my friend", "the boy", "Amy", "my friends", "the boys", "Amy and Leo"], answers: [0, 0, 0, 1, 1, 1], promptZh: "按主语的单复数分类。", hintZh: "看到 and 通常表示不止一个。", explanationZh: "名词主语是单数时用 has，复数时用 have。" }),
];

const verbQuestions: GrammarQuestion[] = [
  choice({ stageId: "verbs", id: "verb-i-play", skill: "thirdPersonVerbs", ruleGroup: "base", difficulty: 1, stem: "I ___ football after school.", options: ["play", "plays", "playing"], correctAnswer: "play", promptZh: "选择正确的动词形式。", hintZh: "I 后面使用动词原形。", explanationZh: "一般现在时中，I/you/we/they 后面使用动词原形。" }),
  choice({ stageId: "verbs", id: "verb-he-plays", skill: "thirdPersonVerbs", ruleGroup: "s", difficulty: 1, stem: "He ___ football after school.", options: ["plays", "play", "playes"], correctAnswer: "plays", promptZh: "选择正确的动词形式。", hintZh: "he 是第三人称单数。", explanationZh: "第三人称单数的一般现在时动词通常加 s。" }),
  choice({ stageId: "verbs", id: "verb-she-watches", skill: "thirdPersonVerbs", ruleGroup: "es", difficulty: 2, stem: "She ___ TV on Sunday.", options: ["watches", "watch", "watchs"], correctAnswer: "watches", promptZh: "选择 watch 的正确形式。", hintZh: "watch 以 ch 结尾。", explanationZh: "第三人称单数中，以 ch 结尾的 watch 加 es。" }),
  choice({ stageId: "verbs", id: "verb-tom-studies", skill: "thirdPersonVerbs", ruleGroup: "ies", difficulty: 2, stem: "Tom ___ English every day.", options: ["studies", "studys", "study"], correctAnswer: "studies", promptZh: "选择 study 的正确形式。", hintZh: "辅音字母加 y 结尾，要变化 y。", explanationZh: "study 的第三人称单数形式是 studies。" }),
  choice({ stageId: "verbs", id: "verb-dogs-run", skill: "thirdPersonVerbs", ruleGroup: "base", difficulty: 2, stem: "The dogs ___ fast.", options: ["run", "runs", "running"], correctAnswer: "run", promptZh: "根据主语选择动词形式。", hintZh: "dogs 是复数。", explanationZh: "复数主语后使用动词原形 run。" }),
  choice({ stageId: "verbs", id: "verb-bird-flies", skill: "thirdPersonVerbs", ruleGroup: "ies", difficulty: 2, stem: "The bird ___ in the sky.", options: ["flies", "flys", "fly"], correctAnswer: "flies", promptZh: "选择 fly 的正确形式。", hintZh: "the bird 是单数，fly 以辅音+y 结尾。", explanationZh: "fly 的第三人称单数形式是 flies。" }),
  choice({ stageId: "verbs", id: "verb-children-like", skill: "thirdPersonVerbs", ruleGroup: "base", difficulty: 3, stem: "The children ___ apples.", options: ["like", "likes", "liking"], correctAnswer: "like", promptZh: "根据不规则复数主语选择动词。", hintZh: "children 是复数。", explanationZh: "Children 是 child 的复数，所以使用动词原形 like。" }),
  choice({ stageId: "verbs", id: "verb-amy-goes", skill: "thirdPersonVerbs", ruleGroup: "es", difficulty: 3, stem: "Amy ___ to school by bus.", options: ["goes", "gos", "go"], correctAnswer: "goes", promptZh: "选择 go 的正确形式。", hintZh: "Amy 是第三人称单数，go 要加 es。", explanationZh: "go 的第三人称单数形式是 goes。" }),
  sort({ stageId: "verbs", id: "verb-sort-football", skill: "thirdPersonVerbs", ruleGroup: "sentence", difficulty: 2, tokens: ["football.", "plays", "He"], correctOrder: ["He", "plays", "football."], promptZh: "排列成“他踢足球”。", hintZh: "He 后面的 play 要加 s。", explanationZh: "He 是第三人称单数，所以说 He plays。" }),
  sort({ stageId: "verbs", id: "verb-sort-watches", skill: "thirdPersonVerbs", ruleGroup: "sentence", difficulty: 3, tokens: ["mother", "TV.", "watches", "My"], correctOrder: ["My", "mother", "watches", "TV."], promptZh: "排列成“我的妈妈看电视”。", hintZh: "My mother 是第三人称单数。", explanationZh: "单数主语 My mother 后使用 watches。" }),
  match({ stageId: "verbs", id: "verb-match-forms", skill: "thirdPersonVerbs", ruleGroup: "forms", difficulty: 2, left: ["play", "watch", "study", "go"], right: ["plays", "watches", "studies", "goes"], pairs: [0, 1, 2, 3], promptZh: "把动词原形和第三人称单数形式配对。", hintZh: "注意 s、es、ies 三种变化。", explanationZh: "第三人称单数词尾变化取决于动词结尾。" }),
  match({ stageId: "verbs", id: "verb-match-subject", skill: "thirdPersonVerbs", ruleGroup: "agreement", difficulty: 3, left: ["I", "she", "the boys", "my father"], right: ["read books.", "reads books.", "play games.", "plays games."], pairs: [0, 1, 2, 3], promptZh: "连接正确的主语和谓语。", hintZh: "第三人称单数用变化后的动词。", explanationZh: "I 和复数主语用原形；she 与单数名词主语用第三人称单数形式。" }),
  categorize({ stageId: "verbs", id: "verb-category-base", skill: "thirdPersonVerbs", ruleGroup: "agreement", difficulty: 3, categoryLabels: ["用动词原形", "动词要变化"], itemLabels: ["I", "you", "we", "they", "he", "she", "the cat", "Tom"], answers: [0, 0, 0, 0, 1, 1, 1, 1], promptZh: "按主语需要的动词形式分类。", hintZh: "第三人称单数主语放在“动词要变化”组。", explanationZh: "一般现在时只有第三人称单数肯定句需要改变实义动词。" }),
  categorize({ stageId: "verbs", id: "verb-category-ending", skill: "thirdPersonVerbs", ruleGroup: "forms", difficulty: 3, categoryLabels: ["加 s", "加 es", "变 y 为 ies"], itemLabels: ["plays", "reads", "likes", "watches", "goes", "washes", "studies", "flies"], answers: [0, 0, 0, 1, 1, 1, 2, 2], promptZh: "按第三人称单数的变化规则分类。", hintZh: "看每个动词原形的结尾。", explanationZh: "普通动词加 s；部分结尾加 es；辅音+y 通常变 y 为 ies。" }),
];

const negativeQuestions: GrammarQuestion[] = [
  choice({ stageId: "negatives", id: "negative-i-am-not", skill: "negatives", ruleGroup: "be", difficulty: 1, stem: "I ___ tired.", options: ["am not", "isn’t", "aren’t"], correctAnswer: "am not", promptZh: "选择正确的 be 动词否定形式。", hintZh: "主语是 I。", explanationZh: "I 的 be 动词否定形式是 am not。" }),
  choice({ stageId: "negatives", id: "negative-he-isnt", skill: "negatives", ruleGroup: "be", difficulty: 1, stem: "He ___ at home.", options: ["isn’t", "aren’t", "am not"], correctAnswer: "isn’t", promptZh: "表达“他不在家”。", hintZh: "he 与 is 搭配。", explanationZh: "He is not 可以缩写为 He isn’t。" }),
  choice({ stageId: "negatives", id: "negative-they-arent", skill: "negatives", ruleGroup: "be", difficulty: 1, stem: "They ___ hungry.", options: ["aren’t", "isn’t", "don’t"], correctAnswer: "aren’t", promptZh: "表达“他们不饿”。", hintZh: "they 与 are 搭配。", explanationZh: "They are not 可以缩写为 They aren’t。" }),
  choice({ stageId: "negatives", id: "negative-i-dont", skill: "negatives", ruleGroup: "do", difficulty: 2, stem: "I ___ like milk.", options: ["don’t", "doesn’t", "am not"], correctAnswer: "don’t", promptZh: "表达“我不喜欢牛奶”。", hintZh: "like 是实义动词，主语是 I。", explanationZh: "I/you/we/they 的一般现在时否定使用 don’t + 动词原形。" }),
  choice({ stageId: "negatives", id: "negative-she-doesnt", skill: "negatives", ruleGroup: "does", difficulty: 2, stem: "She ___ like bananas.", options: ["doesn’t", "don’t", "isn’t"], correctAnswer: "doesn’t", promptZh: "表达“她不喜欢香蕉”。", hintZh: "she 是第三人称单数，like 是实义动词。", explanationZh: "第三人称单数一般现在时否定使用 doesn’t + 动词原形。" }),
  choice({ stageId: "negatives", id: "negative-tom-have", skill: "negatives", ruleGroup: "base-after-do", difficulty: 3, stem: "Tom doesn’t ___ a bike.", options: ["have", "has", "having"], correctAnswer: "have", promptZh: "选择 doesn’t 后的动词形式。", hintZh: "doesn’t 已经带走了第三人称单数变化。", explanationZh: "doesn’t 后必须使用动词原形 have，不能用 has。" }),
  choice({ stageId: "negatives", id: "negative-cats-dont", skill: "negatives", ruleGroup: "do", difficulty: 2, stem: "The cats ___ sleep here.", options: ["don’t", "doesn’t", "aren’t"], correctAnswer: "don’t", promptZh: "选择复数主语的否定助动词。", hintZh: "cats 是复数，sleep 是实义动词。", explanationZh: "复数主语的一般现在时否定使用 don’t。" }),
  choice({ stageId: "negatives", id: "negative-it-isnt", skill: "negatives", ruleGroup: "be", difficulty: 2, stem: "It ___ blue.", options: ["isn’t", "doesn’t", "aren’t"], correctAnswer: "isn’t", promptZh: "表达“它不是蓝色的”。", hintZh: "blue 前需要 be 动词。", explanationZh: "It is not 的缩写是 It isn’t。" }),
  sort({ stageId: "negatives", id: "negative-sort-play", skill: "negatives", ruleGroup: "sentence", difficulty: 2, tokens: ["football.", "not", "does", "He", "play"], correctOrder: ["He", "does", "not", "play", "football."], promptZh: "排列成“他不踢足球”。", hintZh: "does not 后面使用 play 原形。", explanationZh: "第三人称单数否定结构是 主语 + does not + 动词原形。" }),
  sort({ stageId: "negatives", id: "negative-sort-sad", skill: "negatives", ruleGroup: "sentence", difficulty: 2, tokens: ["sad.", "not", "are", "We"], correctOrder: ["We", "are", "not", "sad."], promptZh: "排列成“我们不难过”。", hintZh: "be 动词否定把 not 放在 are 后。", explanationZh: "We 的 be 动词否定结构是 We are not ..." }),
  match({ stageId: "negatives", id: "negative-match-be", skill: "negatives", ruleGroup: "be", difficulty: 2, left: ["I am", "he is", "we are", "it is"], right: ["I am not", "he isn’t", "we aren’t", "it isn’t"], pairs: [0, 1, 2, 3], promptZh: "把肯定形式和 be 动词否定形式配对。", hintZh: "not 放在 be 动词后面。", explanationZh: "be 动词否定直接在 am/is/are 后加 not。" }),
  match({ stageId: "negatives", id: "negative-match-do", skill: "negatives", ruleGroup: "agreement", difficulty: 3, left: ["I", "she", "the boys", "my father"], right: ["don’t like tea.", "doesn’t like tea.", "don’t play here.", "doesn’t play here."], pairs: [0, 1, 2, 3], promptZh: "连接正确的否定句。", hintZh: "第三人称单数用 doesn’t，其余这些主语用 don’t。", explanationZh: "don’t/doesn’t 由主语决定，后面的实义动词都恢复原形。" }),
  categorize({ stageId: "negatives", id: "negative-category-kind", skill: "negatives", ruleGroup: "structure", difficulty: 3, categoryLabels: ["be 动词否定", "实义动词否定"], itemLabels: ["am not", "isn’t tall", "aren’t ready", "don’t like", "doesn’t play", "don’t have"], answers: [0, 0, 0, 1, 1, 1], promptZh: "按否定句结构分类。", hintZh: "含 am/is/are 的放一组，含 do/does 的放另一组。", explanationZh: "be 动词直接加 not；实义动词需要 don’t 或 doesn’t。" }),
  categorize({ stageId: "negatives", id: "negative-category-helper", skill: "negatives", ruleGroup: "agreement", difficulty: 3, categoryLabels: ["使用 don’t", "使用 doesn’t"], itemLabels: ["I", "you", "we", "they", "he", "she", "Tom", "the cat"], answers: [0, 0, 0, 0, 1, 1, 1, 1], promptZh: "为主语选择 don’t 或 doesn’t。", hintZh: "第三人称单数使用 doesn’t。", explanationZh: "I/you/we/they 用 don’t；he/she/it 和单数名词用 doesn’t。" }),
];

const questionQuestions: GrammarQuestion[] = [
  choice({ stageId: "questions", id: "question-am-i", skill: "questions", ruleGroup: "be", difficulty: 1, stem: "___ I late?", options: ["Am", "Is", "Are"], correctAnswer: "Am", promptZh: "选择正确的疑问句开头。", hintZh: "主语 I 与 am 搭配。", explanationZh: "I am 的一般疑问句把 am 提前：Am I ...?" }),
  choice({ stageId: "questions", id: "question-are-you", skill: "questions", ruleGroup: "be", difficulty: 1, stem: "___ you ready?", options: ["Are", "Is", "Do"], correctAnswer: "Are", promptZh: "选择正确的疑问句开头。", hintZh: "you 与 are 搭配。", explanationZh: "You are 的一般疑问句是 Are you ...?" }),
  choice({ stageId: "questions", id: "question-is-he", skill: "questions", ruleGroup: "be", difficulty: 1, stem: "___ he your brother?", options: ["Is", "Are", "Does"], correctAnswer: "Is", promptZh: "选择正确的疑问句开头。", hintZh: "句子询问身份，需要 be 动词。", explanationZh: "He is 的一般疑问句是 Is he ...?" }),
  choice({ stageId: "questions", id: "question-are-they", skill: "questions", ruleGroup: "be", difficulty: 2, stem: "___ they at school?", options: ["Are", "Is", "Do"], correctAnswer: "Are", promptZh: "选择正确的疑问句开头。", hintZh: "they 与 are 搭配。", explanationZh: "They are 的一般疑问句是 Are they ...?" }),
  choice({ stageId: "questions", id: "question-do-we", skill: "questions", ruleGroup: "do", difficulty: 2, stem: "___ we have English today?", options: ["Do", "Does", "Are"], correctAnswer: "Do", promptZh: "选择实义动词疑问句的助动词。", hintZh: "we 后使用 do。", explanationZh: "I/you/we/they 的一般现在时疑问句使用 Do。" }),
  choice({ stageId: "questions", id: "question-does-she", skill: "questions", ruleGroup: "does", difficulty: 2, stem: "___ she like apples?", options: ["Does", "Do", "Is"], correctAnswer: "Does", promptZh: "选择实义动词疑问句的助动词。", hintZh: "she 是第三人称单数。", explanationZh: "第三人称单数的一般现在时疑问句使用 Does。" }),
  choice({ stageId: "questions", id: "question-answer-is", skill: "questions", ruleGroup: "answer", difficulty: 2, stem: "Is he happy? Yes, ___.", options: ["he is", "he does", "he are"], correctAnswer: "he is", promptZh: "选择正确的简短回答。", hintZh: "问题以 Is 开头。", explanationZh: "Is he ...? 的肯定回答是 Yes, he is." }),
  choice({ stageId: "questions", id: "question-answer-dont", skill: "questions", ruleGroup: "answer", difficulty: 3, stem: "Do they play tennis? No, ___.", options: ["they don’t", "they aren’t", "they doesn’t"], correctAnswer: "they don’t", promptZh: "选择正确的简短回答。", hintZh: "问题以 Do 开头，主语是 they。", explanationZh: "Do they ...? 的否定回答是 No, they don’t." }),
  sort({ stageId: "questions", id: "question-sort-does", skill: "questions", ruleGroup: "order", difficulty: 2, tokens: ["apples", "Does", "like", "Tom", "?"], correctOrder: ["Does", "Tom", "like", "apples", "?"], promptZh: "排列成“Tom 喜欢苹果吗？”", hintZh: "Does 放在句首，后面的 like 用原形。", explanationZh: "一般现在时疑问句语序是 Does + 主语 + 动词原形。" }),
  sort({ stageId: "questions", id: "question-sort-there", skill: "questions", ruleGroup: "order", difficulty: 3, tokens: ["cats", "there", "two", "Are", "?"], correctOrder: ["Are", "there", "two", "cats", "?"], promptZh: "排列成“有两只猫吗？”", hintZh: "复数 there be 问句以 Are there 开头。", explanationZh: "There are 的一般疑问句把 are 提前。" }),
  match({ stageId: "questions", id: "question-match-answer", skill: "questions", ruleGroup: "answer", difficulty: 2, left: ["Is she a teacher?", "Are they ready?", "Does he swim?", "Do you like milk?"], right: ["Yes, she is.", "No, they aren’t.", "Yes, he does.", "No, I don’t."], pairs: [0, 1, 2, 3], promptZh: "把问题和简短回答配对。", hintZh: "回答要保留问题开头的 be 动词或助动词。", explanationZh: "Is/are 问句用 is/are 回答；do/does 问句用 do/does 回答。" }),
  match({ stageId: "questions", id: "question-match-starter", skill: "questions", ruleGroup: "structure", difficulty: 3, left: ["Am", "Is", "Do", "Does"], right: ["I early?", "the cat small?", "they play here?", "Amy have a bike?"], pairs: [0, 1, 2, 3], promptZh: "连接正确的疑问句开头和其余部分。", hintZh: "先判断 be 动词句还是实义动词句。", explanationZh: "疑问句开头要同时匹配谓语类型和主语人称。" }),
  categorize({ stageId: "questions", id: "question-category-kind", skill: "questions", ruleGroup: "structure", difficulty: 3, categoryLabels: ["be 动词问句", "do/does 问句"], itemLabels: ["Are you happy?", "Is it red?", "Am I right?", "Do they run?", "Does he read?", "Do we have time?"], answers: [0, 0, 0, 1, 1, 1], promptZh: "按疑问句结构分类。", hintZh: "描述状态或身份常用 be；询问动作常用 do/does。", explanationZh: "be 动词自身提前；实义动词需要 do/does 帮助提问。" }),
  categorize({ stageId: "questions", id: "question-category-helper", skill: "questions", ruleGroup: "agreement", difficulty: 3, categoryLabels: ["使用 Do", "使用 Does"], itemLabels: ["I", "you", "we", "they", "he", "she", "Ben", "the dog"], answers: [0, 0, 0, 0, 1, 1, 1, 1], promptZh: "为主语选择 Do 或 Does。", hintZh: "第三人称单数使用 Does。", explanationZh: "I/you/we/they 用 Do；he/she/it 和单数名词用 Does。" }),
];

const mixedQuestions: GrammarQuestion[] = [
  choice({ stageId: "mixed", id: "mixed-this-is", skill: "demonstratives", ruleGroup: "demonstratives", difficulty: 1, stem: "___ is my new pencil here.", options: ["This", "These", "Those"], correctAnswer: "This", promptZh: "综合判断指示词。", hintZh: "近处、单数。", explanationZh: "近处单数使用 this，并与 is 搭配。" }),
  choice({ stageId: "mixed", id: "mixed-these-are", skill: "demonstratives", ruleGroup: "demonstratives", difficulty: 2, stem: "These ___ my shoes.", options: ["are", "is", "am"], correctAnswer: "are", promptZh: "综合判断指示词与 be 动词。", hintZh: "these 表示复数。", explanationZh: "These 后面使用 are。" }),
  choice({ stageId: "mixed", id: "mixed-there-are", skill: "thereBe", ruleGroup: "there-be", difficulty: 2, stem: "___ five children in the park.", options: ["There are", "There is", "They are"], correctAnswer: "There are", promptZh: "综合判断 there be 结构。", hintZh: "five children 是复数。", explanationZh: "复数名词前使用 There are。" }),
  choice({ stageId: "mixed", id: "mixed-she-has", skill: "haveHas", ruleGroup: "agreement", difficulty: 1, stem: "She ___ a yellow kite.", options: ["has", "have", "is"], correctAnswer: "has", promptZh: "综合判断主谓搭配。", hintZh: "she 是第三人称单数。", explanationZh: "She 后面使用 has。" }),
  choice({ stageId: "mixed", id: "mixed-he-plays", skill: "thirdPersonVerbs", ruleGroup: "agreement", difficulty: 2, stem: "He ___ basketball every day.", options: ["plays", "play", "playing"], correctAnswer: "plays", promptZh: "综合判断一般现在时动词形式。", hintZh: "he 是第三人称单数。", explanationZh: "第三人称单数肯定句中，play 变为 plays。" }),
  choice({ stageId: "mixed", id: "mixed-they-dont", skill: "negatives", ruleGroup: "negative", difficulty: 2, stem: "They ___ like fish.", options: ["don’t", "doesn’t", "aren’t"], correctAnswer: "don’t", promptZh: "综合判断否定句。", hintZh: "like 是实义动词，they 是复数。", explanationZh: "They 的一般现在时否定使用 don’t。" }),
  choice({ stageId: "mixed", id: "mixed-does-she", skill: "questions", ruleGroup: "question", difficulty: 3, stem: "___ she have a pet?", options: ["Does", "Do", "Is"], correctAnswer: "Does", promptZh: "综合判断疑问句。", hintZh: "she 是第三人称单数，have 是实义动词。", explanationZh: "使用 Does 提问后，后面的动词保持原形 have。" }),
  choice({ stageId: "mixed", id: "mixed-children", skill: "nounNumber", ruleGroup: "plural", difficulty: 3, stem: "The two ___ are happy.", options: ["children", "childs", "child"], correctAnswer: "children", promptZh: "综合判断不规则复数。", hintZh: "two 后面需要 child 的复数。", explanationZh: "child 的不规则复数是 children。" }),
  sort({ stageId: "mixed", id: "mixed-sort-shoes", skill: "demonstratives", ruleGroup: "sentence", difficulty: 2, tokens: ["shoes.", "my", "are", "Those"], correctOrder: ["Those", "are", "my", "shoes."], promptZh: "排列成“那些是我的鞋”。", hintZh: "远处复数使用 Those are。", explanationZh: "Those 与复数名词 shoes 搭配，be 动词使用 are。" }),
  sort({ stageId: "mixed", id: "mixed-sort-bike", skill: "questions", ruleGroup: "sentence", difficulty: 3, tokens: ["bike", "have", "he", "a", "Does", "?"], correctOrder: ["Does", "he", "have", "a", "bike", "?"], promptZh: "排列成“他有自行车吗？”", hintZh: "Does 提前后使用 have 原形。", explanationZh: "正确语序是 Does + 主语 + 动词原形 + 其他。" }),
  match({ stageId: "mixed", id: "mixed-match-subject", skill: "beAgreement", ruleGroup: "agreement", difficulty: 2, left: ["I", "she", "they", "it"], right: ["am ready.", "has a book.", "play outside.", "is small."], pairs: [0, 1, 2, 3], promptZh: "连接能够正确组成句子的部分。", hintZh: "同时检查 be、have 和实义动词形式。", explanationZh: "不同人称会影响 be 动词、have/has 和一般现在时动词形式。" }),
  match({ stageId: "mixed", id: "mixed-match-demonstrative", skill: "demonstratives", ruleGroup: "distance", difficulty: 3, left: ["近处一个", "远处一个", "近处多个", "远处多个"], right: ["This is a ball.", "That is a kite.", "These are books.", "Those are birds."], pairs: [0, 1, 2, 3], promptZh: "把情境和正确句子配对。", hintZh: "先判断远近，再判断数量。", explanationZh: "this/that 对应单数，these/those 对应复数。" }),
  categorize({ stageId: "mixed", id: "mixed-category-number", skill: "pronouns", ruleGroup: "number", difficulty: 3, categoryLabels: ["单数主语", "复数主语"], itemLabels: ["he", "the cat", "Amy", "they", "the cats", "Amy and Ben"], answers: [0, 0, 0, 1, 1, 1], promptZh: "把主语按单复数分类。", hintZh: "and 连接两个人时属于复数。", explanationZh: "识别主语的单复数，是选择正确动词形式的第一步。" }),
  categorize({ stageId: "mixed", id: "mixed-category-correct", skill: "thirdPersonVerbs", ruleGroup: "review", difficulty: 3, categoryLabels: ["句子正确", "需要改正"], itemLabels: ["I am happy.", "She has a cat.", "They play games.", "He are tall.", "We has books.", "Tom play football."], answers: [0, 0, 0, 1, 1, 1], promptZh: "判断哪些句子语法正确。", hintZh: "逐句检查主语和动词是否匹配。", explanationZh: "He is、We have、Tom plays 才是正确的主谓搭配。" }),
];

const grammarQuestionVisuals: Record<string, GrammarQuestionVisual> = {
  "pronoun-he": { emoji: "👦 🎂", altZh: "七岁男孩 Tom" },
  "pronoun-she": { emoji: "👧 🎂", altZh: "六岁女孩 Amy" },
  "pronoun-it": { emoji: "🐈", altZh: "一只白色的猫" },
  "pronoun-we": { emoji: "👧 🤝 🧒", altZh: "Mia 和说话者一起玩耍" },
  "pronoun-they": { emoji: "👦 ⚽ 👦", altZh: "Ben 和 Leo 一起踢足球" },
  "pronoun-dogs": { emoji: "🐶 🐶", altZh: "两只棕色的小狗" },

  "be-i-am": { emoji: "🙂 ✨", altZh: "一个开心的小朋友" },
  "be-he-is": { emoji: "👦 👦", altZh: "两个兄弟" },
  "be-she-is": { emoji: "👩‍🏫", altZh: "一位女老师" },
  "be-it-is": { emoji: "🪁", altZh: "一只红色风筝" },
  "be-they-are": { emoji: "🧒 🏫 🧒", altZh: "小朋友们在学校" },
  "be-sort-cat": { emoji: "🐱", altZh: "一只小猫" },

  "plural-books": { emoji: "📘 📗", altZh: "两本书" },
  "plural-buses": { emoji: "🚌 🚌 🚌", altZh: "三辆公交车" },
  "plural-babies": { emoji: "👶 👶", altZh: "两个正在睡觉的宝宝" },
  "plural-mice": { emoji: "🐭 🐭 🐭", altZh: "三只老鼠" },
  "plural-sheep": { emoji: "🐑 🐑 🐑 🐑 🐑", altZh: "农场里的五只羊" },
  "plural-sort-apples": { emoji: "🍎 🍎", altZh: "两个苹果" },

  "demo-this": { emoji: "✋ ✏️", altZh: "手边的一支铅笔" },
  "demo-that": { emoji: "👀 ··· 🎒", altZh: "远处的一个书包" },
  "demo-these": { emoji: "✋ 📘 📗", altZh: "手边的几本书" },
  "demo-those": { emoji: "👀 ··· 🐦 🐦", altZh: "天空远处的几只鸟" },
  "demo-that-cat": { emoji: "👀 ··· 🐈", altZh: "远处的一只猫" },
  "demo-those-trees": { emoji: "👀 ··· 🌲 🌲", altZh: "远处的几棵大树" },

  "there-is-cat": { emoji: "🪑\n🐱", altZh: "椅子下面有一只猫" },
  "there-are-books": { emoji: "📘 📗 📙\n━━━━", altZh: "桌上有三本书" },
  "there-is-water": { emoji: "🥛 💧", altZh: "杯子里有一些水" },
  "there-not-dog": { emoji: "🏠 🚫 🐶", altZh: "房间里没有狗" },
  "there-question-many": { emoji: "👜 🍎 🍎 ❓", altZh: "询问包里有没有苹果" },
  "there-sort-birds": { emoji: "🌤️ 🐦 🐦 🐦", altZh: "外面有三只鸟" },

  "have-i": { emoji: "🧒 🎒", altZh: "小朋友和一个蓝色书包" },
  "have-you": { emoji: "🧒 📘", altZh: "小朋友和一本新书" },
  "has-he": { emoji: "👦 🐶", altZh: "男孩和一只小狗" },
  "has-she": { emoji: "👧 ✏️ ✏️", altZh: "女孩和两支铅笔" },
  "has-dog": { emoji: "🐕 〰️", altZh: "一只有长尾巴的狗" },
  "have-they": { emoji: "🧒 🪁 🪁 🪁 🧒", altZh: "小朋友们和三只风筝" },

  "verb-i-play": { emoji: "🧒 ⚽", altZh: "小朋友放学后踢足球" },
  "verb-she-watches": { emoji: "👧 📺", altZh: "女孩星期日看电视" },
  "verb-tom-studies": { emoji: "👦 📖", altZh: "Tom 每天学习英语" },
  "verb-dogs-run": { emoji: "🐕 💨 🐕", altZh: "几只狗跑得很快" },
  "verb-bird-flies": { emoji: "☁️ 🐦", altZh: "一只鸟在天空中飞" },
  "verb-amy-goes": { emoji: "👧 🚌 🏫", altZh: "Amy 坐公交车去学校" },

  "negative-i-am-not": { emoji: "🧒 💪", altZh: "一个精神饱满的小朋友" },
  "negative-he-isnt": { emoji: "🏠 🚫 👦", altZh: "男孩不在家" },
  "negative-they-arent": { emoji: "🧒 🍽️ 🧒", altZh: "已经吃饱的小朋友们" },
  "negative-i-dont": { emoji: "🧒 🙅 🥛", altZh: "小朋友不喜欢牛奶" },
  "negative-she-doesnt": { emoji: "👧 🙅 🍌", altZh: "女孩不喜欢香蕉" },
  "negative-cats-dont": { emoji: "📍 🚫 😴\n🐈 🐈", altZh: "几只猫不在这里睡觉" },

  "question-am-i": { emoji: "🧒 🕗 ❓", altZh: "小朋友询问自己是否迟到" },
  "question-is-he": { emoji: "👦 👦 ❓", altZh: "询问一个男孩是不是兄弟" },
  "question-are-they": { emoji: "🧒 🏫 🧒 ❓", altZh: "询问小朋友们是否在学校" },
  "question-do-we": { emoji: "📅 📘 ❓", altZh: "询问今天是否有英语课" },
  "question-does-she": { emoji: "👧 🍎 ❓", altZh: "询问女孩是否喜欢苹果" },
  "question-sort-there": { emoji: "🐈 🐈 ❓", altZh: "询问是否有两只猫" },

  "mixed-this-is": { emoji: "✋ ✏️", altZh: "手边的一支新铅笔" },
  "mixed-these-are": { emoji: "👟 👟", altZh: "近处的一双鞋" },
  "mixed-there-are": { emoji: "🌳 🧒 🧒 🧒 🧒 🧒", altZh: "公园里的五个孩子" },
  "mixed-she-has": { emoji: "👧 🪁", altZh: "女孩和一只黄色风筝" },
  "mixed-he-plays": { emoji: "👦 🏀", altZh: "男孩每天打篮球" },
  "mixed-does-she": { emoji: "👧 🐾 ❓", altZh: "询问女孩是否养了宠物" },
};

const grammarQuestionPool: GrammarQuestion[] = [
  ...pronounQuestions,
  ...beQuestions,
  ...pluralQuestions,
  ...demonstrativeQuestions,
  ...thereBeQuestions,
  ...haveHasQuestions,
  ...verbQuestions,
  ...negativeQuestions,
  ...questionQuestions,
  ...mixedQuestions,
];

export const grammarQuestions: GrammarQuestion[] = grammarQuestionPool.map((question) => {
  const visual = grammarQuestionVisuals[question.id];
  return visual ? { ...question, visual } : question;
});

export const grammarQuestionById: Record<string, GrammarQuestion> = Object.fromEntries(grammarQuestions.map((question) => [question.id, question]));

export function getGrammarQuestionsForStage(stageId: string) {
  return grammarQuestions.filter((question) => question.stageId === stageId);
}
