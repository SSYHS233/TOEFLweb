// 语音播放工具函数

// 检查浏览器是否支持语音合成
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// 页面加载时预加载语音列表（安卓需要）
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
}

// 当前播放的音频（用于停止）
let currentAudio: HTMLAudioElement | null = null;

// 使用 Google Translate TTS 作为兜底
function playWithGoogleTTS(text: string, lang = "en"): void {
  // 停止之前的播放
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
  const audio = new Audio(url);
  currentAudio = audio;
  audio.play().catch(() => {
    // 静默失败，某些浏览器可能阻止自动播放
  });
}

// 播放英语单词发音
export function speakWord(word: string): void {
  // 优先使用 Web Speech API
  if (isSpeechSupported()) {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("English")) ||
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("US")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    if (englishVoice) utterance.voice = englishVoice;

    window.speechSynthesis.speak(utterance);
  } else {
    // 兜底：使用 Google Translate TTS
    playWithGoogleTTS(word, "en");
  }
}

// 播放例句发音
export function speakSentence(sentence: string): void {
  if (isSpeechSupported()) {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("English")) ||
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("US")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    if (englishVoice) utterance.voice = englishVoice;

    window.speechSynthesis.speak(utterance);
  } else {
    playWithGoogleTTS(sentence, "en");
  }
}

// 停止播放
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}
