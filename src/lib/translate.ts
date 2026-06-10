// 翻译工具函数

// 缓存已翻译的内容
const translationCache = new Map<string, string>();

// 翻译英文到中文（使用免费 API，带超时）
export async function translateToChinese(text: string): Promise<string> {
  if (!text.trim()) return "";

  // 检查缓存
  const cacheKey = text.toLowerCase().trim();
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // 使用 MyMemory 免费翻译 API，5秒超时
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      // 缓存翻译结果
      translationCache.set(cacheKey, translated);
      return translated;
    }
  } catch {
    // 翻译失败（超时或网络错误），返回空字符串
  }

  return "";
}
