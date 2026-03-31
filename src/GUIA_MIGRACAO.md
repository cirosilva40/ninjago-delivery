# 🔄 Guia de Migração — Equivalência de Recursos Base44

> Documento complementar à `DOCUMENTACAO_NINJAGO.md`.
> Esta seção detalha como substituir cada funcionalidade do Base44 SDK e da infraestrutura da plataforma por ferramentas e bibliotecas de mercado.

---

## Índice

1. [Banco de Dados — Entidades](#1-banco-de-dados--entidades)
2. [Backend Functions — Deno Edge Functions](#2-backend-functions--deno-edge-functions)
3. [Autenticação — base44.auth.*](#3-autenticação--base44auth)
4. [Integrações Core](#4-integrações-core)
5. [Analytics](#5-analytics)
6. [Conectores OAuth](#6-conectores-oauth)
7. [Automações](#7-automações)
8. [Frontend — SDK Base44](#8-frontend--sdk-base44)
9. [Hospedagem](#9-hospedagem)
10. [Stack Recomendada para Migração Completa](#10-stack-recomendada-para-migração-completa)

---

## 1. Banco de Dados — Entidades (`base44.entities.*`)

**Funcionalidade atual:**
- CRUD automático: `list`, `filter`, `create`, `update`, `delete`, `bulkCreate`
- Campos automáticos: `id`, `created_date`, `updated_date`, `created_by`
- Schema por entidade definido em JSON
- Real-time via `subscribe` (WebSocket interno)
- Paginação e ordenação nativas

**Substituições recomendadas:**

| Camada | Opções |
|---|---|
| **Banco relacional** | PostgreSQL, MySQL, SQLite |
| **Banco NoSQL** | MongoDB, DynamoDB, Firestore |
| **BaaS similar** | Supabase, Firebase, PocketBase, Appwrite |
| **ORM (SQL)** | Prisma, Drizzle, TypeORM, Sequelize |
| **ODM (NoSQL)** | Mongoose (MongoDB) |
| **Real-time** | Supabase Realtime, Firebase onSnapshot, Socket.IO + Redis Pub/Sub |
| **REST API** | Express, Fastify, NestJS, Hono |
| **GraphQL** | Apollo Server, Pothos, Hasura |

**Campos automáticos — implementação:**
```js
// Ao criar registros, gere automaticamente:
{
  id: crypto.randomUUID(),           // ou ULID, NanoID
  created_date: new Date().toISOString(),
  updated_date: new Date().toISOString(),
  created_by: req.user?.email         // do token JWT
}
// No update, sempre atualize:
updated_date: new Date().toISOString()
```

**Equivalência de sintaxe — Base44 vs Supabase:**
```js
// BASE44 atual
await base44.entities.Pedido.filter({ status: 'novo', pizzaria_id: id }, '-created_date', 50);
await base44.entities.Pedido.create({ cliente_nome: 'João', valor_total: 45 });
await base44.entities.Pedido.update(pedidoId, { status: 'em_preparo' });
await base44.entities.Pedido.delete(pedidoId);

// SUPABASE equivalente
const { data } = await supabase.from('pedidos')
  .select('*').eq('status', 'novo').eq('pizzaria_id', id)
  .order('created_date', { ascending: false }).limit(50);

await supabase.from('pedidos').insert({ cliente_nome: 'João', valor_total: 45 });
await supabase.from('pedidos').update({ status: 'em_preparo' }).eq('id', pedidoId);
await supabase.from('pedidos').delete().eq('id', pedidoId);
```

**Real-time — equivalência:**
```js
// BASE44 atual
const unsubscribe = base44.entities.Pedido.subscribe((event) => {
  console.log(event.type, event.data);
});
unsubscribe();

// SUPABASE equivalente
const channel = supabase.channel('pedidos')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' },
    (payload) => { console.log(payload.eventType, payload.new); }
  ).subscribe();

supabase.removeChannel(channel); // unsubscribe
```

> **Nota:** O Supabase é a substituição mais direta do Base44 — oferece banco PostgreSQL, API REST e SDK JavaScript com sintaxe similar, real-time nativo, autenticação embutida e storage de arquivos.

---

## 2. Backend Functions — Deno Edge Functions (`functions/*.js`)

**Funcionalidade atual:**
- Funções Deno com `Deno.serve(async (req) => { ... })`
- Importações via `npm:` e `jsr:`
- Variáveis de ambiente via `Deno.env.get('VAR')`
- Invocação do frontend: `base44.functions.invoke('nomeFuncao', payload)`
- SDK Base44 via `createClientFromRequest(req)`

**Substituições recomendadas:**

| Tipo | Opções |
|---|---|
| **Serverless Functions** | AWS Lambda, Google Cloud Functions, Azure Functions |
| **Edge Functions** | Cloudflare Workers, Vercel Edge Functions, Deno Deploy |
| **Servidor próprio** | Express, Fastify, NestJS, Hono (Node.js) |
| **Runtime alternativo** | Bun (compatível com Node.js + muito rápido) |

**Migração de código — comparação direta:**
```js
// BASE44 (Deno)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const pedidos = await base44.entities.Pedido.filter({ pizzaria_id: user.pizzaria_id });
  return Response.json({ pedidos });
});

// EQUIVALENTE — Hono (Deno Deploy / Node.js — sintaxe bem similar)
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
const app = new Hono();
app.use('/api/*', jwt({ secret: Deno.env.get('JWT_SECRET') }));
app.post('/api/minha-funcao', async (c) => {
  const user = c.get('jwtPayload');
  const pedidos = await db.from('pedidos').filter({ pizzaria_id: user.pizzaria_id });
  return c.json({ pedidos });
});
export default app;

// EQUIVALENTE — Express (Node.js)
import express from 'express';
const app = express();
app.post('/api/minha-funcao', authMiddleware, async (req, res) => {
  const user = req.user; // via middleware JWT
  const pedidos = await PedidoModel.find({ pizzaria_id: user.pizzaria_id });
  res.json({ pedidos });
});
```

**Variáveis de ambiente:**
```js
// Deno (atual)
Deno.env.get('MINHA_CHAVE')

// Node.js
process.env.MINHA_CHAVE
// (com dotenv em desenvolvimento)
import 'dotenv/config';

// Cloudflare Workers
env.MINHA_CHAVE // injetado automaticamente pelo runtime
```

**Invocação do frontend:**
```js
// BASE44 atual
const res = await base44.functions.invoke('calcularRotaEntrega', { origemLat, destinoLat });
const data = res.data;

// Substituição — fetch nativo
const res = await fetch('/api/calcular-rota-entrega', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  },
  body: JSON.stringify({ origemLat, destinoLat })
});
const data = await res.json();

// Substituição — axios
import axios from 'axios'; // já instalado no projeto
const { data } = await axios.post('/api/calcular-rota-entrega', { origemLat, destinoLat });
```

---

## 3. Autenticação — `base44.auth.*`

**Funcionalidade atual:**

| Método | Descrição |
|---|---|
| `base44.auth.me()` | Retorna usuário logado |
| `base44.auth.isAuthenticated()` | Verifica se está logado |
| `base44.auth.updateMe(data)` | Atualiza dados do usuário |
| `base44.auth.logout(redirectUrl?)` | Encerra sessão |
| `base44.auth.redirectToLogin(nextUrl?)` | Redireciona para login |
| `base44.users.inviteUser(email, role)` | Convida usuário |
| `useAuth()` hook + `AuthProvider` | Context React de autenticação |

**Substituições recomendadas:**

| Tipo | Opções |
|---|---|
| **BaaS de autenticação** | Clerk, Auth0, Firebase Auth, AWS Cognito, Supabase Auth |
| **Autenticação própria** | JWT + bcrypt (implementação manual) |
| **Sessões** | express-session + connect-pg-simple |
| **Middleware JWT** | jsonwebtoken, jose, @auth/core |

**Opção mais simples — Clerk:**
```jsx
// Substitui AuthProvider, useAuth, me(), isAuthenticated()
import { ClerkProvider, useUser, useAuth, useClerk } from '@clerk/clerk-react';

// me() equivalente:
const { user } = useUser();
// user.id, user.emailAddresses[0].emailAddress, user.publicMetadata.role, user.publicMetadata.pizzaria_id

// isAuthenticated() equivalente:
const { isSignedIn } = useAuth();

// logout() equivalente:
const { signOut } = useClerk();
await signOut();

// updateMe() equivalente:
await user.update({ unsafeMetadata: { pizzaria_id: 'xxx' } });

// inviteUser() — via Clerk Dashboard API (backend)
await clerkClient.invitations.createInvitation({ emailAddress, publicMetadata: { role: 'user' } });
```

**Opção com JWT próprio:**
```js
// Backend — gerar token
import jwt from 'jsonwebtoken';
const token = jwt.sign(
  { userId, email, role, pizzaria_id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Backend — middleware de verificação
import jwt from 'jsonwebtoken';
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  req.user = jwt.verify(token, process.env.JWT_SECRET);
  next();
};

// Frontend — armazenar e enviar
localStorage.setItem('auth_token', token);

// Hook useAuth() equivalente
const useAuth = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) setUser(JSON.parse(atob(token.split('.')[1]))); // decode JWT payload
  }, []);
  const logout = () => { localStorage.removeItem('auth_token'); window.location.reload(); };
  return { user, isAuthenticated: !!user, logout };
};
```

**Nota sobre autenticação dupla do NinjaGO:**
O sistema atual usa dois mecanismos paralelos:
1. **Base44 Auth** — para usuários admin/estabelecimento (role-based)
2. **localStorage manual** — para clientes finais e estabelecimentos via `AcessoUsuario`

Ao migrar, unifique ambos em um único sistema de autenticação JWT ou BaaS, eliminando a dependência de localStorage para autenticação de estabelecimentos.

---

## 4. Integrações Core

### 4.1 `InvokeLLM` — Chamadas a modelos de linguagem

```js
// BASE44 atual
const res = await base44.integrations.Core.InvokeLLM({
  prompt: 'Meu prompt aqui',
  response_json_schema: { type: 'object', properties: { distancia_km: { type: 'number' } } },
  add_context_from_internet: true
});

// Substituição — OpenAI SDK
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Meu prompt aqui' }],
  response_format: { type: 'json_object' } // para retorno JSON estruturado
});
const data = JSON.parse(completion.choices[0].message.content);

// Substituição — Google Gemini
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const result = await model.generateContent('Meu prompt aqui');
const text = result.response.text();

// Substituição — Anthropic Claude
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const message = await client.messages.create({
  model: 'claude-3-haiku-20240307',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Meu prompt aqui' }]
});
```

**Para `add_context_from_internet`:** integre com Perplexity API, Tavily Search API ou Google Custom Search API para buscar contexto antes de montar o prompt.

---

### 4.2 `UploadFile` / `UploadPrivateFile` — Upload de arquivos

```js
// BASE44 atual
const { file_url } = await base44.integrations.Core.UploadFile({ file });

// Substituição — AWS S3
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region: process.env.AWS_REGION });
const key = `uploads/${Date.now()}-${file.name}`;
await s3.send(new PutObjectCommand({
  Bucket: process.env.S3_BUCKET,
  Key: key,
  Body: await file.arrayBuffer(),
  ContentType: file.type,
  ACL: 'public-read' // para arquivo público
}));
const file_url = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;

// Substituição — Supabase Storage (mais simples, recomendado)
const { data, error } = await supabase.storage
  .from('uploads')
  .upload(`${Date.now()}-${file.name}`, file, { contentType: file.type });
const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path);

// Substituição — Cloudflare R2 (API idêntica ao S3)
// Mesma API do AWS S3, apenas configure endpoint diferente

// Substituição — Uploadthing (mais simples para React)
import { useUploadThing } from "@uploadthing/react";
const { startUpload } = useUploadThing("imageUploader");
const [res] = await startUpload([file]);
const file_url = res.url;
```

---

### 4.3 `CreateFileSignedUrl` — URLs temporárias para arquivos privados

```js
// BASE44 atual
const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
  file_uri: 'path/to/file',
  expires_in: 300 // segundos
});

// Substituição — AWS S3 Presigned URL
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
const url = await getSignedUrl(
  s3,
  new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: 'path/to/file' }),
  { expiresIn: 300 }
);

// Substituição — Supabase Storage Signed URL
const { data } = await supabase.storage
  .from('private-bucket')
  .createSignedUrl('path/to/file', 300);
const signed_url = data.signedUrl;
```

---

### 4.4 `SendEmail` — Envio de e-mails

```js
// BASE44 atual
await base44.integrations.Core.SendEmail({
  to: 'cliente@email.com',
  subject: 'Seu pedido foi aceito!',
  body: '<h1>Olá!</h1><p>Seu pedido está em preparo.</p>'
});

// Substituição — Resend (recomendado, o mais simples)
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: 'NinjaGO <noreply@seudominio.com>',
  to: 'cliente@email.com',
  subject: 'Seu pedido foi aceito!',
  html: '<h1>Olá!</h1><p>Seu pedido está em preparo.</p>'
});

// Substituição — SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.send({
  to: 'cliente@email.com',
  from: 'noreply@seudominio.com',
  subject: 'Seu pedido foi aceito!',
  html: '<h1>Olá!</h1>'
});

// Substituição — Nodemailer (SMTP genérico, ex: Gmail)
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', port: 587,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});
await transporter.sendMail({
  from: 'NinjaGO <noreply@seudominio.com>',
  to: 'cliente@email.com',
  subject: 'Seu pedido foi aceito!',
  html: '<h1>Olá!</h1>'
});
```

---

### 4.5 `GenerateImage` — Geração de imagens por IA

```js
// BASE44 atual
const { url } = await base44.integrations.Core.GenerateImage({
  prompt: 'Pizza margherita apetitosa em fundo escuro, fotografia profissional',
  existing_image_urls: [] // referências opcionais
});

// Substituição — OpenAI DALL-E 3
const response = await openai.images.generate({
  model: 'dall-e-3',
  prompt: 'Pizza margherita apetitosa em fundo escuro, fotografia profissional',
  n: 1,
  size: '1024x1024',
  quality: 'standard'
});
const url = response.data[0].url;

// Substituição — Stability AI (API REST)
const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.STABILITY_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ text_prompts: [{ text: prompt }], cfg_scale: 7, height: 1024, width: 1024, samples: 1 })
});
```

---

### 4.6 `ExtractDataFromUploadedFile` — Extração estruturada de dados

```js
// BASE44 atual
const { output } = await base44.integrations.Core.ExtractDataFromUploadedFile({
  file_url: 'https://...',
  json_schema: { type: 'object', properties: { ... } }
});

// Substituição — combinar parser + LLM

// Para CSVs:
import Papa from 'papaparse'; // npm: papaparse
const { data } = Papa.parse(csvString, { header: true });

// Para Excel (.xlsx):
import * as XLSX from 'xlsx'; // npm: xlsx
const workbook = XLSX.read(buffer);
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

// Para PDFs:
import pdfParse from 'pdf-parse'; // npm: pdf-parse
const { text } = await pdfParse(pdfBuffer);

// Para imagens (OCR):
// AWS Textract, Google Cloud Vision, Tesseract.js (client-side)

// Após extrair o texto/dados, estruturar com LLM:
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: `Estruture estes dados no schema ${JSON.stringify(schema)}: ${rawData}` }],
  response_format: { type: 'json_object' }
});
const output = JSON.parse(completion.choices[0].message.content);
```

---

## 5. Analytics — `base44.analytics.track()`

```js
// BASE44 atual
base44.analytics.track({
  eventName: 'pedido_confirmado',
  properties: { valor_total: 89.90, forma_pagamento: 'pix' }
});

// Substituição — PostHog (open-source, auto-hospedável — recomendado)
import posthog from 'posthog-js';
posthog.init('sua_project_key', { api_host: 'https://app.posthog.com' });
posthog.capture('pedido_confirmado', { valor_total: 89.90, forma_pagamento: 'pix' });

// Substituição — Mixpanel
import mixpanel from 'mixpanel-browser';
mixpanel.init('seu_token');
mixpanel.track('pedido_confirmado', { valor_total: 89.90, forma_pagamento: 'pix' });

// Substituição — Amplitude
import * as amplitude from '@amplitude/analytics-browser';
amplitude.init('sua_api_key');
amplitude.track('pedido_confirmado', { valor_total: 89.90, forma_pagamento: 'pix' });

// Substituição — Google Analytics 4 (gtag)
gtag('event', 'purchase', { currency: 'BRL', value: 89.90, payment_type: 'pix' });
```

---

## 6. Conectores OAuth — `base44.connectors.*`

**Funcionalidade atual:**
- Conectores pré-integrados (Google Calendar, Gmail, Slack, etc.)
- `getConnection(type)` — obtém access token do builder (shared connector)
- `getCurrentAppUserAccessToken(connectorId)` — obtém token do usuário
- `connectAppUser(connectorId)` — inicia fluxo OAuth para o usuário
- `disconnectAppUser(connectorId)` — revoga conexão

**Substituição — implementação manual OAuth 2.0:**

```js
// Backend — iniciar fluxo OAuth
app.get('/auth/google', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.BASE_URL}/auth/google/callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline', // para refresh_token
    state: req.user.id // para identificar o usuário no callback
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Backend — callback: trocar código por tokens
app.get('/auth/google/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.BASE_URL}/auth/google/callback`,
      grant_type: 'authorization_code'
    })
  });
  const { access_token, refresh_token, expires_in } = await tokenRes.json();
  // Salvar tokens criptografados no banco de dados
  await db.userConnections.upsert({ userId, provider: 'google', access_token, refresh_token });
  res.redirect('/dashboard?connected=google');
});

// Frontend — connectAppUser() equivalente
const handleConnect = async () => {
  const popup = window.open('/auth/google', '_blank', 'width=500,height=600');
  const timer = setInterval(() => {
    if (!popup || popup.closed) {
      clearInterval(timer);
      refetchData(); // recarrega dados após fechar o popup
    }
  }, 500);
};

// Substituição com biblioteca — simple-oauth2
import { AuthorizationCode } from 'simple-oauth2';
const client = new AuthorizationCode({
  client: { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET },
  auth: { tokenHost: 'https://oauth2.googleapis.com', authorizePath: '/o/oauth2/v2/auth', tokenPath: '/token' }
});
const authorizationUri = client.authorizeURL({ redirect_uri, scope });
const tokenData = await client.getToken({ code, redirect_uri });
```

---

## 7. Automações — `create_automation()`, `manage_automation()`

### 7.1 Automações Agendadas (Scheduled)

```js
// Node.js — node-cron (servidor próprio)
import cron from 'node-cron';

// Equivalente a: repeat_interval=1, repeat_unit="days", start_time="02:00"
cron.schedule('0 2 * * *', async () => {
  console.log('Executando limpeza noturna...');
  await cleanupOldData();
});

// Equivalente a: repeat_interval=5, repeat_unit="minutes"
cron.schedule('*/5 * * * *', async () => {
  await ifoodPolling();
});
```

**Serviços externos para cron:**

| Serviço | Como usar |
|---|---|
| **Vercel Cron** | `vercel.json`: `{ "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 2 * * *" }] }` |
| **Supabase Edge Functions** | Schedule via dashboard do Supabase |
| **AWS EventBridge** | Regra de agendamento → dispara Lambda |
| **Google Cloud Scheduler** | Cria job → HTTP POST para Cloud Run/Functions |
| **Railway** | Cron Jobs configuráveis no dashboard |
| **Render** | Cron Jobs configuráveis no dashboard |

---

### 7.2 Automações de Entidade (Entity Triggers)

```js
// Opção 1 — Database Triggers (PostgreSQL)
// Disparado automaticamente pelo banco quando um registro muda
CREATE OR REPLACE FUNCTION notify_pedido_change() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('pedido_changed', json_build_object(
    'type', TG_OP,
    'entity_id', NEW.id,
    'data', row_to_json(NEW),
    'old_data', row_to_json(OLD)
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pedido_after_change
AFTER INSERT OR UPDATE OR DELETE ON pedidos
FOR EACH ROW EXECUTE FUNCTION notify_pedido_change();

// Backend — escutar as notificações do PostgreSQL
import { Client } from 'pg';
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query('LISTEN pedido_changed');
client.on('notification', async (msg) => {
  const payload = JSON.parse(msg.payload);
  if (payload.type === 'UPDATE' && payload.data.status === 'em_preparo') {
    await enviarNotificacaoCliente(payload.data);
  }
});
```

```js
// Opção 2 — Supabase Realtime (mais simples)
supabase.channel('pedidos-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'pedidos',
    filter: 'status=eq.em_preparo'
  }, async (payload) => {
    await enviarNotificacaoCliente(payload.new);
  })
  .subscribe();
```

```js
// Opção 3 — Event Emitter no service layer (Node.js)
import EventEmitter from 'events';
export const entityEmitter = new EventEmitter();

// No service de pedidos:
export const updatePedido = async (id, data) => {
  const oldData = await Pedido.findById(id);
  const newData = await Pedido.findByIdAndUpdate(id, data, { new: true });
  const changedFields = Object.keys(data);
  entityEmitter.emit('pedido.update', { data: newData, old_data: oldData, changed_fields: changedFields });
  return newData;
};

// Listener da automação:
entityEmitter.on('pedido.update', async ({ data, old_data, changed_fields }) => {
  if (changed_fields.includes('status') && data.status === 'em_preparo') {
    await enviarNotificacaoCliente(data);
  }
});
```

---

### 7.3 Automações de Conector (Webhooks externos)

```js
// Implementar endpoint de webhook no backend
// (substitui automation_type="connector")

// Exemplo — webhook do Mercado Pago
app.post('/webhooks/mercadopago', express.raw({ type: 'application/json' }), async (req, res) => {
  // 1. Validar assinatura (OBRIGATÓRIO para segurança)
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  const isValid = validateMercadoPagoSignature(req.body, xSignature, xRequestId, process.env.MP_WEBHOOK_SECRET);
  if (!isValid) return res.status(401).send('Unauthorized');

  // 2. Processar evento
  const { type, data } = JSON.parse(req.body);
  if (type === 'payment') {
    await processarPagamento(data.id);
  }
  res.sendStatus(200);
});

// Exemplo — webhook genérico com secret compartilhado
app.post('/webhooks/pedido-externo', async (req, res) => {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) return res.status(401).send('Unauthorized');
  await processarPedidoExterno(req.body);
  res.sendStatus(200);
});
```

---

## 8. Frontend — SDK Base44 (`@/api/base44Client`)

**Funcionalidade atual no frontend:**
```js
import { base44 } from '@/api/base44Client';
base44.entities.Pedido.list()
base44.functions.invoke('calcularRotaEntrega', payload)
base44.auth.me()
base44.integrations.Core.InvokeLLM(...)
base44.analytics.track(...)
```

**Substituição — criar seu próprio cliente API:**

```js
// src/lib/apiClient.js — cliente HTTP com autenticação automática
import axios from 'axios'; // já instalado

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // ex: https://api.seudominio.com
  headers: { 'Content-Type': 'application/json' }
});

// Injeta token JWT automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona para login se token expirado
api.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/AcessoUsuario';
  }
  return Promise.reject(error);
});

export default api;
```

```js
// src/lib/entities.js — wrapper CRUD similar ao base44.entities
import api from './apiClient';

const createEntityClient = (entityName) => ({
  list: (sort, limit) =>
    api.get(`/api/${entityName}`, { params: { sort, limit } }).then(r => r.data),
  filter: (query, sort, limit) =>
    api.post(`/api/${entityName}/filter`, { query, sort, limit }).then(r => r.data),
  create: (data) =>
    api.post(`/api/${entityName}`, data).then(r => r.data),
  update: (id, data) =>
    api.patch(`/api/${entityName}/${id}`, data).then(r => r.data),
  delete: (id) =>
    api.delete(`/api/${entityName}/${id}`).then(r => r.data),
  bulkCreate: (dataArray) =>
    api.post(`/api/${entityName}/bulk`, dataArray).then(r => r.data),
});

export const entities = {
  Pedido: createEntityClient('pedidos'),
  Cliente: createEntityClient('clientes'),
  Pizzaria: createEntityClient('pizzarias'),
  Produto: createEntityClient('produtos'),
  Entregador: createEntityClient('entregadores'),
  Entrega: createEntityClient('entregas'),
  Notificacao: createEntityClient('notificacoes'),
  Custo: createEntityClient('custos'),
  Recompensa: createEntityClient('recompensas'),
  ResgatePontos: createEntityClient('resgate-pontos'),
  MetodoPagamento: createEntityClient('metodos-pagamento'),
};
```

```js
// src/lib/functions.js — wrapper para backend functions
import api from './apiClient';

export const functions = {
  invoke: (functionName, payload) =>
    api.post(`/api/functions/${functionName}`, payload).then(r => r.data)
};

// Uso idêntico ao Base44:
// base44.functions.invoke('calcularRotaEntrega', payload)
// → functions.invoke('calcularRotaEntrega', payload)
```

```js
// src/lib/auth.js — hook useAuth() customizado
import { useState, useEffect, createContext, useContext } from 'react';
import api from './apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.get('/api/auth/me')
        .then(r => setUser(r.data))
        .catch(() => localStorage.removeItem('auth_token'))
        .finally(() => setIsLoadingAuth(false));
    } else {
      setIsLoadingAuth(false);
    }
  }, []);

  const logout = (redirectUrl = '/AcessoUsuario') => {
    localStorage.removeItem('auth_token');
    setUser(null);
    window.location.href = redirectUrl;
  };

  const navigateToLogin = (nextUrl) => {
    window.location.href = nextUrl ? `/AcessoUsuario?next=${nextUrl}` : '/AcessoUsuario';
  };

  return (
    <AuthContext.Provider value={{ user, isLoadingAuth, isAuthenticated: !!user, logout, navigateToLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

**Mapeamento de imports no código existente:**

| Atual (Base44) | Substituto |
|---|---|
| `base44.entities.X.list()` | `entities.X.list()` |
| `base44.entities.X.filter(q)` | `entities.X.filter(q)` |
| `base44.entities.X.create(d)` | `entities.X.create(d)` |
| `base44.entities.X.update(id, d)` | `entities.X.update(id, d)` |
| `base44.entities.X.delete(id)` | `entities.X.delete(id)` |
| `base44.functions.invoke('fn', p)` | `functions.invoke('fn', p)` |
| `base44.auth.me()` | `api.get('/api/auth/me').then(r => r.data)` |
| `base44.auth.logout()` | `auth.logout()` |
| `useAuth()` | `useAuth()` (hook próprio) |
| `base44.integrations.Core.SendEmail(p)` | `functions.invoke('sendEmail', p)` |
| `base44.integrations.Core.InvokeLLM(p)` | `functions.invoke('invokeLLM', p)` |
| `base44.integrations.Core.UploadFile(p)` | `functions.invoke('uploadFile', p)` |
| `base44.analytics.track(e)` | `posthog.capture(e.eventName, e.properties)` |

---

## 9. Hospedagem

| Componente | Opções Gratuitas/Low-cost | Opções Pro |
|---|---|---|
| **Frontend React** | Vercel (free tier), Netlify (free tier), Cloudflare Pages | AWS Amplify, Azure Static Web Apps |
| **Backend API (Node.js)** | Railway (free tier), Render (free tier), Fly.io | AWS ECS, Google Cloud Run |
| **Backend Serverless** | Vercel Functions, Netlify Functions, Cloudflare Workers | AWS Lambda, Google Cloud Functions |
| **Banco de Dados** | Supabase (free tier), Neon (free tier), Railway Postgres | PlanetScale, Amazon RDS |
| **Storage de Arquivos** | Supabase Storage (1GB free), Cloudflare R2 (10GB free) | AWS S3, Google Cloud Storage |
| **Cache/Redis** | Upstash Redis (free tier) | Redis Cloud, AWS ElastiCache |
| **Monitoramento/Erros** | Sentry (free tier), Better Stack (free tier) | Datadog, New Relic |
| **E-mail** | Resend (3.000/mês free), SendGrid (100/dia free) | AWS SES, Mailgun |

---

## 10. Stack Recomendada para Migração Completa

Com base na arquitetura atual do NinjaGO, a stack mais alinhada para uma migração com menor atrito é:

```
┌───────────────────────────────────────────────────────┐
│           STACK DE MIGRAÇÃO RECOMENDADA               │
├───────────────────────────────────────────────────────┤
│ Frontend    │ React + Vite + Tailwind + shadcn/ui      │
│             │ (código atual praticamente sem mudanças) │
├───────────────────────────────────────────────────────┤
│ API Client  │ Axios + React Query (já instalados)      │
│             │ + lib/apiClient.js + lib/entities.js     │
├───────────────────────────────────────────────────────┤
│ Backend     │ Hono (Deno/Node.js — sintaxe similar)    │
│             │ OU Express/Fastify (Node.js)             │
├───────────────────────────────────────────────────────┤
│ Database    │ Supabase (PostgreSQL + REST + Realtime   │
│             │ + Auth + Storage — mais próximo Base44)  │
├───────────────────────────────────────────────────────┤
│ Auth        │ Supabase Auth OU Clerk                   │
├───────────────────────────────────────────────────────┤
│ Storage     │ Supabase Storage OU Cloudflare R2        │
├───────────────────────────────────────────────────────┤
│ E-mail      │ Resend                                   │
├───────────────────────────────────────────────────────┤
│ LLM         │ OpenAI SDK (gpt-4o-mini)                 │
├───────────────────────────────────────────────────────┤
│ Cron Jobs   │ Vercel Cron OU Supabase Cron              │
├───────────────────────────────────────────────────────┤
│ Deploy      │ Vercel (frontend + edge functions)       │
│             │ Railway (backend Node.js persistente)    │
└───────────────────────────────────────────────────────┘
```

### Por que Supabase como substituto principal do Base44:

| Feature Base44 | Equivalente Supabase |
|---|---|
| `base44.entities.*` | `supabase.from('tabela').*` |
| `entity.subscribe()` | `supabase.channel().on('postgres_changes')` |
| `base44.auth.me()` | `supabase.auth.getUser()` |
| `UploadFile` | `supabase.storage.from().upload()` |
| `CreateFileSignedUrl` | `supabase.storage.from().createSignedUrl()` |
| Edge Functions (Deno) | Supabase Edge Functions (também Deno — código quase idêntico!) |
| Roles de usuário | Supabase RLS (Row Level Security) |

> **Nota importante:** As Supabase Edge Functions também rodam em **Deno** e usam sintaxe muito similar às funções atuais do Base44. Isso significa que grande parte do código das `functions/` pode ser migrada com adaptações mínimas, apenas substituindo `createClientFromRequest(req)` pelo cliente Supabase.

---

### Prioridade de Migração Sugerida

```
FASE 1 — Infraestrutura
  ├── Configurar Supabase (banco + auth + storage)
  ├── Migrar entidades (JSON Schema → tabelas PostgreSQL)
  └── Configurar ambiente de deploy (Vercel + Railway)

FASE 2 — Backend
  ├── Migrar Backend Functions para Supabase Edge Functions / Hono
  ├── Reimplementar autenticação (Supabase Auth ou JWT)
  └── Configurar webhooks externos (MP, iFood)

FASE 3 — Frontend
  ├── Criar lib/apiClient.js, lib/entities.js, lib/auth.js
  ├── Substituir imports base44 por novos clientes
  └── Adaptar AuthProvider e useAuth() para novo sistema

FASE 4 — Serviços Externos
  ├── Conectar OpenAI (LLM)
  ├── Conectar Resend (e-mail)
  └── Migrar analytics para PostHog
```

---

*Documento criado em: 31/03/2026*
*Versão: NinjaGO Delivery — Guia de Migração v1.0*