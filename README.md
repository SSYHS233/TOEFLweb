# TOEFL 词汇艾宾浩斯背单词网站

基于墨墨背单词风格，遵守刘晓艳艾宾浩斯背单词法。

## 学习计划

- 开始日期：2026-06-14
- 结束日期：2026-08-05
- 共48个List，每天新学2个List

## 技术栈

- Next.js 15
- TypeScript
- TailwindCSS
- Prisma + SQLite
- Framer Motion
- PWA

## 快速开始

```bash
# 安装依赖
npm install

# 初始化数据库
npm run db:push

# 填充示例数据
npm run db:seed

# 启动开发服务器
npm run dev
```

## 项目结构

```
toefl-app/
├── prisma/
│   └── schema.prisma    # 数据库模型
├── src/
│   ├── app/            # Next.js App Router 页面
│   │   ├── page.tsx    # 首页
│   │   ├── learn/      # 学习页面
│   │   ├── review/     # 复习页面
│   │   ├── lists/      # List列表
│   │   ├── schedule/   # 计划表
│   │   └── stats/      # 统计
│   ├── components/     # 组件
│   ├── hooks/         # 自定义hooks
│   ├── lib/           # 工具函数
│   └── types/          # 类型定义
└── public/            # 静态资源
```

## 功能

- [x] 首页 - 显示今日任务
- [x] 学习模式 - 墨墨背单词风格
- [x] 计划表 - 艾宾浩斯排程
- [x] 统计页 - 学习进度可视化
- [x] List管理 - 48个List总览
- [ ] PWA支持
- [ ] 真实词汇数据导入
- [ ] 遗忘率分析

## 学习流程

1. 每组8-12个单词，约5分钟
2. 新学 → 即时复习 → 新学下一组 → 即时复习...
3. 完成整个List后进入总复习
4. 晚间自动出现复习任务
5. 艾宾浩斯长期复习节点：1-3-7-15-30-60天
