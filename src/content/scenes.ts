import type { SceneAsset } from "@/features/assessment/types";

export const scenes: SceneAsset[] = [
  {
    id: "classroom-main",
    title: "Sunny Classroom",
    imageSrc: "/content/scenes/classroom.webp",
    alt: "A bright classroom with a teacher, students, desks, school things and a cat under a desk",
    kind: "classroom",
    hotspots: [
      { id: "teacher", x: 43, y: 15, width: 14, height: 28, label: "teacher", pronunciationWord: "teacher", emoji: "🧑‍🏫" },
      { id: "student-one", x: 19, y: 42, width: 13, height: 24, label: "student", pronunciationWord: "student", emoji: "👧" },
      { id: "student-two", x: 67, y: 42, width: 13, height: 24, label: "student", pronunciationWord: "student", emoji: "👦" },
      { id: "desk", x: 33, y: 52, width: 34, height: 22, label: "desk", pronunciationWord: "desk", emoji: "🪑" },
      { id: "book", x: 42, y: 48, width: 10, height: 10, label: "book", pronunciationWord: "book", emoji: "📘" },
      { id: "pencil", x: 54, y: 49, width: 9, height: 8, label: "pencil", pronunciationWord: "pencil", emoji: "✏️" },
      { id: "ruler", x: 33, y: 48, width: 8, height: 8, label: "ruler", pronunciationWord: "ruler", emoji: "📏" },
      { id: "schoolbag-one", x: 16, y: 70, width: 12, height: 16, label: "schoolbag", pronunciationWord: "schoolbag", emoji: "🎒" },
      { id: "schoolbag-two", x: 71, y: 70, width: 12, height: 16, label: "schoolbag", pronunciationWord: "schoolbag", emoji: "🎒" },
      { id: "clock", x: 47, y: 4, width: 8, height: 12, label: "clock", pronunciationWord: "clock", emoji: "🕘" },
      { id: "window", x: 72, y: 11, width: 20, height: 25, label: "window", pronunciationWord: "window", emoji: "🪟" },
      { id: "door", x: 5, y: 18, width: 13, height: 46, label: "door", pronunciationWord: "door", emoji: "🚪" },
      { id: "cat", x: 45, y: 74, width: 12, height: 15, label: "cat under the desk", pronunciationWord: "cat", emoji: "🐱" },
      { id: "sun", x: 77, y: 13, width: 7, height: 9, label: "sun", pronunciationWord: "sun", emoji: "☀️" },
      { id: "tree", x: 84, y: 20, width: 9, height: 18, label: "tree", pronunciationWord: "tree", emoji: "🌳" },
    ],
  },
  {
    id: "park-main",
    title: "Happy Park",
    imageSrc: "/content/scenes/park.webp",
    alt: "A sunny park with children, a dog, birds, a pond, flowers and a boy riding a bicycle",
    kind: "park",
    hotspots: [
      { id: "boy-bike", x: 26, y: 45, width: 20, height: 28, label: "boy riding a bicycle", pronunciationWord: "bicycle", emoji: "🚴" },
      { id: "girl", x: 60, y: 44, width: 12, height: 25, label: "girl", pronunciationWord: "girl", emoji: "👧" },
      { id: "dog", x: 73, y: 61, width: 13, height: 18, label: "dog", pronunciationWord: "dog", emoji: "🐶" },
      { id: "bird-one", x: 20, y: 16, width: 8, height: 9, label: "bird", pronunciationWord: "bird", emoji: "🐦" },
      { id: "bird-two", x: 32, y: 11, width: 8, height: 9, label: "bird", pronunciationWord: "bird", emoji: "🐦" },
      { id: "ball", x: 51, y: 72, width: 9, height: 11, label: "ball", pronunciationWord: "ball", emoji: "⚽" },
      { id: "bench", x: 7, y: 63, width: 18, height: 15, label: "bench", pronunciationWord: "bench", emoji: "🪑" },
      { id: "pond", x: 68, y: 78, width: 27, height: 16, label: "pond", pronunciationWord: "pond", emoji: "💧" },
      { id: "fish", x: 78, y: 82, width: 9, height: 9, label: "fish", pronunciationWord: "fish", emoji: "🐟" },
      { id: "sun", x: 82, y: 7, width: 10, height: 13, label: "sun", pronunciationWord: "sun", emoji: "☀️" },
      { id: "tree-one", x: 5, y: 21, width: 18, height: 38, label: "tree", pronunciationWord: "tree", emoji: "🌳" },
      { id: "flowers", x: 47, y: 82, width: 14, height: 10, label: "flowers", pronunciationWord: "flower", emoji: "🌼" },
    ],
  },
];

export const sceneById = Object.fromEntries(scenes.map((scene) => [scene.id, scene]));
