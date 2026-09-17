import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, '.data');
await mkdir(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, 'cogcanvas.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    source_url TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

const exampleMemoryId = 'memory_example_creative_pattern';
const memoryCount = db.prepare('SELECT COUNT(*) AS count FROM memories').get().count;
if (memoryCount === 0) {
  const now = Date.now();
  db.prepare('INSERT INTO memories (id, kind, content, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(
      exampleMemoryId,
      'pattern',
      '我更容易通过“先写一个不完美版本，再快速迭代”的方式进入创作状态。',
      JSON.stringify({ title: '个人创作习惯示例', example: true }),
      now,
      now
    );
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

const uploadDir = join(dataDir, 'uploads');
await mkdir(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, id('file') + '-' + file.originalname)
});
const upload = multer({ storage });

function decodeFilename(name) {
  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  return decoded.includes('�') ? name : decoded;
}

function decodeText(buffer) {
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  const replacements = (utf8.match(/�/g) || []).length;
  if (replacements <= Math.max(1, utf8.length * 0.005)) return utf8;
  try {
    return new TextDecoder('gb18030').decode(buffer);
  } catch {
    return utf8;
  }
}

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const originalName = decodeFilename(req.file.originalname);
  const extension = extname(originalName).toLowerCase();
  const isText = req.file.mimetype.startsWith('text/') || ['.txt', '.md', '.csv'].includes(extension);
  const content = isText ? decodeText(await readFile(req.file.path)).trim() : '';
  const title = basename(originalName, extension) || originalName;
  const materialId = id('material');
  const now = Date.now();
  const type = isText ? 'text' : req.file.mimetype.split('/')[0] || 'file';
  const sourceUrl = `/uploads/${req.file.filename}`;

  db.prepare('INSERT INTO materials (id, title, type, content, source_url, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(materialId, title, type, content, sourceUrl, JSON.stringify(['upload']), now, now);

  res.status(201).json({
    id: materialId,
    title,
    type,
    content,
    excerpt: content.slice(0, 240),
    sourceUrl,
    originalname: originalName,
    mimetype: req.file.mimetype,
    size: req.file.size,
    createdAt: now,
    updatedAt: now,
  });
});

app.use('/uploads', express.static(uploadDir));


const parse = (value, fallback) => {
  try { return JSON.parse(value); } catch { return fallback; }
};
const id = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

app.post('/api/rag/search', (req, res) => {
  const query = String(req.body.query || '').trim().toLowerCase();
  if (!query) return res.json([]);

  const projectId = req.body.projectId ? String(req.body.projectId) : null;
  const words = query.split(/\s+/).filter(Boolean);
  const results = [];
  const projectRows = projectId
    ? db.prepare('SELECT payload FROM projects WHERE id = ?').all(projectId)
    : db.prepare('SELECT payload FROM projects').all();

  for (const row of projectRows) {
    const project = parse(row.payload, null);
    if (!project) continue;
    for (const node of project.nodes || []) {
      const text = [node.content, node.longForm].filter(Boolean).join('\n\n');
      const normalized = text.toLowerCase();
      const matches = words.filter((word) => normalized.includes(word)).length;
      if (matches) results.push({
        id: `${project.id}:${node.id}`,
        projectId: project.id,
        projectName: project.name,
        nodeId: node.id,
        text,
        score: matches / words.length,
        retrievalMode: 'sparse',
      });
    }
  }

  res.json(results.sort((a, b) => b.score - a.score).slice(0, 20));
});

app.post('/api/references/search', async (req, res) => {
  const query = String(req.body.query || '').trim();
  if (!query) return res.json([]);

  const wikipediaUrl = new URL('https://zh.wikipedia.org/w/api.php');
  wikipediaUrl.search = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    format: 'json',
    origin: '*',
    srlimit: '4',
  }).toString();
  const openAlexUrl = new URL('https://api.openalex.org/works');
  openAlexUrl.search = new URLSearchParams({ search: query, 'per-page': '4' }).toString();

  const [wikipedia, openAlex] = await Promise.allSettled([
    fetch(wikipediaUrl).then((response) => response.json()),
    fetch(openAlexUrl).then((response) => response.json()),
  ]);
  const results = [];

  if (wikipedia.status === 'fulfilled') {
    for (const item of wikipedia.value.query?.search || []) {
      results.push({
        id: `wikipedia:${item.pageid}`,
        title: item.title,
        excerpt: String(item.snippet || '').replace(/<[^>]+>/g, ''),
        url: `https://zh.wikipedia.org/?curid=${item.pageid}`,
        source: 'Wikipedia',
      });
    }
  }
  if (openAlex.status === 'fulfilled') {
    for (const item of openAlex.value.results || []) {
      results.push({
        id: `openalex:${item.id}`,
        title: item.display_name,
        excerpt: [item.publication_year, item.primary_location?.source?.display_name].filter(Boolean).join(' · '),
        url: item.doi || item.id,
        source: 'OpenAlex',
      });
    }
  }

  res.json(results);
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/projects', (_req, res) => {
  const rows = db.prepare('SELECT payload FROM projects ORDER BY updated_at DESC').all();
  res.json(rows.map((row) => parse(row.payload, null)).filter(Boolean));
});

app.get('/api/projects/:id', (req, res) => {
  const row = db.prepare('SELECT payload FROM projects WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Project not found' });
  res.json(parse(row.payload, null));
});

app.put('/api/projects/:id', (req, res) => {
  const project = req.body;
  if (!project || project.id !== req.params.id) return res.status(400).json({ error: 'Invalid project' });
  const updatedAt = Number(project.updatedAt) || Date.now();
  db.prepare(`INSERT INTO projects (id, payload, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`)
    .run(project.id, JSON.stringify(project), updatedAt);
  res.json(project);
});

app.delete('/api/projects/:id', (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

app.get('/api/memories', (req, res) => {
  const kind = req.query.kind;
  const rows = kind
    ? db.prepare('SELECT * FROM memories WHERE kind = ? ORDER BY updated_at DESC').all(kind)
    : db.prepare('SELECT * FROM memories ORDER BY updated_at DESC').all();
  res.json(rows.map((row) => ({
    id: row.id, kind: row.kind, content: row.content,
    metadata: parse(row.metadata, {}), createdAt: row.created_at, updatedAt: row.updated_at,
  })));
});

app.post('/api/memories', (req, res) => {
  const now = Date.now();
  const memory = { id: req.body.id || id('memory'), kind: req.body.kind || 'note', content: req.body.content || '', metadata: req.body.metadata || {}, createdAt: now, updatedAt: now };
  db.prepare('INSERT INTO memories (id, kind, content, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(memory.id, memory.kind, memory.content, JSON.stringify(memory.metadata), now, now);
  res.status(201).json(memory);
});

app.get('/api/materials', (req, res) => {
  const query = String(req.query.q || '').trim();
  const rows = query
    ? db.prepare('SELECT * FROM materials WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC').all(`%${query}%`, `%${query}%`)
    : db.prepare('SELECT * FROM materials ORDER BY updated_at DESC').all();
  res.json(rows.map((row) => ({
    id: row.id, title: row.title, type: row.type, content: row.content,
    sourceUrl: row.source_url, tags: parse(row.tags, []), createdAt: row.created_at, updatedAt: row.updated_at,
  })));
});

app.post('/api/materials', (req, res) => {
  if (!req.body.title?.trim()) return res.status(400).json({ error: 'Title is required' });
  const now = Date.now();
  const material = { id: req.body.id || id('material'), title: req.body.title.trim(), type: req.body.type || 'text', content: req.body.content || '', sourceUrl: req.body.sourceUrl || null, tags: req.body.tags || [], createdAt: now, updatedAt: now };
  db.prepare('INSERT INTO materials (id, title, type, content, source_url, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(material.id, material.title, material.type, material.content, material.sourceUrl, JSON.stringify(material.tags), now, now);
  res.status(201).json(material);
});

app.put('/api/materials/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Material not found' });
  const material = {
    id: current.id,
    title: req.body.title ?? current.title,
    type: req.body.type ?? current.type,
    content: req.body.content ?? current.content,
    sourceUrl: req.body.sourceUrl ?? current.source_url,
    tags: req.body.tags ?? parse(current.tags, []),
    createdAt: current.created_at,
    updatedAt: Date.now(),
  };
  db.prepare('UPDATE materials SET title = ?, type = ?, content = ?, source_url = ?, tags = ?, updated_at = ? WHERE id = ?')
    .run(material.title, material.type, material.content, material.sourceUrl, JSON.stringify(material.tags), material.updatedAt, material.id);
  res.json(material);
});

app.delete('/api/materials/:id', (req, res) => {
  db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

const dist = join(root, 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*splat', (_req, res) => res.sendFile(join(dist, 'index.html')));
}

const port = Number(process.env.PORT) || 4318;
app.listen(port, () => console.log(`CogCanvas API listening on http://localhost:${port}`));
