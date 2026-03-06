import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function ExportarEstrutura({ usuarios = [], estabelecimentos = [] }) {
  const handleExportar = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR');

    const doc = `# Documentação Técnica - NinjaGO Delivery
> Gerado em: ${dataAtual} às ${horaAtual}

---

## 1. VISÃO GERAL DO SISTEMA

NinjaGO Delivery é uma plataforma SaaS multi-tenant de gestão de delivery. Cada estabelecimento (pizzaria/restaurante) é um tenant isolado com seus próprios pedidos, entregadores, produtos e configurações.

**Stack Tecnológica:**
- Frontend: React 18 + Vite + TailwindCSS + shadcn/ui
- Backend: Base44 BaaS (Backend as a Service)
- Banco de Dados: Base44 Database (NoSQL)
- Autenticação: Base44 Auth
- Pagamentos: Mercado Pago
- Mapas: React Leaflet + OpenStreetMap
- Animações: Framer Motion
- Consultas: TanStack React Query

---

## 2. ESTRUTURA DE PASTAS DO PROJETO

\`\`\`
/project-root
  /pages                        ← Páginas da aplicação (React)
    Home.js                     ← Landing page / página inicial
    Dashboard.js                ← Dashboard principal
    Pedidos.js                  ← Gestão de pedidos
    NovoPedido.js               ← Criação de novo pedido
    Cozinha.js                  ← Painel da cozinha (KDS)
    Produtos.js                 ← Cadastro de produtos
    Entregadores.js             ← Gestão de entregadores
    EntregadorDetalhe.js        ← Detalhe/ficha do entregador
    AppEntregador.js            ← App do entregador (mobile)
    MapaTempoReal.js            ← Mapa ao vivo com entregas
    Financeiro.js               ← Painel financeiro
    Relatorios.js               ← Relatórios e gráficos
    Configuracoes.js            ← Configurações do estabelecimento
    ConfiguracoesFinanceiras.js ← Configurações financeiras
    AdminUsers.js               ← Painel admin da plataforma
    AcessoAdmin.js              ← Login do administrador
    AcessoUsuario.js            ← Login do usuário
    AcessoCliente.js            ← Login do cliente final
    CardapioCliente.js          ← Cardápio público do cliente
    AcompanharPedido.js         ← Rastreamento de pedido
    PerfilCliente.js            ← Perfil do cliente
    NotificacoesCliente.js      ← Notificações do cliente
    PagamentoSucesso.js         ← Retorno de pagamento aprovado
    PagamentoFalha.js           ← Retorno de pagamento recusado
    ProgramaFidelidade.js       ← Programa de pontos
    EntregasHoje.js             ← Entregas do dia
    Pagamentos.js               ← Pagamentos de entregadores
    ControleComandas.js         ← Controle de comandas
    FluxoDeCaixa.js             ← Fluxo de caixa
    CriarNovaSenha.js           ← Redefinição de senha

  /components                   ← Componentes reutilizáveis
    /admin
      ExportarEstrutura.jsx     ← Componente de exportação de documentação
    /cliente
      PixCheckout.jsx           ← Checkout PIX
      MercadoPagoHelper.jsx     ← Integração Mercado Pago
      ProductDetailModal.jsx    ← Modal de detalhes do produto
      ProdutoCard.jsx           ← Card de produto no cardápio
      NinjaAnimation.jsx        ← Animação decorativa
    /configuracoes
      MapaRaioEntrega.jsx       ← Mapa do raio de entrega
      TestarMercadoPago.jsx     ← Teste de credenciais MP
      TestarWebhookMercadoPago.jsx ← Teste de webhook MP
    /dashboard
      StatsCard.jsx             ← Card de estatística
      EntregaCard.jsx           ← Card de entrega
      EntregadorCard.jsx        ← Card de entregador
    /entregador
      RotaOtimizadaCard.jsx     ← Card de rota otimizada
      useGeoTracking.jsx        ← Hook de geolocalização
    /pedidos
      PedidoModal.jsx           ← Modal de pedido
      AtribuirEntregaModal.jsx  ← Modal atribuição de entrega
      NotificacaoHelper.jsx     ← Helper de notificações
    /produtos
      OpcoesPersonalizacaoManager.jsx ← Gerenciador de personalizações
    /ui                         ← Componentes UI (shadcn)
      button, input, card, badge, dialog, select,
      dropdown-menu, tabs, switch, checkbox, ...
    RouteGuard.jsx              ← Proteção de rotas
    UserNotRegisteredError.jsx  ← Erro de usuário não registrado

  /functions                    ← Funções backend (Deno/Edge)
    criarPagamentoMercadoPago   ← Cria preferência de pagamento MP
    processarPagamentoMercadoPago ← Processa retorno do MP
    webhookMercadoPago          ← Recebe webhooks do MP
    geocodificarEndereco        ← Geocodificação de endereços
    uploadLogoEstabelecimento   ← Upload de imagens
    gerarSenhasTemporarias      ← Geração de senhas
    gerarNovaSenha              ← Gera nova senha temporária
    atualizarSenhaEstabelecimento ← Atualiza senha do estabelecimento
    gerarImagensProdutos        ← IA para imagens de produtos
    gerarImagensProdutosLote    ← Geração em lote de imagens
    otimizarRotaEntregador      ← Otimização de rotas
    testarMercadoPago           ← Testa credenciais MP
    enviarWebhookMercadoPagoTeste ← Testa webhook MP

  /entities                     ← Schemas de dados (JSON)
    Pizzaria.json               ← Estabelecimento/tenant
    Produto.json                ← Produto do cardápio
    Pedido.json                 ← Pedido de delivery
    Entrega.json                ← Registro de entrega
    Entregador.json             ← Entregador
    Cliente.json                ← Cliente final
    MetodoPagamento.json        ← Métodos de pagamento
    Pagamento.json              ← Pagamento de entregadores
    RegistroEntrega.json        ← Histórico de entregas
    Notificacao.json            ← Notificações
    HistoricoLocalizacao.json   ← Rastreamento GPS
    Custo.json                  ← Custos operacionais
    Recompensa.json             ← Recompensas (fidelidade)
    ResgatePontos.json          ← Resgates de pontos
    User.json                   ← Usuários do sistema (built-in)

  Layout.js                     ← Layout principal com sidebar
  globals.css / index.css       ← Estilos globais
\`\`\`

---

## 3. ESTRUTURA DO BANCO DE DADOS (ENTIDADES)

### Pizzaria (Estabelecimento/Tenant)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | ID único (auto) |
| nome | string | Nome do estabelecimento |
| cnpj | string | CNPJ |
| telefone | string | Telefone principal |
| email | string | Email de contato |
| endereco | string | Endereço completo |
| cidade | string | Cidade |
| estado | string | Estado (UF) |
| cep | string | CEP |
| latitude | number | Coordenada geográfica |
| longitude | number | Coordenada geográfica |
| logo_url | string | URL da logo |
| status | enum | ativa / inativa / suspensa |
| plano | enum | basico / profissional / enterprise |
| horario_abertura | string | Ex: "18:00" |
| horario_fechamento | string | Ex: "23:00" |
| taxa_entrega_base | number | Taxa base de entrega (R$) |
| raio_entrega_km | number | Raio máximo de entrega |
| taxa_adicional_por_km | number | Valor por km além do raio |
| valor_minimo_entrega_gratis | number | Pedido mínimo para frete grátis |
| configuracoes | object | mp_public_key, mp_access_token, etc. |
| dados_bancarios | object | Dados bancários para repasse |
| senha | string | Senha do estabelecimento |

### Produto
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | ID único |
| restaurante_id | string | FK → Pizzaria.id |
| nome | string | Nome do produto |
| descricao | string | Descrição |
| categoria | enum | pizza / esfiha / lanche / bebida / acai / combo / sobremesa / porcao / salgado / doce / outro |
| preco | number | Preço base |
| imagem_url | string | URL da imagem |
| disponivel | boolean | Disponível para pedido |
| destaque | boolean | Produto em destaque |
| opcoes_personalizacao | array | Grupos de complementos/adicionais |

### Pedido
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | ID único |
| pizzaria_id | string | FK → Pizzaria.id |
| numero_pedido | string | Número sequencial |
| tipo_pedido | enum | delivery / balcao |
| cliente_nome | string | Nome do cliente |
| cliente_telefone | string | Telefone |
| cliente_endereco | string | Endereço de entrega |
| itens | array | Lista de itens do pedido |
| valor_produtos | number | Subtotal dos produtos |
| taxa_entrega | number | Taxa de entrega |
| desconto | number | Desconto aplicado |
| valor_total | number | Total final |
| forma_pagamento | enum | dinheiro / pix / cartao_credito / cartao_debito / online |
| status_pagamento | enum | pendente / pago / receber_depois / cancelado |
| status | enum | novo / em_preparo / pronto / em_entrega / entregue / finalizada / cancelado |
| origem | enum | balcao / telefone / whatsapp / ifood / app / site |

### Entregador
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | ID único |
| pizzaria_id | string | FK → Pizzaria.id |
| nome | string | Nome completo |
| telefone | string | Telefone |
| cpf | string | CPF |
| veiculo | enum | moto / carro / bicicleta / a_pe |
| status | enum | disponivel / em_entrega / offline / pausado |
| latitude | number | Posição atual |
| longitude | number | Posição atual |
| saldo_taxas | number | Saldo a receber |
| total_entregas | number | Total de entregas realizadas |
| avaliacao_media | number | Nota média |

### Entrega
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | ID único |
| pizzaria_id | string | FK → Pizzaria.id |
| pedido_id | string | FK → Pedido.id |
| entregador_id | string | FK → Entregador.id |
| status | enum | pendente / aceita / em_rota / entregue / recusada / cancelada |
| taxa_entregador | number | Valor para o entregador |
| horario_atribuicao | datetime | Quando foi atribuída |
| horario_entrega | datetime | Quando foi entregue |
| rota_log | array | Log de coordenadas GPS |

### Cliente
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | ID único |
| pizzaria_id | string | FK → Pizzaria.id |
| nome | string | Nome completo |
| telefone | string | Telefone |
| email | string | Email |
| senha | string | Senha |
| endereco | string | Endereço |
| pontos_fidelidade | number | Pontos acumulados |

### Outras Entidades
- **MetodoPagamento**: Métodos aceitos por estabelecimento
- **Pagamento**: Pagamentos realizados a entregadores
- **RegistroEntrega**: Histórico financeiro de entregas
- **Notificacao**: Sistema de notificações push
- **HistoricoLocalizacao**: Log GPS dos entregadores
- **Custo**: Custos operacionais do estabelecimento
- **Recompensa**: Recompensas do programa de fidelidade
- **ResgatePontos**: Histórico de resgates de pontos
- **User**: Usuários do painel administrativo (built-in Base44)

---

## 4. MAPEAMENTO DE MÓDULOS E DEPENDÊNCIAS

### Fluxo de Pedido (Delivery)
\`\`\`
pages/CardapioCliente.js
  → components/cliente/ProdutoCard.jsx
  → components/cliente/ProductDetailModal.jsx
  → components/cliente/PixCheckout.jsx
      → components/cliente/MercadoPagoHelper.jsx
          → functions/criarPagamentoMercadoPago (backend)
              → Mercado Pago API
  → entities/Pedido (base44.entities.Pedido.create)
  → entities/Cliente (base44.entities.Cliente.filter)

pages/AcompanharPedido.js
  → entities/Pedido (base44.entities.Pedido.filter)
  → entities/Entrega (base44.entities.Entrega.filter)

pages/PagamentoSucesso.js / PagamentoFalha.js
  → functions/processarPagamentoMercadoPago (backend)
\`\`\`

### Fluxo de Gestão (Painel Admin)
\`\`\`
pages/Pedidos.js
  → components/pedidos/PedidoModal.jsx
  → components/pedidos/AtribuirEntregaModal.jsx
  → components/pedidos/NotificacaoHelper.jsx
  → entities/Pedido
  → entities/Entrega
  → entities/Entregador
  → entities/Notificacao

pages/Entregadores.js
  → components/dashboard/EntregadorCard.jsx
  → entities/Entregador
  → entities/Entrega

pages/MapaTempoReal.js
  → react-leaflet (OpenStreetMap)
  → entities/Entregador
  → entities/Entrega
  → entities/HistoricoLocalizacao

pages/Financeiro.js
  → entities/Pedido
  → entities/Custo
  → entities/Entrega

pages/Configuracoes.js
  → components/configuracoes/MapaRaioEntrega.jsx
  → components/configuracoes/TestarMercadoPago.jsx
  → components/configuracoes/TestarWebhookMercadoPago.jsx
  → functions/testarMercadoPago (backend)
  → functions/enviarWebhookMercadoPagoTeste (backend)
  → entities/Pizzaria
\`\`\`

### Fluxo do Entregador
\`\`\`
pages/AppEntregador.js
  → components/entregador/RotaOtimizadaCard.jsx
  → components/entregador/useGeoTracking.jsx
      → Navigator Geolocation API
  → entities/Entregador
  → entities/Entrega
  → entities/HistoricoLocalizacao
  → entities/RegistroEntrega
  → functions/otimizarRotaEntregador (backend)
\`\`\`

### Proteção de Rotas
\`\`\`
Layout.js
  → components/RouteGuard.jsx
      → base44.auth.me()
      → entities/Pizzaria (verifica pizzaria_id do user)
\`\`\`

---

## 5. FUNÇÕES BACKEND (API ENDPOINTS)

| Função | Método | Descrição |
|--------|--------|-----------|
| criarPagamentoMercadoPago | POST | Cria preferência de pagamento no MP |
| processarPagamentoMercadoPago | POST | Processa retorno de pagamento |
| webhookMercadoPago | POST | Recebe notificações de pagamento do MP |
| geocodificarEndereco | POST | Geocodifica endereço via API |
| uploadLogoEstabelecimento | POST | Faz upload de imagem/logo |
| gerarSenhasTemporarias | POST | Gera senhas temporárias em lote |
| gerarNovaSenha | POST | Gera nova senha temporária |
| atualizarSenhaEstabelecimento | POST | Atualiza senha do cliente |
| gerarImagensProdutos | POST | Gera imagem de produto via IA |
| gerarImagensProdutosLote | POST | Gera imagens em lote via IA |
| otimizarRotaEntregador | POST | Otimiza rota de entrega |
| testarMercadoPago | POST | Valida credenciais do MP |
| enviarWebhookMercadoPagoTeste | POST | Dispara teste de webhook |

**Base URL dos endpoints:** \`/api/functions/{nome_da_funcao}\`

---

## 6. INTEGRAÇÕES EXTERNAS

| Serviço | Uso |
|---------|-----|
| **Mercado Pago** | Pagamentos online (PIX, cartão) |
| **OpenStreetMap + Leaflet** | Mapas interativos |
| **ViaCEP API** | Consulta de endereços por CEP |
| **Base44 AI (InvokeLLM)** | Geração de imagens e textos via IA |
| **Base44 Storage** | Armazenamento de imagens/logos |
| **Browser Geolocation API** | Rastreamento GPS dos entregadores |
| **WhatsApp** | Links para comunicação com entregadores |
| **Google Maps / Waze** | Links de navegação para entregadores |

---

## 7. FLUXOS PRINCIPAIS DO SISTEMA

### 7.1 Fluxo de Criação de Pedido (Cliente)
\`\`\`
1. Cliente acessa CardapioCliente (/cardapio?pizzaria={id})
2. Seleciona produtos → ProductDetailModal (personalizações)
3. Preenche endereço de entrega
4. Escolhe forma de pagamento:
   a. PIX/Cartão Online → criarPagamentoMercadoPago()
      → Redireciona para checkout MP
      → Retorna para PagamentoSucesso/Falha
      → webhookMercadoPago atualiza status_pagamento
   b. Dinheiro/Cartão na entrega → pedido criado direto
5. Pedido criado com status "novo" em entities/Pedido
6. Notificação enviada ao estabelecimento
\`\`\`

### 7.2 Fluxo de Atribuição de Entregador
\`\`\`
1. Pedido chega com status "novo" na página Pedidos
2. Operador muda status para "em_preparo"
3. Quando pronto, status → "pronto"
4. Modal AtribuirEntregaModal é aberto
5. Seleciona entregador disponível
6. Cria registro em entities/Entrega com status "pendente"
7. Notificação enviada ao entregador via entities/Notificacao
8. Entregador vê entrega no AppEntregador e aceita/recusa
9. Status Entrega → "aceita" → "em_rota" → "entregue"
10. Pedido status → "em_entrega" → "entregue"
\`\`\`

### 7.3 Fluxo de Autenticação
\`\`\`
Multi-tenant com 3 tipos de autenticação:

A. Usuários do Painel (Base44 Auth):
   - Email/senha via Base44 Auth
   - Roles: admin / user
   - RouteGuard verifica role e pizzaria_id

B. Entregadores (Custom Auth):
   - Login por telefone em AppEntregador
   - Verifica entities/Entregador por telefone
   - Persiste sessão em localStorage

C. Clientes Finais (Custom Auth):
   - Login por email/telefone em AcessoCliente
   - Verifica entities/Cliente
   - Persiste sessão em localStorage
   - Senha gerenciada pelo estabelecimento
\`\`\`

### 7.4 Fluxo de Rastreamento de Entrega
\`\`\`
1. Entregador inicia entrega no AppEntregador
2. useGeoTracking.jsx ativa GPS do dispositivo
3. Coordenadas salvas em entities/HistoricoLocalizacao
4. entities/Entregador.latitude/longitude atualizados
5. MapaTempoReal exibe posição em tempo real
6. AcompanharPedido mostra posição para o cliente
\`\`\`

---

## 8. MODELO MULTI-TENANT

O sistema é uma plataforma SaaS onde cada estabelecimento é um tenant isolado:

- Todos os dados têm o campo \`pizzaria_id\` para isolamento
- Usuários do painel têm \`pizzaria_id\` no perfil
- RouteGuard verifica se o usuário pertence ao estabelecimento
- Administradores da plataforma (role=admin) têm acesso global
- Painel AdminUsers (/admin) é exclusivo para admins da plataforma
- Cada estabelecimento tem suas próprias credenciais do Mercado Pago

---

## 9. DADOS ATUAIS DO SISTEMA

**Data de exportação:** ${dataAtual} às ${horaAtual}

| Métrica | Quantidade |
|---------|-----------|
| Usuários cadastrados | ${usuarios.length} |
| Estabelecimentos | ${estabelecimentos.length} |
| Estabelecimentos ativos | ${estabelecimentos.filter(e => e.status === 'ativa').length} |
| Plano Básico | ${estabelecimentos.filter(e => e.plano === 'basico').length} |
| Plano Profissional | ${estabelecimentos.filter(e => e.plano === 'profissional').length} |
| Plano Enterprise | ${estabelecimentos.filter(e => e.plano === 'enterprise').length} |

### Estabelecimentos Cadastrados
${estabelecimentos.map(e => `- **${e.nome}** | ${e.cidade || 'N/A'}-${e.estado || 'N/A'} | Plano: ${e.plano || 'básico'} | Status: ${e.status} | ID: ${e.id}`).join('\n') || '- Nenhum estabelecimento cadastrado'}

### Usuários do Sistema
${usuarios.map(u => `- **${u.full_name || 'Sem nome'}** | ${u.email} | Role: ${u.role}`).join('\n') || '- Nenhum usuário encontrado'}

---

## 10. DEPENDÊNCIAS DO PROJETO (PRINCIPAIS)

\`\`\`json
{
  "frontend": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.26.0",
    "@tanstack/react-query": "^5.84.1",
    "tailwindcss": "latest",
    "framer-motion": "^11.16.4",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.15.4",
    "lucide-react": "^0.475.0",
    "moment": "^2.30.1",
    "date-fns": "^3.6.0",
    "sonner": "^2.0.1",
    "react-hook-form": "^7.54.2",
    "zod": "^3.24.2",
    "@hello-pangea/dnd": "^17.0.0",
    "react-input-mask": "^2.0.4",
    "mercadopago": "^2.0.0"
  },
  "platform": {
    "@base44/sdk": "^0.8.3",
    "@base44/vite-plugin": "^0.2.5"
  }
}
\`\`\`

---

*Documento gerado automaticamente pelo NinjaGO Admin Panel*
*© ${new Date().getFullYear()} NinjaGO Delivery*
`;

    const blob = new Blob([doc], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ninjago-documentacao-tecnica-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={handleExportar}
      variant="outline"
      className="border-slate-600 text-slate-100 hover:bg-slate-700 gap-2"
    >
      <Download className="w-4 h-4" />
      Exportar Estrutura
    </Button>
  );
}