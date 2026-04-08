# 📋 RELATÓRIO TÉCNICO DE ARQUITETURA — NinjaGO Delivery
### Versão 2.0 — Auditoria para Migração
> Gerado em: 08/04/2026 | Timezone: America/Sao_Paulo

---

## ÍNDICE
1. [Arquitetura de Pastas](#1-arquitetura-de-pastas)
2. [Dicionário de Dados](#2-dicionário-de-dados)
3. [Mapa de Endpoints (Backend Functions)](#3-mapa-de-endpoints-backend-functions)
4. [Dependências e Conectores Externos](#4-dependências-e-conectores-externos)
5. [Lógica de Negócio: Fluxo Completo do Pedido](#5-lógica-de-negócio-fluxo-completo-do-pedido)
6. [Guia de Migração para Node.js Externo](#6-guia-de-migração-para-nodejs-externo)
7. [Dicas Extras de Migração para Plataforma Própria](#7-dicas-extras-de-migração-para-plataforma-própria)

---

## 1. ARQUITETURA DE PASTAS

```
/ (raiz)
├── index.html                         # Ponto de entrada HTML (Vite)
├── tailwind.config.js                 # Configuração do Tailwind CSS
├── index.css                          # Variáveis globais de design (tokens CSS)
├── App.jsx                            # Roteador principal (React Router v6)
├── main.jsx                           # Bootstrap do React
├── pages.config.js                    # Registro de páginas (legado, app migrou para App.jsx)
├── DOCUMENTACAO_NINJAGO.md            # Documentação V1
├── DOCUMENTACAO_TECNICA_V2.md         # Este arquivo
│
├── src/
│   ├── pages/                         # Páginas completas (uma por rota)
│   │   ├── Home.jsx                   # Landing page pública
│   │   ├── AcessoAdmin.jsx            # Login de administrador master
│   │   ├── AcessoUsuario.jsx          # Login de operadores do estabelecimento
│   │   ├── AcessoCliente.jsx          # Login de clientes no cardápio
│   │   ├── AdminUsers.jsx             # Gerenciamento de usuários (superadmin)
│   │   ├── Pedidos.jsx                # Dashboard Kanban de pedidos
│   │   ├── NovoPedido.jsx             # PDV / criação manual de pedido
│   │   ├── Cozinha.jsx                # Visão da cozinha (KDS)
│   │   ├── Produtos.jsx               # Cadastro de cardápio
│   │   ├── Entregadores.jsx           # Gerenciamento de entregadores
│   │   ├── EntregadorDetalhe.jsx      # Perfil e histórico do entregador
│   │   ├── EntregasHoje.jsx           # Lista de entregas do dia
│   │   ├── MapaTempoReal.jsx          # Mapa ao vivo dos entregadores
│   │   ├── AppEntregador.jsx          # PWA do entregador (app mobile)
│   │   ├── Financeiro.jsx             # Hub financeiro (KPIs + navegação)
│   │   ├── ControleComandas.jsx       # Conferência financeira de pedidos
│   │   ├── FluxoDeCaixa.jsx           # Receitas x Despesas
│   │   ├── Relatorios.jsx             # Relatórios analíticos
│   │   ├── Clientes.jsx               # Listagem e perfil de clientes
│   │   ├── Estoque.jsx                # Hub de estoque (tabs: atual, compras, histórico, CMV)
│   │   ├── Configuracoes.jsx          # Painel de configurações do estabelecimento
│   │   ├── ConfiguracoesFinanceiras.jsx # Config taxas de pagamento
│   │   ├── Integracoes.jsx            # Config de integrações (iFood, Mercado Pago)
│   │   ├── ProgramaFidelidade.jsx     # Gerenciamento de pontos e recompensas
│   │   ├── Dashboard.jsx              # Dashboard geral de métricas
│   │   ├── CardapioCliente.jsx        # Cardápio público + checkout (página principal cliente)
│   │   ├── AcompanharPedido.jsx       # Rastreamento do pedido pelo cliente
│   │   ├── PerfilCliente.jsx          # Perfil do cliente com histórico
│   │   ├── NotificacoesCliente.jsx    # Central de notificações do cliente
│   │   ├── PagamentoSucesso.jsx       # Retorno de pagamento aprovado (MP)
│   │   ├── PagamentoFalha.jsx         # Retorno de pagamento recusado (MP)
│   │   ├── CriarNovaSenha.jsx         # Redefinição de senha
│   │   └── Pagamentos.jsx             # Pagamentos de entregadores
│   │
│   ├── components/                    # Componentes reutilizáveis
│   │   ├── ui/                        # Biblioteca de UI (Shadcn/ui)
│   │   │   ├── button.jsx, input.jsx, card.jsx, dialog.jsx
│   │   │   ├── select.jsx, switch.jsx, badge.jsx, tabs.jsx
│   │   │   ├── table.jsx, toast.jsx, toaster.jsx, sonner.jsx
│   │   │   ├── calendar.jsx, checkbox.jsx, label.jsx, textarea.jsx
│   │   │   └── ... (30+ componentes UI)
│   │   │
│   │   ├── configuracoes/             # Componentes da página de configurações
│   │   │   ├── PagamentoTab.jsx       # Aba de formas de pagamento
│   │   │   ├── ClientesTab.jsx        # Aba de clientes cadastrados
│   │   │   ├── MapaRaioEntrega.jsx    # Mapa interativo de raio de entrega
│   │   │   ├── TestarMercadoPago.jsx  # Teste de integração MP
│   │   │   └── TestarWebhookMercadoPago.jsx
│   │   │
│   │   ├── cliente/                   # Componentes do cardápio cliente
│   │   │   ├── ProductDetailModal.jsx # Modal de detalhes + personalização
│   │   │   ├── ProdutoCard.jsx        # Card de produto no cardápio
│   │   │   ├── PixCheckout.jsx        # Checkout PIX com QR Code
│   │   │   ├── MercadoPagoHelper.jsx  # Helper de tokenização de cartão
│   │   │   └── NinjaAnimation.jsx     # Animação de mascote
│   │   │
│   │   ├── pedidos/                   # Componentes do módulo de pedidos
│   │   │   ├── PedidoModal.jsx        # Modal de detalhes/edição do pedido
│   │   │   ├── AtribuirEntregaModal.jsx # Modal para atribuir entregador
│   │   │   └── NotificacaoHelper.jsx  # Utilitário de notificações de status
│   │   │
│   │   ├── entregador/                # Componentes do app do entregador
│   │   │   ├── PagamentoCard.jsx      # Card de pagamento do entregador
│   │   │   ├── RotaOtimizadaCard.jsx  # Sugestão de rota otimizada
│   │   │   └── useGeoTracking.jsx     # Hook de geolocalização em tempo real
│   │   │
│   │   ├── estoque/                   # Componentes de estoque
│   │   │   ├── EstoqueAtual.jsx       # Grid de itens em estoque
│   │   │   ├── RegistrarCompra.jsx    # Modal de entrada de compra
│   │   │   ├── HistoricoMovimentacoes.jsx # Timeline de movimentações
│   │   │   └── ComposicaoProdutos.jsx # Ficha técnica de produtos
│   │   │
│   │   ├── dashboard/                 # Componentes de dashboard
│   │   │   ├── StatsCard.jsx, EntregaCard.jsx, EntregadorCard.jsx
│   │   │
│   │   ├── integracoes/
│   │   │   └── IfoodConfig.jsx        # Configuração da integração iFood
│   │   │
│   │   ├── produtos/
│   │   │   └── OpcoesPersonalizacaoManager.jsx # Gerenciador de complementos
│   │   │
│   │   ├── admin/
│   │   │   ├── ExportarEstrutura.jsx  # Exportação de dados
│   │   │   └── ModalCadastroUsuario.jsx
│   │   │
│   │   ├── RouteGuard.jsx             # Proteção de rotas por autenticação
│   │   └── UserNotRegisteredError.jsx
│   │
│   ├── functions/                     # Backend Functions (Deno Deploy)
│   │   ├── obterConfigPublicaPizzaria # Retorna config pública do estabelecimento
│   │   ├── toggleStatusLoja           # Abre/fecha loja manualmente
│   │   ├── confirmarPedido            # (inferido) Cria pedido com validação de loja aberta
│   │   ├── criarPagamentoMercadoPago  # Cria preferência de pagamento (Checkout Pro)
│   │   ├── webhookMercadoPago         # Recebe notificações de pagamento do MP
│   │   ├── processarPagamentoMercadoPago # Processa pagamento com cartão tokenizado
│   │   ├── geocodificarEndereco       # Converte endereço ↔ lat/lng via Nominatim
│   │   ├── calcularRotaEntrega        # Calcula rota e distância para entrega
│   │   ├── otimizarRotaEntregador     # Otimiza múltiplas rotas de entrega
│   │   ├── criarNotificacaoPedido     # Cria notificação interna de pedido (trigger)
│   │   ├── ifoodPolling               # Polling de novos pedidos iFood
│   │   ├── gerarImagensProdutos       # Gera imagens de produtos com IA
│   │   ├── gerarImagensProdutosLote   # Gera imagens em lote
│   │   ├── gerarNovaSenha             # Gera senha temporária para estabelecimento
│   │   ├── gerarSenhasTemporarias     # Gera senhas em lote
│   │   ├── atualizarSenhaEstabelecimento # Atualiza senha do estabelecimento
│   │   ├── uploadLogoEstabelecimento  # Upload de logo
│   │   ├── enviarWebhookMercadoPagoTeste # Testa webhook do MP
│   │   ├── testarMercadoPago          # Testa credenciais do MP
│   │   └── webhookPedidoExterno       # Recebe pedidos de sistemas externos
│   │
│   ├── api/
│   │   ├── base44Client.js            # SDK client pré-configurado
│   │   ├── entities.js                # Helpers de acesso a entidades
│   │   └── integrations.js            # Helpers de integrações
│   │
│   ├── lib/
│   │   ├── AuthContext.jsx            # Contexto de autenticação Base44
│   │   ├── query-client.js            # Instância do TanStack Query
│   │   ├── utils.js                   # Utilitários (cn, etc.)
│   │   ├── app-params.js              # Parâmetros da aplicação
│   │   ├── NavigationTracker.jsx      # Rastreamento de navegação
│   │   ├── VisualEditAgent.jsx        # Agente de edição visual (Base44)
│   │   └── PageNotFound.jsx           # Página 404
│   │
│   ├── hooks/
│   │   └── use-mobile.jsx             # Hook de detecção de dispositivo mobile
│   │
│   └── utils/
│       ├── index.ts                   # Utilitários gerais
│       └── imprimirPedido.js          # Utilitário de impressão de comanda
│
└── entities/                          # Schemas JSON das entidades do banco
    ├── Pizzaria.json
    ├── Pedido.json
    ├── Produto.json
    ├── Cliente.json
    ├── Entregador.json
    ├── Entrega.json
    ├── EstoqueItem.json
    ├── MovimentacaoEstoque.json
    ├── ComposicaoProduto.json
    ├── Notificacao.json
    ├── Pagamento.json
    ├── RegistroEntrega.json
    ├── HistoricoLocalizacao.json
    ├── CupomDesconto.json
    ├── MetodoPagamento.json
    ├── Recompensa.json
    ├── ResgatePontos.json
    └── Custo.json
```

---

## 2. DICIONÁRIO DE DADOS

### 🏪 Pizzaria (Estabelecimento)
> Entidade central do sistema. Cada estabelecimento é uma Pizzaria.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string (auto) | Identificador único |
| `nome` | string* | Nome interno do estabelecimento |
| `nome_exibicao_cliente` | string | Nome exibido no cardápio público |
| `cnpj` | string | CNPJ |
| `telefone` | string* | Telefone principal |
| `email` | string | E-mail de contato |
| `endereco` | string* | Logradouro |
| `numero`, `complemento`, `bairro`, `cidade`, `estado`, `cep` | string | Endereço completo |
| `latitude`, `longitude` | number | Coordenadas para cálculo de entrega |
| `logo_url` | string | URL do logo |
| `tema_cliente` | enum: `light`\|`dark` | Tema visual do cardápio |
| `cor_primaria_cliente` | string | Cor hex do tema (ex: `#f97316`) |
| `horario_abertura`, `horario_fechamento` | string | Formato HH:MM |
| `taxa_entrega_base` | number | Taxa base de entrega em R$ |
| `raio_entrega_km` | number | Raio base de entrega em km |
| `raio_maximo_atendimento_km` | number | Raio máximo (0 = sem limite) |
| `taxa_adicional_por_km` | number | Taxa adicional por km excedente |
| `valor_minimo_entrega_gratis` | number | Valor mínimo para frete grátis |
| `entrega_gratis_dentro_raio_base` | boolean | Frete grátis dentro do raio base |
| `status` | enum: `ativa`\|`inativa`\|`suspensa` | Status da conta |
| `plano` | enum: `basico`\|`profissional`\|`enterprise` | Plano contratado |
| `configuracoes` | object | Objeto de configurações (ver abaixo) |
| `configuracoes.loja_aberta` | boolean\|null | Override manual: `true`=aberta, `false`=fechada, `null`=usa horário |
| `configuracoes.horarios_semana` | object | Horários por dia da semana |
| `configuracoes.aceitar_pix` | boolean | Aceita PIX |
| `configuracoes.aceitar_cartao` | boolean | Aceita cartão |
| `configuracoes.aceitar_dinheiro` | boolean | Aceita dinheiro |
| `configuracoes.tempo_medio_preparo` | number | Tempo médio em minutos |
| `configuracoes.mp_public_key` | string | Mercado Pago Public Key (segura, exposta ao frontend) |
| `configuracoes.mp_access_token` | string | **SENSÍVEL** — Mercado Pago Access Token (apenas backend) |
| `configuracoes.mp_credenciais_salvas` | boolean | Flag de configuração do MP |
| `configuracoes.dominio_personalizado` | string | Subdomínio customizado |
| `ifood_client_id`, `ifood_client_secret` | string | Credenciais iFood OAuth |
| `ifood_merchant_id` | string | ID do estabelecimento no iFood |
| `ifood_access_token` | string | Token OAuth iFood (auto-renovado) |
| `ifood_token_expires_at` | datetime | Expiração do token iFood |
| `ifood_polling_ativo` | boolean | Se o polling iFood está habilitado |
| `dados_bancarios` | object | Dados bancários para pagamento de entregadores |
| `senha` | string | **SENSÍVEL** — Senha de acesso do estabelecimento |
| `eh_senha_temporaria` | boolean | Se a senha atual é temporária |

**Relacionamentos:** `Pizzaria` → `Pedido` (1:N), `Produto` (1:N), `Cliente` (1:N), `Entregador` (1:N), `CupomDesconto` (1:N), `Recompensa` (1:N), `Custo` (1:N), `Notificacao` (1:N)

---

### 📦 Pedido
> Entidade principal de transação. Representa um pedido completo.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string (auto) | Identificador único |
| `pizzaria_id` | string | FK → Pizzaria |
| `numero_pedido` | string | Número sequencial diário (ex: "01", "02") |
| `tipo_pedido` | enum: `delivery`\|`balcao` | Modalidade |
| `origem` | enum: `balcao`\|`telefone`\|`whatsapp`\|`ifood`\|`app`\|`site` | Canal de origem |
| `cliente_nome` | string* | Nome do cliente |
| `cliente_telefone` | string* | Telefone |
| `cliente_cep`, `cliente_endereco`, `cliente_numero`, `cliente_bairro`, `cliente_cidade`, `cliente_estado`, `cliente_complemento`, `cliente_referencia` | string | Endereço de entrega |
| `latitude`, `longitude` | number | Coordenadas do endereço |
| `itens` | array | Lista de produtos: `{produto_id, nome, quantidade, preco_unitario, observacao}` |
| `valor_produtos` | number | Subtotal dos produtos |
| `taxa_entrega` | number | Taxa de entrega cobrada |
| `desconto` | number | Valor de desconto aplicado |
| `valor_total` | number* | Total do pedido |
| `forma_pagamento` | enum: `dinheiro`\|`pix`\|`cartao_credito`\|`cartao_debito`\|`vale_refeicao`\|`online`\|`outro` | |
| `status_pagamento` | enum: `pendente`\|`pago`\|`receber_depois`\|`cancelado` | |
| `troco_para` | number | Valor para troco (pagamento em dinheiro) |
| `status` | enum: `novo`\|`em_preparo`\|`pronto`\|`em_entrega`\|`entregue`\|`finalizada`\|`cancelado` | Status do fluxo |
| `observacoes` | string | Observações gerais |
| `observacoes_financeiras` | string | Notas da conferência financeira |
| `comprovante_url` | string | URL do comprovante de pagamento |
| `conferido_por` | string | Email do operador que conferiu |
| `data_conferencia` | datetime | Data da conferência |
| `horario_pedido` | datetime | Quando o pedido foi criado |
| `horario_pronto` | datetime | Quando ficou pronto |

**Relacionamentos:** `Pedido` → `Pizzaria` (N:1), → `Entrega` (1:1), → `MovimentacaoEstoque` (1:N)

---

### 🍕 Produto (Cardápio)
| Campo | Tipo | Descrição |
|---|---|---|
| `restaurante_id` | string | FK → Pizzaria |
| `nome` | string* | Nome do produto |
| `descricao` | string | Descrição |
| `categoria` | enum | `pizza`\|`esfiha`\|`lanche`\|`bebida`\|`acai`\|`combo`\|`sobremesa`\|`porcao`\|`salgado`\|`doce`\|`outro` |
| `preco` | number* | Preço atual |
| `preco_original` | number | Preço antes de promoção |
| `em_promocao` | boolean | Se está em promoção |
| `imagem_url` | string | URL da imagem |
| `disponivel` | boolean | Se está disponível para compra |
| `destaque` | boolean | Se aparece em destaque |
| `ordem` | number | Posição de exibição na categoria |
| `opcoes_personalizacao` | array | Grupos de complementos/adicionais (ver abaixo) |

**opcoes_personalizacao (cada item):**
```json
{
  "nome_grupo": "Complementos Grátis",
  "obrigatorio": false,
  "min_selecoes": 0,
  "max_selecoes": 3,
  "permite_precificacao": true,
  "itens": [{ "nome": "Queijo extra", "preco_adicional": 2.50, "disponivel": true }]
}
```

---

### 👤 Cliente
| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria |
| `nome` | string* | Nome completo |
| `telefone` | string* | Telefone (usado como login) |
| `senha` | string* | **SENSÍVEL** — senha de acesso |
| `email` | string | E-mail |
| `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado` | string | Endereço salvo |
| `latitude`, `longitude` | number | Coordenadas do endereço |
| `total_pedidos` | number | Contador de pedidos realizados |
| `pontos_fidelidade` | number | Pontos acumulados no programa |

---

### 🛵 Entregador
| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria |
| `nome` | string* | Nome |
| `email`, `telefone`, `cpf` | string | Contato e documentação |
| `foto_url` | string | Foto de perfil |
| `veiculo` | enum: `moto`\|`carro`\|`bicicleta`\|`a_pe` | |
| `placa_veiculo` | string | Placa do veículo |
| `status` | enum: `disponivel`\|`em_entrega`\|`offline`\|`pausado` | Status em tempo real |
| `latitude`, `longitude` | number | Posição atual (atualizada pelo app) |
| `ultima_localizacao` | datetime | Timestamp da última atualização GPS |
| `saldo_taxas` | number | Saldo a receber de taxas |
| `total_entregas` | number | Contador histórico |
| `avaliacao_media` | number | Média de avaliações |
| `ativo` | boolean | Se está ativo no sistema |
| `dados_bancarios` | object | `{banco, agencia, conta, pix}` |

---

### 🚚 Entrega
> Registro de entrega atribuída ao entregador. Criada a partir de um Pedido.

| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria |
| `pedido_id` | string* | FK → Pedido |
| `entregador_id` | string* | FK → Entregador |
| `numero_pedido` | string | Snapshot do número |
| `cliente_nome`, `cliente_telefone` | string | Snapshot do cliente |
| `endereco_completo`, `bairro` | string | Endereço de entrega |
| `latitude_destino`, `longitude_destino` | number | Coordenadas de destino |
| `valor_pedido` | number* | Valor total |
| `taxa_entregador` | number | Valor que o entregador receberá |
| `forma_pagamento` | string | Forma de pagamento |
| `troco_para` | number | Troco solicitado |
| `status` | enum: `pendente`\|`aceita`\|`em_rota`\|`entregue`\|`recusada`\|`cancelada` | |
| `dinheiro_prestado` | boolean | Se dinheiro coletado foi prestado |
| `horario_atribuicao`, `horario_aceite`, `horario_saida`, `horario_entrega` | datetime | Timeline da entrega |
| `tempo_entrega_minutos`, `distancia_km` | number | Métricas |
| `assinatura_cliente` | string | URL de assinatura digital |
| `foto_comprovante` | string | URL de foto comprovante |
| `avaliacao_cliente` | number | Nota do cliente |
| `rota_log` | array | Log de pontos GPS `[{lat, lng, timestamp}]` |

---

### 📍 HistoricoLocalizacao
> Rastro GPS do entregador durante uma entrega.

| Campo | Tipo | Descrição |
|---|---|---|
| `entregador_id` | string | FK → Entregador |
| `entrega_id` | string | FK → Entrega |
| `latitude`, `longitude` | number | Posição |
| `velocidade`, `precisao`, `bateria` | number | Métricas do dispositivo |

---

### 📦 EstoqueItem
| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria |
| `nome` | string* | Nome do insumo |
| `categoria` | enum | `insumos`\|`descartaveis`\|`limpeza`\|`embalagens`\|`bebidas`\|`outros` |
| `unidade_medida` | enum | `unidade`\|`kg`\|`g`\|`litro`\|`ml`\|`cx`\|`pacote`\|`saco`\|`fardo` |
| `quantidade_atual` | number | Saldo atual |
| `custo_unitario_medio` | number | Custo médio ponderado |
| `alerta_minimo` | number | Threshold para alerta de estoque baixo |

---

### 🔄 MovimentacaoEstoque
| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria |
| `estoque_item_id` | string* | FK → EstoqueItem |
| `tipo` | enum: `entrada`\|`saida`\|`ajuste` | |
| `motivo` | enum | `compra`\|`venda`\|`perda`\|`vencimento`\|`ajuste_manual`\|`devolucao` |
| `quantidade` | number* | Quantidade movimentada (sempre positivo) |
| `custo_unitario`, `custo_total` | number | Valores do movimento |
| `quantidade_anterior`, `quantidade_posterior` | number | Saldo antes e depois |
| `pedido_id` | string | FK → Pedido (quando saída por venda) |
| `nota_compra` | string | Número da NF ou referência |

---

### 🧾 ComposicaoProduto (Ficha Técnica)
| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria |
| `produto_id` | string* | FK → Produto |
| `produto_nome` | string | Snapshot do nome |
| `itens` | array | `[{estoque_item_id, nome, quantidade, unidade_medida}]` |
| `custo_producao` | number | Custo calculado para 1 unidade |
| `preco_venda` | number | Preço de venda atual |
| `margem_percentual` | number | Margem de lucro em % |

---

### 🔔 Notificacao
| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria |
| `destinatario_id` | string | ID do usuário/entregador |
| `tipo` | enum | `nova_entrega`\|`entrega_aceita`\|`entrega_concluida`\|`mensagem`\|`alerta`\|`sistema` |
| `titulo`, `mensagem` | string* | Conteúdo |
| `dados` | object | Payload extra (pedido_id, etc.) |
| `lida` | boolean | Se foi lida |
| `url_acao` | string | Link de ação |

---

### 💰 Pagamento (Entregadores)
| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id`, `entregador_id` | string | FKs |
| `valor` | number* | Valor a pagar |
| `periodo_inicio`, `periodo_fim` | date | Período de referência |
| `quantidade_entregas` | number | Quantidade de entregas no período |
| `status` | enum: `pendente`\|`pago`\|`cancelado` | |
| `data_pagamento` | datetime | Quando foi pago |
| `comprovante_url` | string | URL do comprovante |

---

### 🎟️ CupomDesconto
| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria |
| `codigo` | string* | Código do cupom (ex: "PROMO10") |
| `tipo` | enum: `valor`\|`percentual` | |
| `valor` | number* | Desconto em R$ ou % |
| `ativo` | boolean | Se está ativo |

---

### 🏆 Recompensa e ResgatePontos (Programa de Fidelidade)
**Recompensa:**
| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria |
| `titulo`, `descricao` | string | Identificação |
| `pontos_necessarios` | number* | Custo em pontos |
| `tipo` | enum | `desconto_percentual`\|`desconto_valor`\|`produto_gratis`\|`entrega_gratis`\|`upgrade` |
| `valor_desconto`, `produto_id` | number\|string | Configuração do benefício |
| `ativa`, `quantidade_disponivel`, `validade_dias` | mixed | Controles |

**ResgatePontos:**
| Campo | Tipo | Descrição |
|---|---|---|
| `cliente_id`, `recompensa_id` | string | FKs |
| `pontos_gastos` | number* | Pontos usados |
| `codigo_cupom` | string* | Cupom gerado único |
| `status` | enum: `ativo`\|`usado`\|`expirado` | |
| `pedido_id` | string | FK → Pedido onde foi usado |

---

### 💸 Custo
| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria |
| `descricao` | string* | Descrição da despesa |
| `valor` | number* | Valor |
| `data` | date* | Data da despesa |
| `categoria` | enum | `operacional`\|`marketing`\|`salarios`\|`insumos`\|`aluguel`\|`energia`\|`agua`\|`internet`\|`manutencao`\|`impostos`\|`outros` |
| `tipo` | enum: `fixo`\|`variavel` | |
| `recorrente` | boolean | Se é recorrente |

---

### 📋 MetodoPagamento
| Campo | Tipo | Descrição |
|---|---|---|
| `restaurante_id` | string | FK → Pizzaria |
| `nome` | string* | Nome do método |
| `tipo` | enum | `dinheiro`\|`cartao_credito`\|`cartao_debito`\|`pix`\|`online`\|`vale_refeicao`\|`outro` |
| `ativo` | boolean | Se está habilitado |
| `instrucoes` | string | Instruções para o entregador/cliente |

---

## 3. MAPA DE ENDPOINTS (BACKEND FUNCTIONS)

> Todas as funções são expostas via **HTTP POST** (exceto quando indicado).
> URL base: `https://<app-id>.base44.app/api/functions/<nome-da-funcao>`

| Função | Método | Payload de Entrada | Retorno | Descrição |
|---|---|---|---|---|
| `obterConfigPublicaPizzaria` | POST | `{ pizzariaId }` | `{ success, pizzaria }` | Retorna config pública do estabelecimento para o cardápio. Usa `.get()` (não requer autenticação). |
| `toggleStatusLoja` | POST | `{ pizzariaId, lojaAberta: boolean\|null }` | `{ success, configuracoes }` | Abre ou fecha a loja manualmente, sobrescrevendo o horário automático. |
| `criarPagamentoMercadoPago` | POST | `{ pedidoId, valorTotal, pizzariaId, clienteNome, clienteTelefone, clienteEmail, itens[] }` | `{ success, init_point, preference_id }` | Cria preferência de Checkout Pro no Mercado Pago. Salva preference_id no pedido. |
| `webhookMercadoPago` | POST | Payload do MP (query: `?pizzaria_id=`) | `{ received: true }` | Recebe notificações de pagamento do Mercado Pago. Atualiza `status_pagamento` e `status` do pedido. Cria notificação interna. |
| `processarPagamentoMercadoPago` | POST | `{ token, valor, pizzariaId, pedidoId, ... }` | `{ success, payment }` | Processa pagamento com token de cartão (Checkout Transparente MP). |
| `geocodificarEndereco` | POST | `{ endereco }` ou `{ latitude, longitude }` | `{ success, latitude, longitude, precisao }` | Converte endereço → coordenadas (ou reverso) via API Nominatim (OpenStreetMap). Sem custo. |
| `calcularRotaEntrega` | POST | `{ origem: {lat,lng}, destino: {lat,lng} }` | `{ distancia_km, tempo_minutos, rota }` | Calcula distância e rota de entrega. |
| `otimizarRotaEntregador` | POST | `{ entregas[], entregador: {lat,lng} }` | `{ rotas[], distancia_total }` | Ordena múltiplas entregas para otimizar rota. |
| `criarNotificacaoPedido` | POST | `{ event: {type}, data: Pedido }` | `{ success }` | Cria notificação interna de dashboard ao criar/atualizar pedido. Usado por automação de entidade. |
| `ifoodPolling` | POST | `{}` (sem payload) | `{ success, processadas, resultados[] }` | Polling de novos pedidos iFood para todas as pizzarias com `ifood_polling_ativo=true`. Mapeia e cria pedidos, faz ACK dos eventos. Executado por automação agendada. |
| `gerarImagensProdutos` | POST | `{ produtoId, nome, descricao }` | `{ success, imagem_url }` | Gera imagem do produto com IA (InvokeLLM/GenerateImage). |
| `gerarImagensProdutosLote` | POST | `{ pizzariaId }` | `{ success, geradas, erros }` | Gera imagens para todos os produtos sem imagem. |
| `gerarNovaSenha` | POST | `{ pizzariaId }` | `{ success, senha_temporaria }` | Gera senha temporária para o estabelecimento. |
| `gerarSenhasTemporarias` | POST | `{}` | `{ success, quantidade }` | Gera senhas para todos os estabelecimentos sem senha. |
| `atualizarSenhaEstabelecimento` | POST | `{ pizzariaId, senhaAtual, novaSenha }` | `{ success }` | Atualiza senha do estabelecimento com validação. |
| `uploadLogoEstabelecimento` | POST | `{ pizzariaId, file: base64 }` | `{ success, logo_url }` | Faz upload do logo e atualiza `logo_url` na pizzaria. |
| `enviarWebhookMercadoPagoTeste` | POST | `{ pizzariaId, paymentId }` | `{ success }` | Dispara um webhook de teste do Mercado Pago. |
| `testarMercadoPago` | POST | `{ pizzariaId }` | `{ success, detalhes }` | Valida as credenciais do Mercado Pago do estabelecimento. |
| `webhookPedidoExterno` | POST | `{ pizzariaId, pedido }` | `{ success, pedidoId }` | Recebe pedidos de sistemas externos (integração genérica). |

---

## 4. DEPENDÊNCIAS E CONECTORES EXTERNOS

### 📦 Bibliotecas Frontend (npm)

| Biblioteca | Versão | Uso |
|---|---|---|
| `react` + `react-dom` | ^18.2.0 | Framework UI |
| `react-router-dom` | ^6.26.0 | Roteamento SPA |
| `@tanstack/react-query` | ^5.84.1 | Cache e gerenciamento de estado servidor |
| `tailwindcss` | (via config) | Estilização utilitária |
| `lucide-react` | ^0.475.0 | Ícones |
| `framer-motion` | ^11.16.4 | Animações |
| `recharts` | ^2.15.4 | Gráficos financeiros |
| `react-leaflet` + `leaflet` | ^4.2.1 | Mapas interativos (raio de entrega, mapa ao vivo) |
| `@hello-pangea/dnd` | ^17.0.0 | Drag-and-drop (Kanban de pedidos) |
| `moment` | ^2.30.1 | Manipulação de datas |
| `date-fns` | ^3.6.0 | Utilitários de data |
| `react-hook-form` | ^7.54.2 | Gerenciamento de formulários |
| `zod` | ^3.24.2 | Validação de schemas |
| `react-quill` | ^2.0.0 | Editor de texto rico |
| `react-input-mask` | ^2.0.4 | Máscaras de input (CPF, CNPJ, telefone) |
| `react-markdown` | ^9.0.1 | Renderização de Markdown |
| `jspdf` | ^2.5.2 | Geração de PDFs |
| `html2canvas` | ^1.4.1 | Screenshots de HTML (para impressão) |
| `canvas-confetti` | ^1.9.4 | Animação de confete |
| `sonner` | ^2.0.1 | Toast notifications |
| `three` | ^0.171.0 | Renderização 3D |
| `mercadopago` | ^2.0.0 | SDK Mercado Pago (frontend tokenização) |
| `@base44/sdk` | ^0.8.24 | SDK da plataforma Base44 (auth, entities, integrations) |

### 🔌 Serviços Externos Integrados

| Serviço | Como Integra | Dados Necessários |
|---|---|---|
| **Mercado Pago** | API REST direto + SDK frontend | `mp_access_token` (por pizzaria), `mp_public_key` |
| **iFood** | API REST (polling) | `ifood_client_id`, `ifood_client_secret`, `ifood_merchant_id` |
| **Nominatim (OpenStreetMap)** | API REST pública | Sem chave (rate limit: 1 req/s, User-Agent obrigatório) |
| **Base44 Platform** | SDK (`@base44/sdk`) | `BASE44_APP_ID` (auto-injetado), auth por sessão |
| **Base44 LLM/AI** | `base44.integrations.Core.InvokeLLM` | Créditos da plataforma |
| **Base44 File Storage** | `base44.integrations.Core.UploadFile` | Créditos da plataforma |
| **Base44 Email** | `base44.integrations.Core.SendEmail` | Créditos da plataforma |

---

## 5. LÓGICA DE NEGÓCIO: FLUXO COMPLETO DO PEDIDO

### Do Carrinho ao Entregador — Passo a Passo Técnico

```
FASE 1: CARDÁPIO E CARRINHO (Frontend — CardapioCliente.jsx)
│
├─ 1. Cliente acessa /<pizzariaId> ou domínio personalizado
│     → Chama `obterConfigPublicaPizzaria({ pizzariaId })`
│     → Carrega: tema, cores, horários, configurações, loja_aberta
│
├─ 2. Verifica disponibilidade da loja:
│     a) Se `loja_aberta === false` → Banner "Loja Fechada", sem carrinho
│     b) Se `loja_aberta === true` → Loja aberta (override manual)
│     c) Se `loja_aberta === null` → Verifica horário_abertura/fechamento atual
│
├─ 3. Carrega produtos via `base44.entities.Produto.filter({ restaurante_id })`
│     → Filtra por `disponivel === true`
│     → Agrupa por categoria
│
├─ 4. Cliente adiciona ao carrinho:
│     → Se produto tem `opcoes_personalizacao` → Abre ProductDetailModal
│     → Valida min/max seleções de cada grupo
│     → Calcula preco_unitario + preco_adicional dos complementos
│
├─ 5. Cart state: array de itens `{produto_id, nome, quantidade, preco_unitario, observacao, complementos[]}`

FASE 2: CHECKOUT (Frontend — CardapioCliente.jsx)
│
├─ 6. Cliente preenche dados de entrega:
│     → CEP → chama `geocodificarEndereco({ endereco: cepCompleto })`
│     → Recebe latitude/longitude do endereço
│
├─ 7. Calcula taxa de entrega:
│     a) Calcula distância entre coordenadas da pizzaria e do cliente (fórmula Haversine, client-side)
│     b) Se dentro de `raio_entrega_km`: aplica `taxa_entrega_base`
│     c) Se há `taxa_adicional_por_km`: adiciona por km excedente
│     d) Se `raio_maximo_atendimento_km > 0` e fora do raio: rejeita pedido
│     e) Se `valor_minimo_entrega_gratis` atingido: taxa = R$ 0
│
├─ 8. Valida cupom (se informado):
│     → `base44.entities.CupomDesconto.filter({ pizzaria_id, codigo, ativo: true })`
│     → Calcula desconto (valor fixo ou percentual)
│
├─ 9. Escolha de pagamento:
│     a) Dinheiro/PIX/Cartão físico → segue para criação do pedido diretamente
│     b) Pagamento online (Mercado Pago):
│        → Chama `criarPagamentoMercadoPago(...)` 
│        → Recebe `init_point` (URL de checkout)
│        → Redireciona cliente para o Checkout Pro do MP

FASE 3: CRIAÇÃO DO PEDIDO (Backend + Frontend)
│
├─ 10. Monta objeto do pedido:
│      {
│        pizzaria_id, numero_pedido (sequencial do dia),
│        cliente_nome, cliente_telefone, cliente_endereco, lat/lng,
│        itens[], valor_produtos, taxa_entrega, desconto, valor_total,
│        forma_pagamento, status_pagamento: "pendente",
│        status: "novo", origem: "site", horario_pedido: now()
│      }
│
├─ 11. (Pagamento Online) Webhook MP chega em `webhookMercadoPago`:
│      → Busca pizzaria pelo `pizzaria_id` (query param) para obter access_token
│      → Consulta `GET /v1/payments/{paymentId}` no MP
│      → Lê `external_reference` = pedidoId
│      → Atualiza `status_pagamento` do Pedido
│      → Se aprovado: `status` → "em_preparo"
│      → Cria Notificacao interna
│
├─ 12. Automação de Entidade dispara `criarNotificacaoPedido`:
│      → Trigger: Pedido criado (event.type = "create")
│      → Cria Notificacao `{tipo: "nova_entrega", titulo: "🛎️ Novo Pedido #XX"}`
│      → Aparece no sino do dashboard com badge laranja

FASE 4: OPERAÇÃO NO ESTABELECIMENTO (Frontend — Pedidos.jsx / Cozinha.jsx)
│
├─ 13. Operador vê pedido em `status: "novo"` no Kanban
│      → Real-time via `base44.entities.Pedido.subscribe()`
│      → Som de alerta no navegador
│
├─ 14. Operador avança status:
│      novo → em_preparo → pronto → em_entrega → entregue → finalizada
│      → Cada mudança: `base44.entities.Pedido.update(id, { status })`
│      → Automação dispara `criarNotificacaoPedido` novamente (update)
│
├─ 15. Cozinha.jsx exibe pedidos com status "novo" e "em_preparo" em KDS

FASE 5: ATRIBUIÇÃO DA ENTREGA (Frontend — AtribuirEntregaModal.jsx)
│
├─ 16. Operador clica em "Atribuir Entregador":
│      → Carrega entregadores com `status: "disponivel"` da mesma pizzaria
│      → Exibe lista com nome, veículo e avaliação
│
├─ 17. Ao confirmar atribuição:
│      a) Cria registro `Entrega`:
│         {
│           pizzaria_id, pedido_id, entregador_id,
│           endereco_completo, latitude_destino, longitude_destino,
│           valor_pedido, taxa_entregador, forma_pagamento,
│           status: "pendente", horario_atribuicao: now()
│         }
│      b) Atualiza `Entregador.status` → "em_entrega"
│      c) Cria `Notificacao` para o entregador

FASE 6: APP DO ENTREGADOR (Frontend — AppEntregador.jsx)
│
├─ 18. Entregador vê a entrega atribuída no app mobile (PWA)
│      → Aceita: `Entrega.status` → "aceita", `horario_aceite: now()`
│      → Sai para entrega: `Entrega.status` → "em_rota", `horario_saida: now()`
│      → GPS tracking ativo: salva em `HistoricoLocalizacao` + atualiza `Entregador.{lat,lng}`
│      → Conclui: `Entrega.status` → "entregue", `horario_entrega: now()`
│        → Atualiza `Entregador.status` → "disponivel"
│        → Incrementa `Entregador.total_entregas`
│        → Salva `RegistroEntrega` com métricas
│
├─ 19. Pedido atualiza: `status` → "entregue"

FASE 7: CONFERÊNCIA FINANCEIRA (Frontend — ControleComandas.jsx)
│
├─ 20. Operador financeiro confere o pedido:
│      → Valida comprovante de pagamento
│      → Registra `conferido_por`, `data_conferencia`
│      → `Pedido.status` → "finalizada"
│
└─ 21. Pedido finalizado entra nos KPIs de Financeiro.jsx (receita do mês)
```

---

## 6. GUIA DE MIGRAÇÃO PARA NODE.JS EXTERNO

### 🔐 Variáveis de Ambiente (.env) Necessárias

```env
# ──── BANCO DE DADOS ────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@host:5432/ninjago_db
# Alternativa MongoDB:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ninjago

# ──── AUTENTICAÇÃO ──────────────────────────────────────────────────
JWT_SECRET=sua_chave_jwt_super_secreta_256bits
JWT_EXPIRES_IN=7d
SESSION_SECRET=outra_chave_para_sessions

# ──── MERCADO PAGO ──────────────────────────────────────────────────
# (Armazenado por pizzaria no banco, mas pode ter fallback global)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxx-xxxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxxx-xxxx

# ──── IFOOD (por pizzaria, armazenado no banco) ─────────────────────
# Não precisa de variável de ambiente — é salvo por pizzaria no DB

# ──── EMAIL ─────────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=sua_senha_ou_app_password
# Alternativa (Resend, SendGrid, etc.):
RESEND_API_KEY=re_xxxxxxxxxxxx

# ──── ARMAZENAMENTO DE ARQUIVOS ─────────────────────────────────────
AWS_ACCESS_KEY_ID=AKIAXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxx
AWS_S3_BUCKET=ninjago-uploads
AWS_REGION=sa-east-1
# Alternativa Cloudflare R2, Supabase Storage, etc.

# ──── AI (geração de imagens de produtos) ───────────────────────────
OPENAI_API_KEY=sk-xxxxxxxx
# Usado para: gerarImagensProdutos, InvokeLLM

# ──── CONFIGURAÇÃO DO SERVIDOR ──────────────────────────────────────
PORT=3000
NODE_ENV=production
APP_URL=https://api.seudominio.com.br
FRONTEND_URL=https://seudominio.com.br
CORS_ORIGINS=https://seudominio.com.br,https://cardapio.seudominio.com.br

# ──── REDIS (opcional — para cache e real-time) ─────────────────────
REDIS_URL=redis://localhost:6379

# ──── WEBHOOK SECRETS ───────────────────────────────────────────────
WEBHOOK_SECRET_PEDIDO_EXTERNO=chave_secreta_para_validar_webhooks_externos
```

---

### 🔄 Substituições do SDK Base44 em Node.js

| Recurso Base44 | Equivalente em Node.js/TypeScript |
|---|---|
| `base44.entities.Pedido.list()` | ORM: **Prisma** (`prisma.pedido.findMany()`), **Drizzle**, **TypeORM**, ou **Mongoose** |
| `base44.entities.Pedido.filter({status})` | `prisma.pedido.findMany({ where: { status } })` |
| `base44.entities.Pedido.create({...})` | `prisma.pedido.create({ data: {...} })` |
| `base44.entities.Pedido.update(id, {...})` | `prisma.pedido.update({ where: {id}, data: {...} })` |
| `base44.entities.Pedido.delete(id)` | `prisma.pedido.delete({ where: {id} })` |
| `base44.entities.Pedido.subscribe()` | **WebSockets** (Socket.io) + triggers do banco (PostgreSQL NOTIFY/LISTEN) |
| `base44.auth.me()` | Middleware JWT: `req.user` após validar `Authorization: Bearer <token>` |
| `base44.auth.updateMe(data)` | `prisma.usuario.update({ where: {id: req.user.id}, data })` |
| `base44.integrations.Core.InvokeLLM` | OpenAI SDK: `openai.chat.completions.create(...)` |
| `base44.integrations.Core.SendEmail` | Nodemailer, Resend SDK, SendGrid, etc. |
| `base44.integrations.Core.UploadFile` | Multer + AWS S3 SDK / Cloudflare R2 |
| `base44.integrations.Core.GenerateImage` | OpenAI DALL-E: `openai.images.generate(...)` |
| `createClientFromRequest(req)` | Próprio middleware de auth com JWT |
| `base44.asServiceRole.*` | Service layer com conta de serviço (sem verificação de usuário) |
| `Deno.serve(async (req) => {...})` | Express.js / Fastify / Hono route handler |
| `Deno.env.get("CHAVE")` | `process.env.CHAVE` |

---

### 🏗️ Stack Recomendada para Migração

```
BACKEND:
├── Runtime: Node.js 20+ (LTS)
├── Framework: Fastify (mais rápido) ou Express.js (mais familiar)
├── ORM: Prisma (melhor DX + migrations automáticas)
├── Banco: PostgreSQL 15+ (recomendado) ou MongoDB
├── Auth: JWT (jsonwebtoken) + bcrypt para senhas
├── Real-time: Socket.io (substitui .subscribe())
├── Upload: Multer + AWS S3 SDK
├── Email: Resend (mais simples) ou Nodemailer
├── Fila de jobs: BullMQ + Redis (substitui automações agendadas)
└── Containerização: Docker + Docker Compose

FRONTEND:
├── Sem mudanças necessárias! React + Vite continua igual.
├── Apenas substituir imports de `@/api/base44Client` por seus próprios serviços
└── Trocar `base44.entities.*` por chamadas fetch/axios para sua API REST
```

---

### 📊 Schema de Banco Sugerido (PostgreSQL/Prisma)

> Para cada entidade do Dicionário de Dados acima, criar uma tabela. Campos `object` do Base44 viram `JSONB` no PostgreSQL ou submodelos separados. Exemplo:

```prisma
model Pizzaria {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  nome        String
  telefone    String
  endereco    String
  configuracoes Json?  // JSONB para o objeto configuracoes
  pedidos     Pedido[]
  produtos    Produto[]
  clientes    Cliente[]
  // ... demais campos
}

model Pedido {
  id           String   @id @default(cuid())
  pizzariaId   String
  pizzaria     Pizzaria @relation(fields: [pizzariaId], references: [id])
  numeroPedido String
  status       String   @default("novo")
  itens        Json     // JSONB para o array de itens
  valorTotal   Float
  // ... demais campos
}
```

---

## 7. DICAS EXTRAS DE MIGRAÇÃO PARA PLATAFORMA PRÓPRIA

### 🚀 Ordem Recomendada de Migração

```
ETAPA 1 — Banco de Dados (Semana 1-2)
├─ Exportar todos os dados do Base44 via API ou painel
├─ Criar schema Prisma baseado no Dicionário de Dados (Seção 2)
├─ Migrar dados: usar scripts de seed para importar JSON exportado
└─ Validar integridade referencial (pizzaria_id em todas as entidades)

ETAPA 2 — Backend API (Semana 2-4)
├─ Criar projeto Node.js/Fastify
├─ Implementar autenticação JWT (substituir Base44 Auth)
│  ├─ POST /auth/login → valida email+senha → retorna JWT
│  └─ Middleware: verifica Bearer token em toda rota protegida
├─ Implementar endpoints CRUD para cada entidade
├─ Migrar funções de backend uma a uma (ver Seção 3)
└─ Configurar webhooks do Mercado Pago para novo domínio

ETAPA 3 — Real-time (Semana 3-4)
├─ Implementar Socket.io para substituir .subscribe()
│  ├─ Evento: pedido:created → broadcast para sala da pizzaria
│  ├─ Evento: pedido:updated → broadcast por pizzaria_id
│  └─ Evento: entregador:location → broadcast rastreamento GPS
└─ Frontend: substituir base44.entities.X.subscribe() por socket.on()

ETAPA 4 — Frontend (Semana 4-5)
├─ Criar arquivo api/client.ts (substitui base44Client.js)
│  └─ Axios com interceptors para Authorization: Bearer <token>
├─ Substituir base44.entities.X.* por chamadas axios
├─ Substituir base44.auth.* por seu próprio AuthContext
└─ Testar cada página do sistema

ETAPA 5 — Infraestrutura (Semana 5-6)
├─ Deploy Backend: Railway / Render / Fly.io / VPS (DigitalOcean)
├─ Deploy Frontend: Vercel / Netlify / Cloudflare Pages
├─ Banco: Supabase (PostgreSQL gerenciado) / Railway / PlanetScale
├─ Configurar domínios personalizados por pizzaria (subdomínios)
└─ Configurar CI/CD (GitHub Actions)
```

---

### ⚠️ Pontos Críticos de Atenção

**1. Autenticação Multi-tenant**
O sistema tem 3 tipos de usuários: `Operadores` (Base44 Auth), `Estabelecimentos` (senha própria no campo `Pizzaria.senha`), e `Clientes` (senha própria em `Cliente.senha`). Na migração, você precisará de um sistema de auth que suporte esses 3 fluxos separados, potencialmente com tabelas separadas ou um campo `tipo_usuario` no JWT.

**2. Senhas em Texto Simples**
⚠️ **CRÍTICO**: Os campos `Pizzaria.senha` e `Cliente.senha` estão armazenados como texto simples no banco atual. Antes de migrar, **faça hash de todas as senhas com bcrypt** (salt rounds = 12 mínimo).

**3. Tokens do Mercado Pago por Pizzaria**
O `mp_access_token` está armazenado em `Pizzaria.configuracoes.mp_access_token`. Ao migrar, **não mova para variável de ambiente global** — mantenha por registro de estabelecimento. Use criptografia AES-256 para armazenar no banco (campo BYTEA + chave de criptografia no .env).

**4. Real-time é Crítico**
O dashboard de pedidos usa `subscribe()` do Base44 (WebSocket) em tempo real. Sem isso, os operadores não verão novos pedidos sem reload. Implemente Socket.io desde o início da migração.

**5. Webhook do Mercado Pago**
Ao migrar, a URL do webhook precisa ser atualizada em cada Preferência de Pagamento criada. O MP não re-notifica para URLs antigas. Configure a nova URL no .env e atualize `notification_url` na função `criarPagamentoMercadoPago`.

**6. Automações Agendadas**
O `ifoodPolling` é executado por uma automação agendada do Base44. No Node.js, use **BullMQ** (Redis) ou **node-cron** para substituir:
```javascript
// node-cron: equivalente a "a cada 2 minutos"
cron.schedule('*/2 * * * *', async () => {
  await ifoodPollingJob();
});
```

**7. Subdomínios Personalizados**
Cada pizzaria pode ter um `configuracoes.dominio_personalizado` (ex: `acaidathai.ninjagodelivery.com.br`). Para suportar isso no próprio servidor, use **Nginx** com wildcard SSL (Let's Encrypt wildcard) + lógica no backend para identificar a pizzaria pelo `Host` header.

**8. Upload de Arquivos**
O sistema usa `base44.integrations.Core.UploadFile` para logos e comprovantes. Substitua por **Multer + AWS S3** (ou Cloudflare R2 que é mais barato). Retorne uma URL pública para salvar no banco.

**9. Dados de Geolocalização**
O `geocodificarEndereco` usa a API pública Nominatim (OpenStreetMap). No Node.js, é apenas um `fetch()` — nenhuma mudança necessária. Atenção ao rate limit: máximo 1 request/segundo por IP. Para produção, considere usar **Google Maps Geocoding API** (pago, mas mais preciso e sem rate limit severo).

**10. CORS e Multi-tenant**
Configure CORS no backend para aceitar requisições de todos os subdomínios dos clientes:
```javascript
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.endsWith('.ninjagodelivery.com.br') || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

---

### 🗂️ Checklist de Migração

- [ ] Exportar backup completo dos dados do Base44
- [ ] Criar schema de banco e rodar migrations
- [ ] Importar dados exportados
- [ ] Hash de senhas de pizzarias e clientes
- [ ] Implementar autenticação JWT (3 tipos de usuário)
- [ ] Criar endpoints CRUD para todas as 18 entidades
- [ ] Migrar todas as 19 backend functions para rotas Express/Fastify
- [ ] Implementar Socket.io para real-time
- [ ] Substituir chamadas no frontend (base44Client → axios)
- [ ] Configurar Mercado Pago com nova URL de webhook
- [ ] Configurar cron jobs (ifoodPolling, etc.)
- [ ] Upload de arquivos (S3 ou similar)
- [ ] Deploy backend + banco + frontend
- [ ] Configurar domínios e SSL wildcard
- [ ] Testar fluxo completo de pedido end-to-end
- [ ] Monitoramento: Sentry (erros) + Datadog/Grafana (métricas)
- [ ] Backup automático do banco (daily snapshots)

---

*Documento gerado automaticamente com base na análise do código-fonte e schema de entidades do projeto NinjaGO Delivery.*
*Versão 2.0 — Auditoria Técnica para Migração — 08/04/2026*