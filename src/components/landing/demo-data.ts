export type DemoWord = {
  word: string;
  phonetic: string;
  type: string;
  definition: string;
  story: string;
  storyHinglish?: string;
  narrative: string;
  narrativeHinglish?: string;
  stickmanPose: string;
  realLifeUseCase: string;
  realLifeUseCaseHinglish?: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  xp: number;
};

export type DemoAudioConfig = {
  src: string;
  timestamps: { stage: number; startMs: number; endMs: number }[];
};

export const demoWords: DemoWord[] = [
  {
    word: "ephemeral",
    phonetic: "/ɪˈfem.ər.əl/",
    type: "adjective",
    definition: "Lasting for a very short time; short-lived.",
    story: "As a child, Leo spent hours building an intricate sandcastle by the shore. He carved tiny stairs and grand towers, lost in his creation. But as evening approached, the tide rolled in. Within minutes, the waves washed away his masterpiece, leaving only smooth sand. He learned that beauty is often **ephemeral**, existing only for a fleeting moment before it disappears.",
    storyHinglish: "Bachpan mein Leo ghanto tak beach par ek sandcastle banata tha. Usne choti seedhi aur bade towers banaye. Par jaise hi shaam hui, lehre aayi aur kuch hi minutes mein uska masterpiece beh gaya, sirf ret reh gayi. Tab usne seekha ki khoobsurti aksar **ephemeral** hoti hai, sirf kuch pal ke liye rehti hai.",
    narrative: "Think of an **ephemeral** sandcastle, beautiful but quickly washed away by the tide. The stickman watches his creation fall, a reminder of things that don't last.",
    narrativeHinglish: "Socho ek **ephemeral** sandcastle ke baare mein, jo sundar toh hai par lehro se jaldi beh jata hai. Stickman apne banaye hue castle ko girte hue dekhta hai.",
    stickmanPose: "falling",
    realLifeUseCase: "When talking about a quick trend on social media: 'The popularity of this meme will be purely ephemeral.'",
    realLifeUseCaseHinglish: "Jab social media par kisi quick trend ki baat karni ho: 'Is meme ki popularity bilkul ephemeral hogi.'",
    quiz: {
      question: "Which of the following is most likely to be described as ephemeral?",
      options: [
        "A diamond ring",
        "A mountain range",
        "A rainbow",
        "A historical monument"
      ],
      correctIndex: 2,
      explanation: "A rainbow appears briefly after rain and then fades away, making it ephemeral (short-lived). The other options represent things that endure for a long time."
    },
    xp: 50
  },
  {
    word: "[Word 2]",
    phonetic: "/[placeholder]/",
    type: "adjective",
    definition: "[Pending user input for definition]",
    story: "[Pending user input for story]",
    narrative: "[Pending user input for mnemonic narrative]",
    stickmanPose: "thinking",
    realLifeUseCase: "[Pending user input for real-life use case]",
    quiz: {
      question: "[Pending quiz question]",
      options: [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      correctIndex: 0,
      explanation: "[Pending explanation]"
    },
    xp: 50
  },
  {
    word: "[Word 3]",
    phonetic: "/[placeholder]/",
    type: "adjective",
    definition: "[Pending user input for definition]",
    story: "[Pending user input for story]",
    narrative: "[Pending user input for mnemonic narrative]",
    stickmanPose: "pointing",
    realLifeUseCase: "[Pending user input for real-life use case]",
    quiz: {
      question: "[Pending quiz question]",
      options: [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      correctIndex: 0,
      explanation: "[Pending explanation]"
    },
    xp: 50
  },
  {
    word: "[Word 4]",
    phonetic: "/[placeholder]/",
    type: "adjective",
    definition: "[Pending user input for definition]",
    story: "[Pending user input for story]",
    narrative: "[Pending user input for mnemonic narrative]",
    stickmanPose: "falling",
    realLifeUseCase: "[Pending user input for real-life use case]",
    quiz: {
      question: "[Pending quiz question]",
      options: [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      correctIndex: 0,
      explanation: "[Pending explanation]"
    },
    xp: 50
  },
  {
    word: "[Word 5]",
    phonetic: "/[placeholder]/",
    type: "adjective",
    definition: "[Pending user input for definition]",
    story: "[Pending user input for story]",
    narrative: "[Pending user input for mnemonic narrative]",
    stickmanPose: "thinking",
    realLifeUseCase: "[Pending user input for real-life use case]",
    quiz: {
      question: "[Pending quiz question]",
      options: [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      correctIndex: 0,
      explanation: "[Pending explanation]"
    },
    xp: 50
  }
];
