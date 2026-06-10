// 翻译工具函数

// 缓存已翻译的内容
const translationCache = new Map<string, string>();

// 翻译英文到中文（使用免费 API）
export async function translateToChinese(text: string): Promise<string> {
  if (!text.trim()) return "";

  // 检查缓存
  const cacheKey = text.toLowerCase().trim();
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // 使用 MyMemory 免费翻译 API
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      // 缓存翻译结果
      translationCache.set(cacheKey, translated);
      return translated;
    }
  } catch (error) {
    // 翻译失败，返回空字符串
    console.warn("翻译失败:", error);
  }

  return "";
}
