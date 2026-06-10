// 语音播放工具函数

// 检查浏览器是否支持语音合成
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// 缓存英语语音
let cachedVoice: SpeechSynthesisVoice | null = null;

// 获取英语语音（同步，使用缓存）
function getEnglishVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  cachedVoice =
    voices.find((v) => v.lang.startsWith("en") && v.name.includes("English")) ||
    voices.find((v) => v.lang.startsWith("en") && v.name.includes("US")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null;
  return cachedVoice;
}

// 页面加载时预加载语音列表（移动端需要）
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null; // 重新加载时清除缓存
  };
}

// 播放英语单词发音（必须同步调用，移动端要求在用户手势内直接调用 speak）
export function speakWord(word: string): void {
  if (!isSpeechSupported()) return;

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
