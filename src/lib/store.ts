import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WordProgress {
  wordId: string;
  familiarity: 0 | 1 | 2;
  lastReviewed: Date;
  nextReview: Date;
  reviewCount: number;
}

interface ListProgress {
  listId: number;
  status: "pending" | "learning" | "completed" | "all_reviewed";
  wordsLearned: number;
  wordsMastered: number;
}

interface UserStats {
  streakDays: number;
  lastStudyDate: string | null;
  totalMinutes: number;
  todayLearned: number;
  todayReviewed: number;
}

interface StudyStore {
  // 单词进度
  wordProgress: Record<string, WordProgress>;
  updateWordProgress: (wordId: string, data: Partial<WordProgress>) => void;

  // List进度
  listProgress: Record<number, ListProgress>;
  updateListProgress: (listId: number, data: Partial<ListProgress>) => void;

  // 用户统计
  userStats: UserStats;
  updateUserStats: (data: Partial<UserStats>) => void;

  // 重置今日学习数据
  resetTodayStats: () => void;
}

export const useStudyStore = create<StudyStore>()(
  persist(
    (set) => ({
      wordProgress: {},
      updateWordProgress: (wordId, data) =>
        set((state) => ({
          wordProgress: {
            ...state.wordProgress,
            [wordId]: {
              ...state.wordProgress[wordId],
              ...data,
            },
          },
        })),

      listProgress: {},
      updateListProgress: (listId, data) =>
        set((state) => ({
          listProgress: {
            ...state.listProgress,
            [listId]: {
              ...state.listProgress[listId],
              ...data,
            },
          },
        })),

      userStats: {
        streakDays: 0,
        lastStudyDate: null,
        totalMinutes: 0,
        todayLearned: 0,
        todayReviewed: 0,
      },
      updateUserStats: (data) =>
        set((state) => ({
          userStats: {
            ...state.userStats,
            ...data,
          },
        })),

      resetTodayStats: () =>
        set((state) => ({
          userStats: {
            ...state.userStats,
            todayLearned: 0,
            todayReviewed: 0,
          },
        })),
    }),
    {
      name: "toefl-study-storage",
    }
  )
);
