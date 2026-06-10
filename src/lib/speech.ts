// 语音播放工具函数

// 检查浏览器是否支持语音合成
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// iOS Safari 需要在用户手势中"解锁"语音合成
let unlocked = false;

function unlockSpeech(): void {
  if (unlocked || !isSpeechSupported()) return;
  // 播放一个空的静默 utterance 来解锁
  const u = new SpeechSynthesisUtterance("");
  u.volume = 0;
  window.speechSynthesis.speak(u);
  unlocked = true;
}

// 获取英语语音
function getEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.startsWith("en") && v.name.includes("English")) ||
    voices.find((v) => v.lang.startsWith("en") && v.name.includes("US")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null
  );
}

// 播放英语单词发音
export function speakWord(word: string): void {
  if (!isSpeechSupported()) return;

  unlockSpeech();
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voice = getEnglishVoice();
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

// 播放例句发音
export function speakSentence(sentence: string): void {
  if (!isSpeechSupported()) return;

  unlockSpeech();
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.lang = "en-US";
  utterance.rate = 0.8;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voice = getEnglishVoice();
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

// 停止播放
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
