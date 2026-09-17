import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

async function loadEnvFile() {
  try {
    const content = await readFile(join(root, '.env'), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
      if (!match || process.env[match[1]] != null) continue;
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

await loadEnvFile();

const dataDir = process.env.DATA_DIR
  ? resolve(root, process.env.DATA_DIR)
  : join(root, 'server', 'data');
const projectsFile = join(dataDir, 'projects.json');
const ragFile = join(dataDir, 'rag.json');
const memoriesFile = join(dataDir, 'memories.json');
const materialsFile = join(dataDir, 'materials.json');
const port = Number(process.env.PORT || 8787);
const embeddingApiKey = process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY || '';
const embeddingBaseUrl = (process.env.EMBEDDING_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const embeddingDimensions = Number(process.env.EMBEDDING_DIMENSIONS || 0);

await mkdir(dataDir, { recursive: true });

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function tokens(text) {
  const normalized = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const latin = normalized.match(/[a-z0-9]{2,}/g) || [];
  const chars = [...normalized.replace(/[\s\p{ASCII}]/gu, '')];
  const cjk = chars.flatMap((char, index) => [char, chars[index + 1] ? char + chars[index + 1] : '']).filter(Boolean);
  return [...latin, ...cjk];
}

function sparseVectorize(text) {
  const vector = {};
  const list = tokens(text);
  for (const token of list) vector[token] = (vector[token] || 0) + 1;
  const length = Math.sqrt(Object.values(vector).reduce((sum, value) => sum + value * value, 0)) || 1;
  for (const token of Object.keys(vector)) vector[token] /= length;
  return vector;
}

function sparseCosine(a, b) {
  const [small, large] = Object.keys(a).length < Object.keys(b).length ? [a, b] : [b, a];
  return Object.entries(small).reduce((score, [token, value]) => score + value * (large[token] || 0), 0);
}

function denseCosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
}

async function createEmbeddings(input) {
  if (!embeddingApiKey) return null;
  const payload = { input, model: embeddingModel };
  if (embeddingDimensions > 0) payload.dimensions = embeddingDimensions;
  const response = await fetch(`${embeddingBaseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${embeddingApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Embedding API ${response.status}: ${detail.slice(0, 300)}`);
  }
  const result = await response.json();
  if (!Array.isArray(result.data) || result.data.length !== input.length) {
    throw new Error('Embedding API returned an invalid response');
  }
  return result.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

let indexQueue = Promise.resolve();

function withIndexLock(task) {
  const operation = indexQueue.then(task, task);
  indexQueue = operation.catch(() => undefined);
  return operation;
}

async function reindexProject(project) {
  return withIndexLock(async () => {
    const index = await readJson(ragFile, []);
    const retained = index.filter((chunk) => chunk.projectId !== project.id);
    const previous = new Map(
      index.filter((chunk) => chunk.projectId === project.id).map((chunk) => [chunk.nodeId, chunk])
    );
    const nodes = project.nodes.filter((node) => node.content?.trim() || node.longForm?.trim());
    const generatedEmbeddings = new Map();
    const pendingNodes = nodes.filter((node) => {
      const cached = previous.get(node.id);
      return !(
        cached?.text === [node.content, node.longForm].filter(Boolean).join('\n\n').trim()
        && cached?.embeddingModel === embeddingModel
        && Array.isArray(cached.embedding)
      );
    });

    if (embeddingApiKey && pendingNodes.length) {
      try {
        const embeddings = await createEmbeddings(pendingNodes.map((node) =>
          [node.content, node.longForm].filter(Boolean).join('\n\n').trim()
        ));
        pendingNodes.forEach((node, index) => generatedEmbeddings.set(node.id, embeddings[index]));
      } catch (error) {
        console.error('Embedding indexing failed; using sparse fallback:', error.message);
      }
    }

    const chunks = nodes.map((node) => {
      const text = [node.content, node.longForm].filter(Boolean).join('\n\n').trim();
      const cached = previous.get(node.id);
      const generatedEmbedding = generatedEmbeddings.get(node.id);
      return {
        id: `${project.id}:${node.id}`,
        projectId: project.id,
        projectName: project.name,
        nodeId: node.id,
        text,
        tags: node.tags || {},
        sparseVector: sparseVectorize(text),
        embedding: generatedEmbedding
          || (cached?.text === text && cached?.embeddingModel === embeddingModel ? cached.embedding : null),
        embeddingModel: generatedEmbedding
          ? embeddingModel
          : (cached?.text === text ? cached?.embeddingModel || null : null),
        updatedAt: node.updatedAt,
      };
    });
    await writeJson(ragFile, [...retained, ...chunks]);
  });
}

async function reindexLibraryItem(item, kind) {
  return withIndexLock(async () => {
    const index = await readJson(ragFile, []);
    const documentId = `${kind}:${item.id}`;
    const text = [item.title, item.content].filter(Boolean).join('\n\n').trim();
    let embedding = null;
    if (embeddingApiKey && text) {
      try { [embedding] = await createEmbeddings([text]); }
      catch (error) { console.error(`${kind} indexing failed; using sparse fallback:`, error.message); }
    }
    const chunk = {
      id: documentId,
      projectId: null,
      projectName: kind === 'material' ? 'Material Library' : 'Creative Memory',
      nodeId: item.id,
      kind,
      text,
      tags: item.tags || [],
      sparseVector: sparseVectorize(text),
      embedding,
      embeddingModel: embedding ? embeddingModel : null,
      updatedAt: item.updatedAt,
    };
    await writeJson(ragFile, [...index.filter((entry) => entry.id !== documentId), chunk]);
  });
}

async function bodyOf(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function json(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
  });
  response.end(JSON.stringify(payload));
}

async function api(request, response, url) {
  if (request.method === 'OPTIONS') return json(response, 204, {});
  if (request.method === 'GET' && url.pathname === '/api/health') return json(response, 200, { ok: true });
  const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
  const materialMatch = url.pathname.match(/^\/api\/materials\/([^/]+)$/);
  const memoryMatch = url.pathname.match(/^\/api\/memories\/([^/]+)$/);
  const projects = await readJson(projectsFile, []);

  if (request.method === 'GET' && url.pathname === '/api/projects') return json(response, 200, projects);
  if (request.method === 'GET' && projectMatch) {
    const project = projects.find((item) => item.id === decodeURIComponent(projectMatch[1]));
    return project ? json(response, 200, project) : json(response, 404, { error: 'Project not found' });
  }
  if (request.method === 'PUT' && projectMatch) {
    const project = await bodyOf(request);
    if (!project.id || project.id !== decodeURIComponent(projectMatch[1])) return json(response, 400, { error: 'Invalid project' });
    const next = [...projects.filter((item) => item.id !== project.id), project];
    await writeJson(projectsFile, next);
    await reindexProject(project);
    return json(response, 200, project);
  }
  if (request.method === 'DELETE' && projectMatch) {
    const id = decodeURIComponent(projectMatch[1]);
    await writeJson(projectsFile, projects.filter((item) => item.id !== id));
    const index = await readJson(ragFile, []);
    await writeJson(ragFile, index.filter((chunk) => chunk.projectId !== id));
    return json(response, 200, { ok: true });
  }
  if (request.method === 'GET' && url.pathname === '/api/materials') {
    const items = await readJson(materialsFile, []);
    const query = (url.searchParams.get('q') || '').toLowerCase();
    return json(response, 200, query
      ? items.filter((item) => `${item.title} ${item.content} ${(item.tags || []).join(' ')}`.toLowerCase().includes(query))
      : items);
  }
  if (request.method === 'PUT' && materialMatch) {
    const body = await bodyOf(request);
    const items = await readJson(materialsFile, []);
    const itemId = decodeURIComponent(materialMatch[1]);
    const previous = items.find((item) => item.id === itemId);
    const item = {
      id: itemId,
      title: body.title || 'Untitled material',
      type: body.type || 'text',
      content: body.content || '',
      sourceUrl: body.sourceUrl || '',
      tags: Array.isArray(body.tags) ? body.tags : [],
      createdAt: previous?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await writeJson(materialsFile, [...items.filter((entry) => entry.id !== itemId), item]);
    await reindexLibraryItem(item, 'material');
    return json(response, 200, item);
  }
  if (request.method === 'DELETE' && materialMatch) {
    const itemId = decodeURIComponent(materialMatch[1]);
    const items = await readJson(materialsFile, []);
    await writeJson(materialsFile, items.filter((item) => item.id !== itemId));
    const index = await readJson(ragFile, []);
    await writeJson(ragFile, index.filter((entry) => entry.id !== `material:${itemId}`));
    return json(response, 200, { ok: true });
  }
  if (request.method === 'GET' && url.pathname === '/api/memories') {
    return json(response, 200, await readJson(memoriesFile, []));
  }
  if (request.method === 'PUT' && memoryMatch) {
    const body = await bodyOf(request);
    const memories = await readJson(memoriesFile, []);
    const memoryId = decodeURIComponent(memoryMatch[1]);
    const previous = memories.find((item) => item.id === memoryId);
    const memory = {
      id: memoryId,
      kind: body.kind || 'preference',
      content: body.content || '',
      metadata: body.metadata || {},
      createdAt: previous?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await writeJson(memoriesFile, [...memories.filter((item) => item.id !== memoryId), memory]);
    await reindexLibraryItem({ ...memory, title: memory.kind, tags: [] }, 'memory');
    return json(response, 200, memory);
  }
  if (request.method === 'DELETE' && memoryMatch) {
    const memoryId = decodeURIComponent(memoryMatch[1]);
    const memories = await readJson(memoriesFile, []);
    await writeJson(memoriesFile, memories.filter((item) => item.id !== memoryId));
    const index = await readJson(ragFile, []);
    await writeJson(ragFile, index.filter((entry) => entry.id !== `memory:${memoryId}`));
    return json(response, 200, { ok: true });
  }
  if (request.method === 'POST' && url.pathname === '/api/rag/search') {
    const { query = '', projectId, limit = 6 } = await bodyOf(request);
    const index = await readJson(ragFile, []);
    let queryEmbedding = null;
    if (embeddingApiKey && query.trim()) {
      try {
        [queryEmbedding] = await createEmbeddings([query.trim()]);
      } catch (error) {
        console.error('Embedding search failed; using sparse fallback:', error.message);
      }
    }
    const querySparseVector = sparseVectorize(query);
    const results = index
      .filter((chunk) => !projectId || !chunk.projectId || chunk.projectId === projectId)
      .map(({ vector, sparseVector, embedding, ...chunk }) => {
        const canUseEmbedding = queryEmbedding
          && embedding
          && chunk.embeddingModel === embeddingModel;
        return {
          ...chunk,
          score: canUseEmbedding
            ? denseCosine(queryEmbedding, embedding)
            : sparseCosine(querySparseVector, sparseVector || vector || {}),
          retrievalMode: canUseEmbedding ? 'embedding' : 'sparse',
        };
      })
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(Number(limit) || 6, 20));
    return json(response, 200, results);
  }
  return json(response, 404, { error: 'Not found' });
}

async function serveStatic(response, pathname) {
  const dist = join(root, 'dist');
  const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
  const safePath = normalize(join(dist, requested));
  if (!safePath.startsWith(dist)) return false;
  try {
    const info = await stat(safePath);
    const path = info.isDirectory() ? join(safePath, 'index.html') : safePath;
    const content = await readFile(path);
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' });
    response.end(content);
    return true;
  } catch {
    try {
      const content = await readFile(join(dist, 'index.html'));
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(content);
      return true;
    } catch {
      return false;
    }
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname.startsWith('/api/')) return await api(request, response, url);
    if (await serveStatic(response, url.pathname)) return;
    json(response, 404, { error: 'Build the frontend first' });
  } catch (error) {
    console.error(error);
    json(response, 500, { error: 'Internal server error' });
  }
});

server.listen(port, () => console.log(`CogCanvas API: http://localhost:${port}`));

if (process.argv.includes('--dev')) {
  const vite = spawn('npm', ['run', 'dev:web', '--', '--host'], { cwd: root, stdio: 'inherit' });
  const shutdown = () => { vite.kill('SIGTERM'); server.close(); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
