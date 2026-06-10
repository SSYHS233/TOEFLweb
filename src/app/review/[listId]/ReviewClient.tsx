"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function ReviewPage() {
  const params = useParams();
  const listId = parseInt(params.listId as string);

  const { updateWordProgress, updateUserStats, userStats } = useStudyStore();

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const listWords = (wordsData as Word[]).filter(w => w.listNumber === listId);
    setWords(listWords);
  }, [listId]);

  const currentWord = words[currentIndex];
  const totalWords = words.length;

  const handleFamiliarity = useCallback((familiarity: Familiarity) => {
    if (!currentWord) return;

    // 保存复习进度
    const wordId = `${listId}-${currentIndex}`;
    updateWordProgress(wordId, {
      wordId,
      familiarity,
      lastReviewed: new Date(),
      nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后复习
      reviewCount: 2,
    });

    // 使用函数式更新确保获取最新值
    const currentStats = useStudyStore.getState().userStats;
    useStudyStore.getState().updateUserStats({
      todayReviewed: (currentStats.todayReviewed || 0) + 1,
      totalMinutes: Math.floor((Date.now() - startTime) / 60000),
      lastStudyDate: new Date().toDateString(),
      // 如果是第一次学习，设置 streakDays 为 1
      streakDays: currentStats.lastStudyDate ? currentStats.streakDays : 1,
    });

    console.log(`✅ 复习: ${currentWord.word} = ${familiarity === 0 ? '不认识' : familiarity === 1 ? '模糊' : '认识'}`);

    if (currentIndex < words.length - 1) {
      setShowAnswer(false);
      setIsRevealed(false);
      setCurrentIndex(prev => prev + 1);
      setProgress(((currentIndex + 1) / words.length) * 100);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, currentWord, words.length, listId, updateWordProgress, startTime]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        if (!isRevealed) {
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
  }, [isRevealed, handleFamiliarity]);

  if (words.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 28, height: 28, border: '2.5px solid #e2e8f0', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>复习完成！</h1>
          <p style={{ fontSize: 15, color: '#64748b', marginBottom: 32 }}>太棒了！你已完成 List {listId} 的全部复习</p>
          <Link href="/" style={{
            display: 'block', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
            color: 'white', borderRadius: 16, padding: 16, textAlign: 'center',
            textDecoration: 'none', fontWeight: 600, fontSize: 16, maxWidth: 300, margin: '0 auto',
          }}>返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* 顶部进度 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#374151' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{currentIndex + 1} / {totalWords}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f97316' }}>复习 L{listId}</span>
        </div>
        <div style={{ height: 6, background: '#f1f5f9' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #fb923c, #ea580c)', borderRadius: 3, width: `${progress}%`, transition: 'width 0.3s' }} />
        </div>
      </header>

      {/* 单词卡片 */}
      <main
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer' }}
        onClick={() => {
          if (!isRevealed) {
            setShowAnswer(true);
            setIsRevealed(true);
          }
        }}
      >
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 16 }}>
            {currentWord.word}
          </h1>

          {/* 语音播放按钮 */}
          {isSpeechSupported() && (
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
          )}

          {showAnswer && (
            <div>
              {currentWord.phonetic && (
                <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 12 }}>{currentWord.phonetic}</p>
              )}
              <p style={{ fontSize: 20, color: '#334155', lineHeight: 1.6 }}>
                {currentWord.meaning}
              </p>
            </div>
          )}

          {!isRevealed && (
            <p style={{ fontSize: 14, color: '#cbd5e1', marginTop: 32 }}>点击屏幕或按空格显示答案</p>
          )}
        </div>
      </main>

      {/* 底部按钮 */}
      {isRevealed && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(to top, #f8fafc 80%, transparent)',
        }}>
          <div style={{ display: 'flex', gap: 12, maxWidth: 400, margin: '0 auto' }}>
            <button onClick={() => handleFamiliarity(0)} style={{
              flex: 1, padding: 16, background: '#fef2f2', color: '#dc2626',
              borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}>不认识</button>
            <button onClick={() => handleFamiliarity(1)} style={{
              flex: 1, padding: 16, background: '#fffbeb', color: '#d97706',
              borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}>模糊</button>
            <button onClick={() => handleFamiliarity(2)} style={{
              flex: 1, padding: 16, background: '#f0fdf4', color: '#16a34a',
              borderRadius: 16, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}>认识</button>
          </div>
        </div>
      )}
    </div>
  );
}
