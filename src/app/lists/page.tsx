"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStudyStore } from "@/lib/store";
import { TOTAL_LISTS } from "@/types";
import { differenceInDays, format } from "date-fns";

type ListStatus = "pending" | "learning" | "completed";

export default function ListsPage() {
  const { startDate, listProgress } = useStudyStore();
  const [mounted, setMounted] = useState(false);
  const [lists, setLists] = useState<{ num: number; status: ListStatus }[]>([]);

  // 如果没有设置开始日期，默认使用今天
  const effectiveStartDate = startDate || format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    setMounted(true);

    const studyStartDate = new Date(effectiveStartDate);
    const daysSinceStart = differenceInDays(new Date(), studyStartDate);
    const isStarted = daysSinceStart >= 0;
    const day = isStarted ? daysSinceStart + 1 : 0;
    const learnedLists = isStarted ? (day - 1) * 2 : 0;

    setLists(Array.from({ length: TOTAL_LISTS }).map((_, i) => {
      const num = i + 1;
      // 优先使用 store 中的实际进度
      const progress = listProgress[num];
      if (progress?.status === "completed") {
        return { num, status: "completed" as ListStatus };
      }
      if (progress?.status === "learning") {
        return { num, status: "learning" as ListStatus };
      }
      // 否则根据日期计算
      const status: ListStatus = num <= learnedLists ? "completed" : num <= learnedLists + 2 && isStarted ? "learning" : "pending";
      return { num, status };
    }));
  }, [effectiveStartDate, listProgress]);

  if (!mounted) return <Loading />;

  const completed = lists.filter(l => l.status === "completed").length;
  const learning = lists.filter(l => l.status === "learning").length;
  const pending = TOTAL_LISTS - completed - learning;

  return (
    <div style={pageStyle}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <Link href="/" style={backBtnStyle}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h1 style={titleStyle}>全部 List</h1>
          <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>{completed}/{TOTAL_LISTS}</span>
        </div>
      </header>

      <main style={mainStyle}>
        {/* 统计 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { value: completed, label: '已完成', color: '#16a34a' },
            { value: learning, label: '进行中', color: '#0ea5e9' },
            { value: pending, label: '未开始', color: '#94a3b8' },
          ].map((item, i) => (
            <div key={i} style={cardStyle}>
              <p style={{ fontSize: 28, fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* List 网格 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {lists.map(list => {
            const isDone = list.status === "completed";
            const isLearning = list.status === "learning";
            return (
              <Link
                key={list.num}
                href={isDone ? `/review/${list.num}` : `/learn/${list.num}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '16px 8px', borderRadius: 16, textDecoration: 'none', position: 'relative',
                  background: isDone ? 'linear-gradient(135deg, #4ade80, #16a34a)' : isLearning ? 'linear-gradient(135deg, #38bdf8, #2563eb)' : 'white',
                  color: isDone || isLearning ? 'white' : '#334155',
                  boxShadow: isDone ? '0 4px 12px rgba(22,163,74,0.2)' : isLearning ? '0 4px 12px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
                  border: isDone || isLearning ? 'none' : '1px solid #f1f5f9',
                  minHeight: 72,
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700 }}>{list.num}</span>
                {isDone && (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.8)" strokeWidth={3} style={{ marginTop: 4 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {isLearning && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>学习中</span>}
                {!isDone && !isLearning && <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>90词</span>}
              </Link>
            );
          })}
        </div>
      </main>

      <BottomNav active="lists" />
    </div>
  );
}

function Loading() {
  return (
    <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 28, height: 28, border: '2.5px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function BottomNav({ active }: { active: string }) {
  const items = [
    { href: '/', label: '首页', key: 'home', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
    { href: '/schedule', label: '计划表', key: 'schedule', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z' },
    { href: '/lists', label: 'List', key: 'lists', icon: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
    { href: '/stats', label: '统计', key: 'stats', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
  ];
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.06)', paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0 4px' }}>
        {items.map(item => (
          <Link key={item.key} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 16px', textDecoration: 'none', color: item.key === active ? '#0ea5e9' : '#94a3b8', minWidth: 64 }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={item.key === active ? 2 : 1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span style={{ fontSize: 10, marginTop: 3, fontWeight: item.key === active ? 600 : 400 }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
const headerStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)' };
const headerInnerStyle: React.CSSProperties = { padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const backBtnStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#374151' };
const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 };
const mainStyle: React.CSSProperties = { padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 };
const cardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: 16, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
