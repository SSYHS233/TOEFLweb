// 单词状态
export type WordStatus = "unlearned" | "new" | "learned" | "reviewing" | "mastered";

// 学习阶段
export type LearningPhase = "new" | "immediate" | "total" | "evening" | "ebbinghaus";

// 熟悉度
export type Familiarity = 0 | 1 | 2 | 3; // 不会 | 模糊 | 认识

// List状态
export type ListStatus = "pending" | "learning" | "completed" | "all_reviewed";

// 艾宾浩斯复习节点(天)
export const EBINGHAUS_NODES = [1, 3, 7, 15, 30, 60] as const;

// 每天新学List数
export const NEW_LISTS_PER_DAY = 2;

// 每组单词数
export const WORDS_PER_GROUP = 10;

// 每个List预估单词数
export const ESTIMATED_WORDS_PER_LIST = 90;

// 总List数
export const TOTAL_LISTS = 48;

// 计算结束日期（从开始日期起，每天2个List，共48个List需要24天新学+30天复习=54天）
export function calculateEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 53); // 54天后结束
  return endDate;
}

// 默认开始日期（今天）
export function getDefaultStartDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// 今天要学的新List
export function getTodayNewLists(dayNumber: number): number[] {
  const day = dayNumber;
  if (day < 1 || day > 48) return [];

  const lists: number[] = [];
  // 每天2个新List
  const startList = (day - 1) * 2 + 1;
  lists.push(startList);
  if (startList + 1 <= 48) {
    lists.push(startList + 1);
  }
  return lists;
}

// 根据艾宾浩斯规律计算某天应该复习的List
export function getListsForReview(dayNumber: number): number[] {
  const reviewLists: number[] = [];

  // 对于每个已经学过的List，检查是否需要复习
  for (let listNum = 1; listNum <= 48; listNum++) {
    // 计算该List的"第0天"（新学日期）
    const listLearnDay = Math.ceil(listNum / 2);

    if (dayNumber > listLearnDay) {
      // 检查艾宾浩斯节点
      const daysSinceLearn = dayNumber - listLearnDay;

      // 新学后的复习节点
      const ebbinghausNodes = [1, 2, 4, 7, 15, 30]; // 相对于新学日期

      for (const node of ebbinghausNodes) {
        if (daysSinceLearn === node) {
          reviewLists.push(listNum);
          break;
        }
      }
    }
  }

  return [...new Set(reviewLists)].sort((a, b) => a - b);
}

// 获取某个日期应该学习的List
export function getDayTask(date: Date, startDate: Date): {
  newLists: number[];
  reviewLists: number[];
  totalWords: number;
  estimatedMinutes: number;
} {
  const daysSinceStart = Math.floor(
    (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  if (daysSinceStart < 1) {
    return { newLists: [], reviewLists: [], totalWords: 0, estimatedMinutes: 0 };
  }

  const newLists = getTodayNewLists(daysSinceStart);
  const reviewLists = getListsForReview(daysSinceStart);

  const totalWords =
    newLists.length * ESTIMATED_WORDS_PER_LIST +
    reviewLists.length * ESTIMATED_WORDS_PER_LIST;

  const estimatedMinutes = Math.ceil(totalWords / 10); // 每10个词约1分钟

  return {
    newLists,
    reviewLists,
    totalWords,
    estimatedMinutes,
  };
}

// 阶段划分
export function getStudyPhase(dayNumber: number): {
  phase: 1 | 2 | 3 | 4;
  name: string;
  description: string;
} {
  if (dayNumber <= 7) {
    return { phase: 1, name: "阶段一", description: "高强度新学+复习" };
  } else if (dayNumber <= 21) {
    return { phase: 2, name: "阶段二", description: "新学+复习高峰期" };
  } else if (dayNumber <= 25) {
    return { phase: 3, name: "阶段三", description: "完成新学，进入纯复习" };
  } else {
    return { phase: 4, name: "阶段四", description: "全词库滚动复习" };
  }
}

// 计算距离计划结束的天数
export function getDaysUntilEnd(date: Date, endDate: Date): number {
  return Math.max(
    0,
    Math.ceil(
      (endDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )
  );
}
