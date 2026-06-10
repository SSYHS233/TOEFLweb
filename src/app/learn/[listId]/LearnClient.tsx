"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStudyStore } from "@/lib/store";
import { speakWord, speakSentence, stopSpeaking, isSpeechSupported } from "@/lib/speech";
import wordsData from "@/data/toefl_words.json";

interface Word {
  word: string;
  phonetic: string;
  meaning: string;
  root: string;
  mnemonic: string;
  example: string;
  listNumber: number;
}

type Familiarity = 0 | 1 | 2;
type Phase = "learn" | "quick-review" | "total-review" | "complete";

const GROUP_SIZE = 10; // 每组10个单词（约5分钟）
const TIMER_MINUTES = 5; // 5分钟倒计时

export default function LearnPage() {
  const params = useParams();
  const listId = parseInt(params.listId as string);

  const { updateWordProgress, updateListProgress, updateUserStats, userStats } = useStudyStore();

  const [words, setWords] = useState<Word[]>([]);
  const [phase, setPhase] = useState<Phase>("learn");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [groupIndex, setGroupIndex] = useState(0);

  // 倒计时相关
  const [timeLeft, setTimeLeft] = useState(TIMER_MINUTES * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 复习相关
  const [reviewWords, setReviewWords] = useState<{ word: Word; familiarity: Familiarity }[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [totalReviewWords, setTotalReviewWords] = useState<{ word: Word; familiarity: Familiarity }[]>([]);

  // 统计
  const [groupsCompleted, setGroupsCompleted] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const listWords = (wordsData as Word[]).filter(w => w.listNumber === listId);
    setWords(listWords);
  }, [listId]);

  // 计算当前组的单词
  const currentGroupStart = groupIndex * GROUP_SIZE;
  const currentGroupEnd = Math.min(currentGroupStart + GROUP_SIZE, words.length);
  const currentGroupWords = words.slice(currentGroupStart, currentGroupEnd);
  const currentWord = currentGroupWords[currentIndex];
  const totalGroups = Math.ceil(words.length / GROUP_SIZE);

  // 倒计时
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // 时间到，自动进入复习
            setIsTimerRunning(false);
            handleGroupComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  // 开始计时
  const startTimer = () => {
    setTimeLeft(TIMER_MINUTES * 60);
    setIsTimerRunning(true);
    // 标记List为学习中
    updateListProgress(listId, {
      listId,
      status: "learning",
      wordsLearned: 0,
      wordsMastered: 0,
    });
  };

  // 一组学完
  const handleGroupComplete = useCallback(() => {
    setIsTimerRunning(false);
    setPhase("quick-review");
    setReviewIndex(0);
  }, []);

  // 处理熟悉度选择
  const handleFamiliarity = useCallback((familiarity: Familiarity) => {
    if (!currentWord) return;

    // 保存到复习列表
    setReviewWords(prev => [...prev, { word: currentWord, familiarity }]);
    setTotalReviewWords(prev => [...prev, { word: currentWord, familiarity }]);

    // 保存进度
    const wordId = `${listId}-${currentGroupStart + currentIndex}`;
    updateWordProgress(wordId, {
      wordId,
      familiarity,
      lastReviewed: new Date(),
      nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
      reviewCount: 1,
    });

    // 使用函数式更新确保获取最新值
    const currentStats = useStudyStore.getState().userStats;
    useStudyStore.getState().updateUserStats({
      todayLearned: (currentStats.todayLearned || 0) + 1,
      lastStudyDate: new Date().toDateString(),
      // 如果是第一次学习，设置 streakDays 为 1
      streakDays: currentStats.lastStudyDate ? currentStats.streakDays : 1,
    });

    if (currentIndex < currentGroupWords.length - 1) {
      // 继续当前组
      setShowAnswer(false);
      setIsRevealed(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      // 当前组完成
      handleGroupComplete();
    }
  }, [currentIndex, currentWord, currentGroupWords.length, listId, currentGroupStart, updateWordProgress, handleGroupComplete]);

  // 快速复习完成
  const handleQuickReviewComplete = useCallback(() => {
    setGroupsCompleted(prev => prev + 1);
    setReviewWords([]);

    if (groupIndex < totalGroups - 1) {
      // 还有下一组
      if (groupsCompleted >= 3) {
        // 学完4组，提示总复习
        setPhase("total-review");
      } else {
        // 继续下一组
        setGroupIndex(prev => prev + 1);
        setCurrentIndex(0);
        setPhase("learn");
        startTimer();
      }
    } else {
      // 所有组完成
      setPhase("total-review");
    }
  }, [groupIndex, totalGroups, groupsCompleted]);

  // 总复习完成
  const handleTotalReviewComplete = useCallback(() => {
    updateListProgress(listId, {
      listId,
      status: "completed",
      wordsLearned: words.length,
      wordsMastered: words.length,
    });
    setPhase("complete");
  }, [listId, words.length, updateListProgress]);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        if (!isRevealed && phase === "learn") {
          setShowAnswer(true);
          setIsRevealed(true);
        }
      } else if (e.key === "1" && isRevealed) {
        handleFamiliarity(0);
      } else if (e.key === "2" && isRevealed) {
        handleFamiliarity(1);
      } else if (e.key === "3" && isRevealed) {
        handleFamiliarity(2);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, phase, handleFamiliarity]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 进度百分比
  const progress = phase === "learn"
    ? ((currentGroupStart + currentIndex) / words.length) * 100
    : phase === "quick-review"
    ? ((currentGroupStart + currentGroupWords.length) / words.length) * 100
    : 100;

  // ===== 学习完成 =====
  if (phase === "complete") {
    const totalMinutes = Math.floor((Date.now() - startTime) / 60000);
    return (
      <div style={completePageStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>List {listId} 完成！</h1>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 8 }}>用时 {totalMinutes} 分钟</p>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32 }}>完成 {groupsCompleted} 组学习 + 复习</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
            <Link href="/" style={primaryBtnStyle}>返回首页</Link>
            <Link href={`/review/${listId}`} style={secondaryBtnStyle}>再次复习</Link>
          </div>
        </div>
      </div>
    );
  }

  // ===== 总复习 =====
  if (phase === "total-review") {
    return (
      <div style={pageStyle}>
        <header style={headerStyle}>
          <div style={headerInnerStyle}>
            <Link href="/" style={backBtnStyle}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#7c3aed' }}>📖 总复习</span>
            <div style={{ width: 40 }} />
          </div>
        </header>
        <main style={{ ...mainStyle, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📖</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>30分钟总复习</h2>
            <p style={{ fontSize: 15, color: '#64748b' }}>回顾今天学过的所有单词</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>共 {totalReviewWords.length} 个单词</p>
          </div>
          <button onClick={handleTotalReviewComplete} style={{
            ...primaryBtnStyle,
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)',
          }}>
            开始总复习
          </button>
          <button onClick={handleTotalReviewComplete} style={{ ...secondaryBtnStyle, marginTop: 12 }}>
            跳过，直接完成
          </button>
        </main>
      </div>
    );
  }

  // ===== 快速复习 =====
  if (phase === "quick-review") {
    const reviewWord = reviewWords[reviewIndex];
    return (
      <div style={pageStyle}>
        <header style={headerStyle}>
          <div style={headerInnerStyle}>
            <Link href="/" style={backBtnStyle}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#f97316' }}>⚡ 快速复习</span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{reviewIndex + 1}/{reviewWords.length}</span>
          </div>
        </header>
        <main style={{ ...mainStyle, justifyContent: 'center', alignItems: 'center' }}>
          {reviewWord && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
              <h1 style={{ fontSize: 56, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>{reviewWord.word.word}</h1>
              <p style={{ fontSize: 18, color: '#64748b', marginBottom: 8 }}>{reviewWord.word.phonetic}</p>
              <p style={{ fontSize: 22, color: '#334155', marginBottom: 32 }}>{reviewWord.word.meaning}</p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => {
                  if (reviewIndex < reviewWords.length - 1) {
                    setReviewIndex(prev => prev + 1);
                  } else {
                    handleQuickReviewComplete();
                  }
                }} style={{ ...smallBtnStyle, background: '#fef2f2', color: '#dc2626' }}>
                  还是不会
                </button>
                <button onClick={() => {
                  if (reviewIndex < reviewWords.length - 1) {
                    setReviewIndex(prev => prev + 1);
                  } else {
                    handleQuickReviewComplete();
                  }
                }} style={{ ...smallBtnStyle, background: '#f0fdf4', color: '#16a34a' }}>
                  记住了
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ===== 学习模式 =====
  if (!currentWord) return <div style={pageStyle}><div style={loadingStyle} /></div>;

  return (
    <div style={pageStyle}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>

      {/* 顶部 */}
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <Link href="/" style={backBtnStyle}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>第 {groupIndex + 1}/{totalGroups} 组</span>
            <div style={{ fontSize: 20, fontWeight: 700, color: timeLeft < 60 ? '#ef4444' : '#0f172a' }}>
              {formatTime(timeLeft)}
            </div>
          </div>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{currentIndex + 1}/{currentGroupWords.length}</span>
        </div>
        <div style={{ height: 6, background: '#f1f5f9' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #38bdf8, #2563eb)', borderRadius: 3, width: `${progress}%`, transition: 'width 0.3s' }} />
        </div>
      </header>

      {/* 倒计时提示 */}
      {!isTimerRunning && timeLeft === TIMER_MINUTES * 60 && (
        <div style={{ padding: '0 16px' }}>
          <button onClick={startTimer} style={{
            width: '100%', padding: 16, background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
            color: 'white', borderRadius: 16, fontSize: 16, fontWeight: 600,
            border: 'none', cursor: 'pointer', marginBottom: 16,
          }}>
            ▶️ 开始 5 分钟学习
          </button>
        </div>
      )}

      {/* 单词卡片 */}
      <main
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer' }}
        onClick={() => {
          if (!isRevealed) {
            setShowAnswer(true);
            setIsRevealed(true);
            if (!isTimerRunning && timeLeft > 0) setIsTimerRunning(true);
          }
        }}
      >
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <h1 style={{ fontSize: 52, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 16 }}>
            {currentWord.word}
          </h1>

          {/* 语音播放按钮 */}
          <button
              onClick={(e) => {
                e.stopPropagation();
                speakWord(currentWord.word);
              }}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="播放发音"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </button>

          {showAnswer && (
            <div>
              {currentWord.phonetic && <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 12 }}>{currentWord.phonetic}</p>}
              <p style={{ fontSize: 22, color: '#334155', lineHeight: 1.6, marginBottom: 16 }}>{currentWord.meaning}</p>
              {currentWord.example && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <p style={{ fontSize: 14, color: '#94a3b8', fontStyle: 'italic' }}>{currentWord.example}</p>
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakSentence(currentWord.example);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        color: '#94a3b8',
                        transition: 'color 0.2s',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = '#8b5cf6';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                      title="播放例句发音"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                    </button>
                </div>
              )}
            </div>
          )}

          {!isRevealed && (
            <p style={{ fontSize: 14, color: '#cbd5e1', marginTop: 32 }}>点击屏幕或按空格显示答案</p>
          )}
        </div>
      </main>

      {/* 底部按钮 */}
      {isRevealed && (
        <div style={bottomBtnContainer}>
          <div style={{ display: 'flex', gap: 12, maxWidth: 400, margin: '0 auto' }}>
            <button onClick={() => handleFamiliarity(0)} style={{ ...actionBtnStyle, background: '#fef2f2', color: '#dc2626' }}>
              <span style={{ fontSize: 20, marginBottom: 4 }}>😣</span>
              不认识
            </button>
            <button onClick={() => handleFamiliarity(1)} style={{ ...actionBtnStyle, background: '#fffbeb', color: '#d97706' }}>
              <span style={{ fontSize: 20, marginBottom: 4 }}>🤔</span>
              模糊
            </button>
            <button onClick={() => handleFamiliarity(2)} style={{ ...actionBtnStyle, background: '#f0fdf4', color: '#16a34a' }}>
              <span style={{ fontSize: 20, marginBottom: 4 }}>😊</span>
              认识
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const pageStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
};
const completePageStyle: React.CSSProperties = {
  ...pageStyle, alignItems: 'center', justifyContent: 'center', padding: 24,
};
const headerStyle: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 50,
  background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(0,0,0,0.06)',
};
const headerInnerStyle: React.CSSProperties = {
  padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};
const backBtnStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#374151',
};
const mainStyle: React.CSSProperties = {
  flex: 1, padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16,
};
const primaryBtnStyle: React.CSSProperties = {
  display: 'block', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
  color: 'white', borderRadius: 16, padding: 16, textAlign: 'center',
  textDecoration: 'none', fontWeight: 600, fontSize: 16,
};
const secondaryBtnStyle: React.CSSProperties = {
  display: 'block', background: '#f1f5f9',
  color: '#334155', borderRadius: 16, padding: 16, textAlign: 'center',
  textDecoration: 'none', fontWeight: 600, fontSize: 16,
};
const smallBtnStyle: React.CSSProperties = {
  padding: '12px 24px', borderRadius: 14, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
};
const actionBtnStyle: React.CSSProperties = {
  flex: 1, padding: '14px 8px', borderRadius: 16, fontSize: 15, fontWeight: 600,
  border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
};
const bottomBtnContainer: React.CSSProperties = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
  background: 'linear-gradient(to top, #f8fafc 80%, transparent)',
};
const loadingStyle: React.CSSProperties = {
  width: 28, height: 28, border: '2.5px solid #e2e8f0', borderTopColor: '#0ea5e9',
  borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: 'auto',
};
