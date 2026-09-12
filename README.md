# CogCanvas — 认知科学驱动的创造力画布

一个以无限画布为核心、内置认知科学触发机制的创意辅助工具。<br>
画布不仅是记录空间，更会主动提供打破思维定式的刺激。

## 功能

1. **发散记录**：无限画布外部化工作记忆，双击创建节点、拖拽连线，先发散不评判
2. **认知触发**：选中节点“抽卡”，5 类认知科学触发卡打破功能固着
3. **语义聚类**：TF-IDF 相似度分析，淡色块提示相近想法群，一键聚拢
4. **收敛评估**：切换收敛模式，打“可行性/主题”标签，看板自动分组
5. **精选导出**：勾选精选想法，一键导出 Markdown 交付
6. **后端数据存储**：画布数据自动同步到本地 Node 服务并写入 JSON，同时保留 IndexedDB 离线副本
7. **RAG 记忆检索**：节点保存时调用大模型 Embedding 建立语义向量索引，可在画布内检索相关想法并快速定位；未配置模型时自动使用本地稀疏检索

## 运行

```bash
npm install
npm run dev
```

前端运行于 `http://localhost:5173`，数据与 RAG API 运行于 `http://localhost:8787`。持久化文件会在首次保存后生成于 `server/data/`。

## Embedding 配置

复制 `.env.example` 为 `.env`，填写 OpenAI 或其他 OpenAI 兼容服务的密钥：

```bash
EMBEDDING_API_KEY=your_api_key
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

重启 `npm run dev` 后，新增或编辑节点会自动更新语义向量。画布左下角的 `Search Memory` 会优先使用 Embedding 检索。
