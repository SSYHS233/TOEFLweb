// 语音播放工具函数

// 检查浏览器是否支持语音合成
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// 获取英语语音（支持异步加载）
function getEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.startsWith("en") && voice.name.includes("English")) ||
    voices.find((voice) => voice.lang.startsWith("en") && voice.name.includes("US")) ||
    voices.find((voice) => voice.lang.startsWith("en")) ||
    null
  );
}

// 初始化语音引擎（处理移动端异步加载）
let voicesLoaded = false;
let voices: SpeechSynthesisVoice[] = [];

function initVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (voicesLoaded) {
      resolve();
      return;
    }

    const loadVoices = () => {
      voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoaded = true;
        resolve();
      }
    };

    // 立即尝试加载
    loadVoices();

    // 监听语音加载事件（移动端需要）
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // 超时保护
    setTimeout(() => {
      if (!voicesLoaded) {
        voicesLoaded = true;
        resolve();
      }
    }, 1000);
  });
}

// 播放英语单词发音
export async function speakWord(word: string): Promise<void> {
  if (!isSpeechSupported()) {
    console.warn("浏览器不支持语音合成");
    return;
  }

  // 确保语音已加载
  await initVoices();

  // 取消之前的播放
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  // 尝试使用英语语音
  const englishVoice = getEnglishVoice();
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.speak(utterance);
}

// 播放例句发音
export async function speakSentence(sentence: string): Promise<void> {
  if (!isSpeechSupported()) {
    console.warn("浏览器不支持语音合成");
    return;
  }

  // 确保语音已加载
  await initVoices();

  // 取消之前的播放
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.lang = "en-US";
  utterance.rate = 0.8;
  utterance.pitch = 1;
  utterance.volume = 1;

  const englishVoice = getEnglishVoice();
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.speak(utterance);
}

// 停止播放
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
