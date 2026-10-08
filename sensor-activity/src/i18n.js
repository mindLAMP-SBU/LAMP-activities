import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Only the shared chrome strings (header title, modals) live here. Add this
// activity's own keys to every locale as the activity is built out; GAME and
// INSTRUCTIONS are English-only placeholders until then and fall back to en-US.
const resources = {
  "en-US": {
    translation: {
      GAME: "Sensor Activity",
      INSTRUCTIONS: "Instructions go here.",
      GAME_OVER: "Game Over",
      Instructions: "Instructions",
      Start: "Start",
      Questionnaire: "Questionnaire",
      Submit: "Submit",
      "How clear were the instructions?": "How clear were the instructions?",
      "How happy would you be to do this again?": "How happy would you be to do this again?",
    },
  },
  "da-DK": {
    translation: {
      GAME_OVER: "Spillet er slut",
      Instructions: "Instruktioner",
      Start: "Start",
      Questionnaire: "Spørgeskema",
      Submit: "Indsend",
      "How clear were the instructions?": "Hvor klare var instruktionerne?",
      "How happy would you be to do this again?": "Hvor glad ville du være for at gøre dette igen?",
    },
  },
  "de-DE": {
    translation: {
      GAME_OVER: "Spiel vorbei",
      Instructions: "Anweisungen",
      Start: "Start",
      Questionnaire: "Fragebogen",
      Submit: "Absenden",
      "How clear were the instructions?": "Wie klar waren die Anweisungen?",
      "How happy would you be to do this again?": "Wie gerne würden Sie das noch einmal machen?",
    },
  },
  "es-ES": {
    translation: {
      GAME_OVER: "Juego terminado",
      Instructions: "Instrucciones",
      Start: "Comenzar",
      Questionnaire: "Cuestionario",
      Submit: "Enviar",
      "How clear were the instructions?": "¿Qué tan claras fueron las instrucciones?",
      "How happy would you be to do this again?": "¿Qué tan contento estarías de hacer esto de nuevo?",
    },
  },
  "fr-FR": {
    translation: {
      GAME_OVER: "Partie terminée",
      Instructions: "Instructions",
      Start: "Commencer",
      Questionnaire: "Questionnaire",
      Submit: "Soumettre",
      "How clear were the instructions?": "Les instructions étaient-elles claires ?",
      "How happy would you be to do this again?": "Seriez-vous heureux de refaire cela ?",
    },
  },
  "hi-IN": {
    translation: {
      GAME_OVER: "खेल खत्म",
      Instructions: "निर्देश",
      Start: "शुरू",
      Questionnaire: "प्रश्नावली",
      Submit: "जमा करें",
      "How clear were the instructions?": "निर्देश कितने स्पष्ट थे?",
      "How happy would you be to do this again?": "क्या आप इसे दोबारा करना चाहेंगे?",
    },
  },
  "it-IT": {
    translation: {
      GAME_OVER: "Fine partita",
      Instructions: "Istruzioni",
      Start: "Inizia",
      Questionnaire: "Questionario",
      Submit: "Invia",
      "How clear were the instructions?": "Quanto erano chiare le istruzioni?",
      "How happy would you be to do this again?": "Quanto saresti felice di rifarlo?",
    },
  },
  "ko-KR": {
    translation: {
      GAME_OVER: "게임 종료",
      Instructions: "지침",
      Start: "시작",
      Questionnaire: "설문",
      Submit: "제출",
      "How clear were the instructions?": "지침이 얼마나 명확했습니까?",
      "How happy would you be to do this again?": "다시 하고 싶으신가요?",
    },
  },
  "zh-CN": {
    translation: {
      GAME_OVER: "游戏结束",
      Instructions: "说明",
      Start: "开始",
      Questionnaire: "问卷",
      Submit: "提交",
      "How clear were the instructions?": "说明有多清楚？",
      "How happy would you be to do this again?": "你愿意再做一次吗？",
    },
  },
  "zh-HK": {
    translation: {
      GAME_OVER: "遊戲結束",
      Instructions: "說明",
      Start: "開始",
      Questionnaire: "問卷",
      Submit: "提交",
      "How clear were the instructions?": "說明有多清楚？",
      "How happy would you be to do this again?": "你願意再做一次嗎？",
    },
  },
};

i18n.use(initReactI18next).init({
  interpolation: { escapeValue: false },
  keySeparator: false,
  nsSeparator: false,
  fallbackLng: "en-US",
  resources,
});

export default i18n;
