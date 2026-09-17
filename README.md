# CogCanvas — 认知科学驱动的创造力画布

一个以无限画布为核心、内置认知科学触发机制的创意辅助工具。<br>
画布不仅是记录空间，更会主动提供打破思维定式的刺激。

## 功能

1. **发散记录**：无限画布外部化工作记忆，双击创建节点、拖拽连线，先发散不评判
2. **认知触发**：选中节点“抽卡”，5 类认知科学触发卡打破功能固着
3. **收敛聚拢**：切换 Converge 模式后，用 TF-IDF 相似度发现并聚拢想法群
4. **评估筛选**：为想法打“可行性/主题”标签，看板自动分组
5. **精选导出**：勾选精选想法，一键导出 Markdown 交付
6. **长文编辑**：双击便签进入独立编辑页，正文跟随画布同步保存
7. **后端数据存储**：画布、用户创作记忆与素材库统一由 Node 服务持久化，同时保留 IndexedDB 离线副本
8. **RAG 记忆检索**：节点长文、记忆与素材统一进入语义索引；未配置模型时自动使用本地稀疏检索

## 运行

```bash
npm install
npm run dev
```

前端运行于 `http://localhost:5173`，数据与 RAG API 运行于 `http://localhost:8787`。持久化文件会在首次保存后生成于 `server/data/`。

主要接口：`/api/projects`、`/api/materials`、`/api/memories`、`/api/rag/search`。

## Embedding 配置

复制 `.env.example` 为 `.env`，填写 OpenAI 或其他 OpenAI 兼容服务的密钥：

```bash
EMBEDDING_API_KEY=your_api_key
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

重启 `npm run dev` 后，新增或编辑节点会自动更新语义向量。画布左下角的 `Search Memory` 会优先使用 Embedding 检索。
