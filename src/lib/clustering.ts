import type { CanvasNode } from '../types';

// 纯前端语义聚类：基于字符/词 n-gram 的 TF-IDF 向量 + 余弦相似度，
// 对中文友好（无需分词），无需后端或大模型。

function tokenize(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/\s+/g, '');
  const tokens: string[] = [];
  // 英文/数字按词切分
  const words = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  tokens.push(...words);
  // 中文按 2-gram
  const cjk = cleaned.replace(/[a-z0-9]+/g, '');
  for (let i = 0; i < cjk.length - 1; i++) {
    tokens.push(cjk.slice(i, i + 2));
  }
  if (cjk.length === 1) tokens.push(cjk);
  return tokens;
}

function tf(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

export interface ClusterResult {
  clusters: string[][]; // 每个簇是 nodeId 数组
}

/**
 * 返回语义相近的节点分组（每组 >= 2 个节点）。
 * threshold 为余弦相似度阈值。
 */
export function clusterNodes(
  nodes: CanvasNode[],
  threshold = 0.18
): ClusterResult {
  const valid = nodes.filter((n) => n.content.trim().length > 0);
  if (valid.length < 2) return { clusters: [] };

  const docs = valid.map((n) => tf(tokenize(n.content)));

  // idf
  const df = new Map<string, number>();
  for (const d of docs) {
    for (const term of d.keys()) df.set(term, (df.get(term) || 0) + 1);
  }
  const N = docs.length;
  const idf = new Map<string, number>();
  for (const [term, f] of df) idf.set(term, Math.log((N + 1) / (f + 1)) + 1);

  // tf-idf 向量 + 模长
  const vecs = docs.map((d) => {
    const v = new Map<string, number>();
    let norm = 0;
    for (const [term, freq] of d) {
      const w = freq * (idf.get(term) || 0);
      v.set(term, w);
      norm += w * w;
    }
    return { v, norm: Math.sqrt(norm) || 1 };
  });

  const cosine = (a: number, b: number): number => {
    const va = vecs[a];
    const vb = vecs[b];
    let dot = 0;
    const [small, big] = va.v.size < vb.v.size ? [va.v, vb.v] : [vb.v, va.v];
    for (const [term, w] of small) {
      const w2 = big.get(term);
      if (w2) dot += w * w2;
    }
    return dot / (va.norm * vb.norm);
  };

  // 简单并查集聚类
  const parent = valid.map((_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => {
    parent[find(a)] = find(b);
  };

  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      if (cosine(i, j) >= threshold) union(i, j);
    }
  }

  const groups = new Map<number, string[]>();
  for (let i = 0; i < valid.length; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(valid[i].id);
  }

  const clusters = [...groups.values()].filter((g) => g.length >= 2);
  return { clusters };
}
