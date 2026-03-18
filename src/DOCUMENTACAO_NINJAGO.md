# 📋 Documentação Completa — NinjaGO Delivery

> Sistema SaaS multi-tenant de gestão de delivery para estabelecimentos (pizzarias, lanchonetes, açaí, etc.)
> Stack: React + Tailwind CSS + Base44 (BaaS) | Backend: Deno (Edge Functions)

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Autenticação e Sessões](#3-autenticação-e-sessões)
4. [Banco de Dados — Entidades](#4-banco-de-dados--entidades)
5. [Páginas do Sistema Interno (Painel)](#5-páginas-do-sistema-interno-painel)
6. [Páginas Públicas / Cliente](#6-páginas-públicas--cliente)
7. [Páginas do Entregador](#7-páginas-do-entregador)
8. [Páginas Administrativas](#8-páginas-administrativas)
9. [Backend Functions (Deno)](#9-backend-functions-deno)
10. [Fluxo de Pedido Completo](#10-fluxo-de-pedido-completo)
11. [Cálculo de Taxa de Entrega](#11-cálculo-de-taxa-de-entrega)
12. [Sistema de Geocodificação](#12-sistema-de-geocodificação)
13. [Pagamentos Online — Mercado Pago](#13-pagamentos-online--mercado-pago)
14. [Sistema de Fidelidade](#14-sistema-de-fidelidade)
15. [Integrações Externas](#15-integrações-externas)
16. [Layout e Navegação](#16-layout-e-navegação)
17. [Configurações do Estabelecimento](#17-configurações-do-estabelecimento)
18. [Módulo Financeiro](#18-módulo-financeiro)
19. [Notificações](#19-notificações)
20. [Multi-tenant — Isolamento de Dados](#20-multi-tenant--isolamento-de-dados)

---

## 1. Visão Geral

O **NinjaGO Delivery** é uma plataforma SaaS que permite que múltiplos estabelecimentos (restaurantes, pizzarias, lanchonetes etc.) gerenciem pedidos, entregas, entregadores e finanças por um único sistema.

Cada estabelecimento (**Pizzaria** no banco de dados) tem:
- Um painel de gestão próprio (acesso via `AcessoUsuario`)
- Um cardápio público (`CardapioCliente`) acessível por link ou domínio próprio
- Um app mobile para entregadores (`AppEntregador`)
- Rastreamento em tempo real no mapa

### Perfis de acesso

| Perfil | Como acessa | O que vê |
|---|---|---|
| **Admin da plataforma** | Login base44 normal (role=admin) | Tudo, todas as pizzarias |
| **Usuário do estabelecimento** | `AcessoUsuario` com email/senha + localStorage | Apenas sua pizzaria |
| **Entregador** | `AppEntregador` identificando por telefone | Suas entregas |
| **Cliente final** | `CardapioCliente?pizzariaId=XXX` | Cardápio público |

---

## 2. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│                                                         │
│  Painel Interno  │  Cardápio Público  │  App Entregador │
│  (layout admin)  │  (sem layout)       │  (sem layout)   │
└────────┬────────────────────┬──────────────────┬────────┘
         │                    │                  │
         ▼                    ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│               Base44 SDK / API Client                    │
│    base44.entities.*  |  base44.functions.*              │
│    base44.integrations.Core.*  |  base44.auth.*          │
└────────┬────────────────────┬──────────────────┬────────┘
         │                    │                  │
         ▼                    ▼                  ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Database   │  │  Deno Edge Fns   │  │  APIs Externas   │
│  (Entities)  │  │  (functions/)    │  │  Nominatim/OSRM  │
│              │  │                  │  │  MercadoPago     │
└──────────────┘  └──────────────────┘  │  ViaCEP / iFood  │
                                        └──────────────────┘
```

### Roteamento (`App.jsx`)

O roteamento usa `react-router-dom`. Páginas sem layout (públicas/entregador/cliente):
- `Home`, `AppEntregador`, `AdminUsers`, `CardapioCliente`, `AcompanharPedido`
- `AcessoCliente`, `PerfilCliente`, `AcessoUsuario`, `PagamentoSucesso`, `PagamentoFalha`
- `AcessoAdmin`, `NotificacoesCliente`, `CriarNovaSenha`

---

## 3. Autenticação e Sessões

### 3.1 Usuário Admin / Base44

Usa autenticação nativa do Base44:
```js
const user = await base44.auth.me();
// user.role === 'admin' ou 'user'
// user.pizzaria_id → ID da pizzaria vinculada ao usuário
```

### 3.2 Usuário Estabelecimento (localStorage)

Os estabelecimentos fazem login em `AcessoUsuario`. Após validação contra a entidade `Pizzaria` (email + senha):
```js
localStorage.setItem('estabelecimento_logado', JSON.stringify({ id: pizzaria.id, nome: pizzaria.nome }))
```

Todas as páginas do painel verificam **primeiro** o localStorage:
```js
const estabelecimentoLogado = localStorage.getItem('estabelecimento_logado');
if (estabelecimentoLogado) {
  const estab = JSON.parse(estabelecimentoLogado);
  setPizzariaId(estab.id);
  return;
}
// fallback: base44.auth.me()
```

### 3.3 Cliente Final

Login em `AcessoCliente` com telefone + senha. Dados salvos em:
```js
localStorage.setItem('cliente_logado', JSON.stringify(cliente))
```

### 3.4 Entregador

Acessa `AppEntregador` e informa o **telefone cadastrado** no painel. O sistema busca o `Entregador` pelo telefone e vincula a sessão.

### 3.5 Senha Temporária de Estabelecimento

Ao cadastrar um novo estabelecimento, o admin gera uma senha temporária via `gerarSenhasTemporarias`. A flag `eh_senha_temporaria: true` força o redirecionamento para `CriarNovaSenha` no primeiro login.

---

## 4. Banco de Dados — Entidades

> Todos os registros possuem automaticamente: `id`, `created_date`, `updated_date`, `created_by`.

---

### 4.1 `Pizzaria`

O registro central de cada estabelecimento.

| Campo | Tipo | Descrição |
|---|---|---|
| `nome` | string | Nome interno do estabelecimento |
| `nome_exibicao_cliente` | string | Nome mostrado no cardápio público |
| `cnpj` | string | CNPJ formatado |
| `telefone` | string | Telefone principal |
| `email` | string | Email de login do estabelecimento |
| `senha` | string | Senha de login do estabelecimento |
| `eh_senha_temporaria` | boolean | Se true, força troca de senha no login |
| `endereco` | string | Rua/Avenida |
| `numero` | string | Número do endereço |
| `complemento` | string | Complemento |
| `bairro` | string | Bairro |
| `cidade` | string | Cidade |
| `estado` | string | UF |
| `cep` | string | CEP |
| `latitude` | number | Latitude da pizzaria (usada no mapa e cálculo de rota) |
| `longitude` | number | Longitude da pizzaria |
| `logo_url` | string | URL da logo exibida no cardápio |
| `tema_cliente` | enum: `light`, `dark` | Tema visual do cardápio público |
| `cor_primaria_cliente` | string | Cor hexadecimal dos botões/destaques do cardápio |
| `horario_abertura` | string | Ex: `18:00` |
| `horario_fechamento` | string | Ex: `23:00` |
| `taxa_entrega_base` | number | Taxa base cobrada em R$ |
| `raio_entrega_km` | number | Raio em km coberto pela taxa base |
| `raio_maximo_atendimento_km` | number | Raio máximo de atendimento (0 = sem limite) |
| `taxa_adicional_por_km` | number | R$ por km excedente ao raio base |
| `valor_minimo_entrega_gratis` | number | Valor mínimo do pedido para entrega gratuita (0 = desabilitado) |
| `entrega_gratis_dentro_raio_base` | boolean | Se true, entrega é gratuita dentro do raio base |
| `status` | enum: `ativa`, `inativa`, `suspensa` | Status operacional |
| `plano` | enum: `basico`, `profissional`, `enterprise` | Plano SaaS contratado |
| `configuracoes` | object | Objeto com configurações avançadas (ver abaixo) |
| `dados_bancarios` | object | Dados bancários do estabelecimento |
| `ifood_client_id` | string | Credencial OAuth iFood |
| `ifood_client_secret` | string | Credencial OAuth iFood |
| `ifood_merchant_id` | string | ID do estabelecimento no iFood |
| `ifood_access_token` | string | Token OAuth atual do iFood |
| `ifood_token_expires_at` | datetime | Expiração do token iFood |
| `ifood_polling_ativo` | boolean | Se polling do iFood está ativo |

**`configuracoes` (sub-objeto):**

| Campo | Tipo | Descrição |
|---|---|---|
| `aceitar_pix` | boolean | Aceita PIX na entrega |
| `aceitar_cartao` | boolean | Aceita cartão na entrega |
| `aceitar_dinheiro` | boolean | Aceita dinheiro na entrega |
| `tempo_medio_preparo` | number | Minutos de preparo médio |
| `mp_public_key` | string | Chave pública Mercado Pago |
| `mp_access_token` | string | Access token Mercado Pago |
| `mp_credenciais_salvas` | boolean | Flag de segurança (oculta as credenciais na UI) |
| `dominio_personalizado` | string | Domínio do cardápio (ex: `cardapio.minhaloja.com.br`) |
| `ifood_ativo` | boolean | Integração iFood ligada |
| `99food_ativo` | boolean | Integração 99Food ligada |

---

### 4.2 `Produto`

Cardápio de produtos de um estabelecimento.

| Campo | Tipo | Descrição |
|---|---|---|
| `restaurante_id` | string | FK → Pizzaria.id |
| `nome` | string | Nome do produto |
| `descricao` | string | Descrição |
| `categoria` | enum | `pizza`, `esfiha`, `lanche`, `bebida`, `acai`, `combo`, `sobremesa`, `porcao`, `salgado`, `doce`, `outro` |
| `preco` | number | Preço atual em R$ |
| `preco_original` | number | Preço antes da promoção |
| `em_promocao` | boolean | Flag de promoção |
| `imagem_url` | string | URL da imagem do produto |
| `disponivel` | boolean | Se está disponível para venda |
| `destaque` | boolean | Exibido em destaque no cardápio |
| `opcoes_personalizacao` | array | Grupos de complementos/adicionais |

**`opcoes_personalizacao` (array de grupos):**

```json
[
  {
    "nome_grupo": "Complementos Grátis",
    "obrigatorio": false,
    "min_selecoes": 0,
    "max_selecoes": 3,
    "permite_precificacao": false,
    "itens": [
      { "nome": "Bacon", "preco_adicional": 0, "disponivel": true },
      { "nome": "Cheddar", "preco_adicional": 2.50, "disponivel": true }
    ]
  }
]
```

---

### 4.3 `Pedido`

Registro de cada pedido feito no sistema.

| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria.id |
| `numero_pedido` | string | Número sequencial do dia (ex: `01`, `02`) |
| `tipo_pedido` | enum: `delivery`, `balcao` | Tipo do pedido |
| `cliente_nome` | string | Nome do cliente |
| `cliente_telefone` | string | Telefone do cliente |
| `cliente_cep` | string | CEP do cliente |
| `cliente_endereco` | string | Rua/Avenida |
| `cliente_numero` | string | Número |
| `cliente_bairro` | string | Bairro |
| `cliente_cidade` | string | Cidade |
| `cliente_estado` | string | Estado |
| `cliente_complemento` | string | Complemento |
| `cliente_referencia` | string | Ponto de referência |
| `latitude` | number | Latitude geocodificada do cliente |
| `longitude` | number | Longitude geocodificada do cliente |
| `itens` | array | Array de itens do pedido |
| `valor_produtos` | number | Subtotal dos produtos |
| `taxa_entrega` | number | Taxa de entrega calculada |
| `desconto` | number | Desconto aplicado |
| `valor_total` | number | Total final (produtos + taxa - desconto) |
| `forma_pagamento` | enum | `dinheiro`, `pix`, `cartao_credito`, `cartao_debito`, `online`, `outro` |
| `status_pagamento` | enum | `pendente`, `pago`, `receber_depois`, `cancelado` |
| `troco_para` | number | Valor para cálculo de troco |
| `status` | enum | `novo`, `em_preparo`, `pronto`, `em_entrega`, `entregue`, `finalizada`, `cancelado` |
| `observacoes` | string | Observações gerais do pedido |
| `observacoes_financeiras` | string | Notas do time financeiro |
| `comprovante_url` | string | URL do comprovante de pagamento |
| `conferido_por` | string | Email de quem conferiu o pedido |
| `data_conferencia` | datetime | Data da conferência financeira |
| `horario_pedido` | datetime | Horário de criação do pedido |
| `horario_pronto` | datetime | Horário em que ficou pronto |
| `origem` | enum | `balcao`, `telefone`, `whatsapp`, `ifood`, `app`, `site` |

**`itens` (array):**

```json
[
  {
    "produto_id": "abc123",
    "nome": "Pizza Margherita",
    "quantidade": 2,
    "preco_unitario": 45.00,
    "observacao": "Sem cebola"
  }
]
```

**Número do Pedido — lógica:**
- Gerado sequencialmente por dia, por pizzaria
- `numero_pedido = 1` no início de cada dia
- Formato com `padStart(2, '0')`: `01`, `02`, etc.

---

### 4.4 `Entregador`

Cadastro dos entregadores vinculados a uma pizzaria.

| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria.id |
| `nome` | string | Nome completo |
| `email` | string | Email opcional |
| `telefone` | string | **Chave de autenticação no AppEntregador** |
| `cpf` | string | CPF |
| `foto_url` | string | URL da foto de perfil |
| `veiculo` | enum | `moto`, `carro`, `bicicleta`, `a_pe` |
| `placa_veiculo` | string | Placa do veículo |
| `status` | enum | `disponivel`, `em_entrega`, `offline`, `pausado` |
| `latitude` | number | Última latitude reportada pelo app |
| `longitude` | number | Última longitude reportada |
| `ultima_localizacao` | datetime | Timestamp da última atualização GPS |
| `saldo_taxas` | number | Saldo acumulado a receber |
| `total_entregas` | number | Total de entregas realizadas |
| `avaliacao_media` | number | Avaliação média (0-5) |
| `ativo` | boolean | Se está ativo no sistema |
| `dados_bancarios` | object | Banco, agência, conta, pix |

---

### 4.5 `Entrega`

Registro de cada entrega atribuída a um entregador.

| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria.id |
| `pedido_id` | string | FK → Pedido.id |
| `entregador_id` | string | FK → Entregador.id |
| `numero_pedido` | string | Número do pedido (denormalizado) |
| `cliente_nome` | string | Nome do cliente |
| `cliente_telefone` | string | Telefone |
| `endereco_completo` | string | Endereço formatado |
| `bairro` | string | Bairro de entrega |
| `latitude_destino` | number | Latitude do destino |
| `longitude_destino` | number | Longitude do destino |
| `valor_pedido` | number | Valor total do pedido |
| `taxa_entregador` | number | Valor que o entregador receberá |
| `forma_pagamento` | string | Forma de pagamento do pedido |
| `troco_para` | number | Valor para troco |
| `status` | enum | `pendente`, `aceita`, `em_rota`, `entregue`, `recusada`, `cancelada` |
| `horario_atribuicao` | datetime | Quando foi atribuída ao entregador |
| `horario_aceite` | datetime | Quando o entregador aceitou |
| `horario_saida` | datetime | Quando saiu para entrega |
| `horario_entrega` | datetime | Quando foi entregue |
| `tempo_entrega_minutos` | number | Duração total da entrega |
| `distancia_km` | number | Distância percorrida |
| `observacoes` | string | Observações |
| `itens_resumo` | string | Resumo textual dos itens |
| `assinatura_cliente` | string | URL da assinatura digital |
| `foto_comprovante` | string | URL da foto de comprovante |
| `avaliacao_cliente` | number | Nota dada pelo cliente (0-5) |
| `rota_log` | array | Log de posições GPS `[{lat, lng, timestamp}]` |

---

### 4.6 `Cliente`

Clientes cadastrados que fazem pedidos pelo cardápio.

| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria.id |
| `nome` | string | Nome completo |
| `telefone` | string | **Chave de login** |
| `senha` | string | Senha do cliente |
| `email` | string | Email opcional |
| `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado` | string | Endereço padrão |
| `latitude` | number | Latitude do endereço |
| `longitude` | number | Longitude do endereço |
| `total_pedidos` | number | Contador de pedidos realizados |
| `pontos_fidelidade` | number | Pontos acumulados (1 ponto = R$1 gasto) |

---

### 4.7 `Notificacao`

Notificações enviadas ao cliente sobre o status do pedido.

| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria.id |
| `destinatario_id` | string | ID do cliente ou entregador |
| `tipo` | enum | `nova_entrega`, `entrega_aceita`, `entrega_concluida`, `mensagem`, `alerta`, `sistema` |
| `titulo` | string | Título da notificação |
| `mensagem` | string | Corpo da mensagem |
| `dados` | object | Dados extras (ex: `pedido_id`) |
| `lida` | boolean | Se foi lida (default: false) |
| `url_acao` | string | URL de ação ao clicar |

---

### 4.8 `Custo`

Lançamentos de custos operacionais.

| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria.id |
| `descricao` | string | Descrição do custo |
| `valor` | number | Valor em R$ |
| `data` | date | Data do custo |
| `categoria` | enum | `operacional`, `marketing`, `salarios`, `insumos`, `aluguel`, `energia`, `agua`, `internet`, `manutencao`, `impostos`, `outros` |
| `tipo` | enum: `fixo`, `variavel` | Tipo de custo |
| `recorrente` | boolean | Se é recorrente |
| `observacoes` | string | Notas |

---

### 4.9 `Recompensa`

Recompensas do programa de fidelidade.

| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria.id |
| `titulo` | string | Título da recompensa |
| `descricao` | string | Descrição detalhada |
| `pontos_necessarios` | number | Pontos para resgatar |
| `tipo` | enum | `desconto_percentual`, `desconto_valor`, `produto_gratis`, `entrega_gratis`, `upgrade` |
| `valor_desconto` | number | Valor do desconto (R$ ou %) |
| `produto_id` | string | FK → Produto.id (para produto grátis) |
| `imagem_url` | string | Imagem da recompensa |
| `ativa` | boolean | Se está disponível |
| `quantidade_disponivel` | number | Estoque limitado |
| `validade_dias` | number | Validade do cupom após resgate |

---

### 4.10 `ResgatePontos`

Histórico de resgates do programa de fidelidade.

| Campo | Tipo | Descrição |
|---|---|---|
| `cliente_id` | string | FK → Cliente.id |
| `recompensa_id` | string | FK → Recompensa.id |
| `pontos_gastos` | number | Pontos utilizados |
| `codigo_cupom` | string | Código único do cupom gerado |
| `status` | enum | `ativo`, `usado`, `expirado` |
| `data_resgate` | datetime | Quando foi resgatado |
| `data_uso` | datetime | Quando foi utilizado |
| `data_validade` | datetime | Data de expiração |
| `pedido_id` | string | FK → Pedido.id (quando usado) |

---

### 4.11 `Pagamento`

Pagamentos de taxas para entregadores.

| Campo | Tipo | Descrição |
|---|---|---|
| `pizzaria_id` | string | FK → Pizzaria.id |
| `entregador_id` | string | FK → Entregador.id |
| `valor` | number | Valor pago em R$ |
| `periodo_inicio` | date | Início do período |
| `periodo_fim` | date | Fim do período |
| `quantidade_entregas` | number | Entregas no período |
| `status` | enum: `pendente`, `pago`, `cancelado` | Status |
| `data_pagamento` | datetime | Data efetiva do pagamento |
| `comprovante_url` | string | URL do comprovante |

---

### 4.12 `MetodoPagamento`

Métodos de pagamento ativos por estabelecimento.

| Campo | Tipo | Descrição |
|---|---|---|
| `restaurante_id` | string | FK → Pizzaria.id |
| `nome` | string | Nome exibido |
| `tipo` | enum | `dinheiro`, `cartao_credito`, `cartao_debito`, `pix`, `online`, `vale_refeicao`, `outro` |
| `ativo` | boolean | Se está ativo |
| `instrucoes` | string | Instruções para o cliente |

---

### 4.13 `Entrega` relacionadas adicionais

### 4.13.1 `HistoricoLocalizacao`

Log de posições GPS dos entregadores em tempo real.

| Campo | Tipo | Descrição |
|---|---|---|
| `entregador_id` | string | FK → Entregador.id |
| `entrega_id` | string | FK → Entrega.id |
| `latitude` | number | Latitude |
| `longitude` | number | Longitude |
| `velocidade` | number | Velocidade (km/h) |
| `precisao` | number | Precisão do GPS (metros) |
| `bateria` | number | Nível de bateria (%) |

### 4.13.2 `RegistroEntrega`

Registro financeiro por entrega (para histórico de pagamentos do entregador).

| Campo | Tipo | Descrição |
|---|---|---|
| `entregador_id` | string | FK → Entregador.id |
| `entrega_id` | string | FK → Entrega.id |
| `pedido_id` | string | FK → Pedido.id |
| `distancia_km` | number | Distância da entrega |
| `tempo_minutos` | number | Duração da entrega |
| `taxa_base` | number | Taxa base calculada |
| `taxa_ajuste` | number | Ajuste manual (+bônus/-desconto) |
| `taxa_total` | number | Total efetivo |
| `motivo_ajuste` | string | Justificativa do ajuste |
| `data_entrega` | datetime | Data/hora da entrega |

---

## 5. Páginas do Sistema Interno (Painel)

Todas as páginas internas são protegidas pelo componente `RouteGuard` e renderizadas dentro do `Layout` (sidebar + topbar).

### 5.1 `NovoPedido`

**Propósito:** Criar um pedido manualmente (balcão ou delivery) pelo operador.

**Fluxo:**
1. Selecionar tipo: Delivery ou Balcão
2. Buscar/selecionar produtos do cardápio (agrupados por categoria)
3. Preencher dados do cliente
4. Para delivery: preencher endereço → CEP autocompleta via ViaCEP → taxa calculada via InvokeLLM (distância real)
5. Selecionar forma de pagamento
6. Finalizar → cria `Pedido` com `status: 'novo'`, `origem: 'balcao'`
7. Exibe confirmação com opção de **imprimir comanda** (página HTML 80mm)

**Recursos especiais:**
- Toggle ON/OFF para iFood e 99Food diretamente na tela
- Cálculo automático de taxa ao completar endereço
- Impressão de comanda térmica formatada para 80mm

---

### 5.2 `Pedidos`

**Propósito:** Listar, filtrar e gerenciar todos os pedidos da pizzaria.

**Modos de visualização:**
- **Horizontal (lista):** Uma linha por pedido com paginação (20 por página)
- **Kanban (colunas):** 6 colunas: Novo | Em Preparo | Pronto | Em Entrega | Entregue | Cancelado

**Filtros disponíveis:**
- Busca por número, nome do cliente ou telefone
- Filtro por status

**Ações por pedido:**
- Ver/Editar detalhes (abre `PedidoModal`)
- Iniciar Preparo (`status: novo → em_preparo`)
- Marcar como Pronto (`status: em_preparo → pronto`)
- Atribuir Entrega (abre `AtribuirEntregaModal`)
- Cancelar pedido
- Ligar para o cliente (link `tel:`)

**Atualização:** A cada 10 segundos via `refetchInterval`.

---

### 5.3 `Cozinha`

**Propósito:** Interface exclusiva para a cozinha — sem distrações, focada no preparo.

**Exibe:**
- Coluna **Em Preparo** (status `em_preparo`)
- Coluna **Prontos para Entrega** (status `pronto`)

**Recursos:**
- Alertas visuais para pedidos com mais de 30 min (badge vermelho "Atrasado")
- Contador de tempo desde o pedido
- Botão "Marcar como Pronto" — atualiza status e notifica o cliente
- Observações por item destacadas em amarelo
- Tipo: Balcão vs Delivery claramente indicado
- Atualização automática a cada **5 segundos**

---

### 5.4 `Pedidos`

*(ver 5.2 acima)*

---

### 5.5 `MapaTempoReal`

**Propósito:** Monitoramento em tempo real de entregadores e entregas no mapa.

**Funcionalidades:**
- Mapa interativo (OpenStreetMap via react-leaflet)
- Ícones customizados: 🍕 pizzaria, 🚴 entregador, 📦 entrega, 🏠 cliente
- Ajuste automático do zoom para mostrar todos os pontos
- Lista de entregadores online no painel lateral
- **Busca de motoboy** por nome/telefone
- **Atribuição rápida de comanda** — digita o número da comanda, atribui ao motoboy selecionado
- Botões de navegação: Google Maps e Waze
- Botão de recalcular rota (chama função `otimizarRotaEntregador`)
- Atualização a cada 5 segundos

**Modos de exibição:**
- Mapa (desktop sempre visível)
- Lista (mobile-friendly)

---

### 5.6 `Entregadores`

**Propósito:** Gestão do cadastro de entregadores.

**Funcionalidades:**
- Grid de cards com foto, status, veículo, total de entregas, avaliação, saldo
- Filtro por status (disponível, em entrega, pausado, offline)
- Busca por nome ou telefone
- Paginação (12 por página)
- Cadastrar novo entregador → ao cadastrar, envia link do app via WhatsApp automaticamente
- Editar/Excluir entregadores
- Link para `EntregadorDetalhe` com histórico completo

---

### 5.7 `Financeiro`

**Propósito:** Hub financeiro com KPIs e acesso rápido aos módulos financeiros.

**KPIs exibidos (mês atual):**
- Receita do Mês (soma de pedidos `status: finalizada`)
- Custos do Mês (soma de `Custo`)
- Lucro do Mês (receita - custos)
- Ticket Médio

**Módulos vinculados:**
- `ControleComandas` — conferir pedidos entregues aguardando finalização
- `FluxoDeCaixa` — lançar e visualizar receitas/despesas
- `ConfiguracoesFinanceiras` — dados bancários e KPIs

---

### 5.8 `ControleComandas`

**Propósito:** Conferência financeira de pedidos entregues antes de finalizar.

**Fluxo:**
1. Lista pedidos com `status: entregue` aguardando conferência
2. Operador valida: forma de pagamento, comprovante, valor
3. Adiciona observações financeiras
4. Finaliza → pedido vai para `status: finalizada`

---

### 5.9 `FluxoDeCaixa`

**Propósito:** Controle de receitas e despesas.

**Funcionalidades:**
- Lançar custos com categoria, valor, data, tipo (fixo/variável)
- Visualizar entradas (pedidos finalizados) vs saídas (custos)
- Gráfico de fluxo por período

---

### 5.10 `Relatorios`

**Propósito:** Dashboard analítico completo.

**Períodos:** Hoje | Últimos 7 dias | Últimos 30 dias | Último ano

**Dashboard de Vendas:**
- Total em Vendas
- Total de Pedidos
- Pedidos em Aberto
- Ticket Médio
- Gráfico de Vendas por Dia (LineChart)
- Status dos Pedidos (PieChart)
- Produtos Mais Vendidos (BarChart horizontal)

**Dashboard de Entregas:**
- Total de Entregas
- Faturamento
- Taxas Pagas aos Entregadores
- Tempo Médio de Entrega
- Entregas por Dia (BarChart)
- Faturamento por Dia (AreaChart)
- Entregas por Bairro (PieChart donut)
- Formas de Pagamento (PieChart donut)
- Top Entregadores (ranking com barra de progresso)
- Tabela de Saldo por Entregador

**Exportação:** CSV com todos os dados de entregas do período

---

### 5.11 `Produtos`

**Propósito:** Gestão do cardápio de produtos.

**Funcionalidades:**
- Listagem com imagem, preço, categoria, status de disponibilidade
- Criar/editar produtos com grupos de complementos/adicionais
- Upload de imagem diretamente (ou por URL)
- Marcação de destaque e promoção
- Gerenciamento de `opcoes_personalizacao` com o componente `OpcoesPersonalizacaoManager`

---

### 5.12 `Configuracoes`

**Propósito:** Gestão completa das configurações do estabelecimento.

**Abas:**
1. **Geral** — Dados do estabelecimento, horários, endereço, mapa interativo de localização
2. **Personalizar Minha Loja** — Logo, nome de exibição, tema (dark/light), cor primária, link do cardápio, domínio personalizado
3. **Entrega** — Taxa base, raio base, raio máximo, taxa adicional por km, entrega grátis, mapa de raio de cobertura
4. **Pagamento** — Formas aceitas (dinheiro/PIX/cartão), credenciais Mercado Pago, URL do webhook
5. **Notificações** — Preferências (visual, sem backend real)
6. **Aparência** — Tema dark/light do painel interno
7. **Fidelidade** — Regras de pontuação, gerenciar recompensas

---

## 6. Páginas Públicas / Cliente

Páginas sem o layout admin, acessíveis sem autenticação base44.

### 6.1 `Home`

Landing page pública da plataforma NinjaGO. Funcionalidades:
- Detecção de subdomínio para redirecionar para cardápio específico
- Apresentação da plataforma
- Links para acesso dos estabelecimentos, entregadores e admin

---

### 6.2 `CardapioCliente`

**Rota:** `/CardapioCliente?pizzariaId=XXX` ou domínio próprio

**Propósito:** Cardápio público para clientes finalizarem pedidos.

**Fluxo completo:**

1. **Carregamento:** Busca `Pizzaria` e `Produto` pelo `pizzariaId` da URL (fallback: localStorage)
2. **Verificação de horário:** Bloqueia pedido se fora do horário de funcionamento
3. **Navegação:** Abas por categoria, busca, destaques em carrossel
4. **Produto:** Click abre `ProductDetailModal` com personalizações e preço calculado
5. **Carrinho:** Botão flutuante com contador; ajuste de quantidades; observação por item
6. **Checkout — Step 1:** Tipo de acesso (Novo Cadastro / Convidado / Login)
7. **Checkout — Step 2 (Dados + Endereço):**
   - Preencher nome, telefone, email, senha (se cadastro)
   - Endereço via CEP (ViaCEP) ou GPS (geocodificação reversa)
   - Cálculo de frete via `geocodificarEndereco` + `calcularRotaEntrega`
   - Exibe distância real e detalhamento da taxa
8. **Checkout — Step 3 (Pagamento):**
   - PIX online (Mercado Pago)
   - Pagar na entrega (dinheiro, crédito, débito)
   - Campo de cupom de desconto (via `ResgatePontos`)
9. **Checkout — Step 4 (Revisão):** Confirmar endereço, pagamento e observações
10. **Checkout — Step 5 (Pagamento PIX):** `PixCheckout` com QR Code e polling de status
11. **Confirmação:** Redireciona para `AcompanharPedido?id=XXX`

**Pontos de fidelidade:** Ao finalizar pedido cadastrado, acumula `floor(subtotal)` pontos.

---

### 6.3 `AcompanharPedido`

**Rota:** `/AcompanharPedido?id=XXX&pizzaria_id=XXX`

**Propósito:** Página de rastreamento em tempo real do pedido pelo cliente.

**Funcionalidades:**
- Timeline visual do status do pedido
- Polling a cada 30 segundos
- Notificação browser ao mudar de status
- Exibe: itens, endereço, valor, forma de pagamento, tempo estimado
- Card especial para PIX com status de pagamento

---

### 6.4 `AcessoCliente`

Tela de login para clientes com email/telefone e senha.

---

### 6.5 `PerfilCliente`

Dashboard do cliente logado:
- Dados pessoais e endereço
- Saldo de pontos de fidelidade
- Histórico de pedidos
- Link para programa de fidelidade

---

### 6.6 `NotificacoesCliente`

Lista de notificações do cliente com marcação de lida/não lida.

---

### 6.7 `PagamentoSucesso` / `PagamentoFalha`

Páginas de retorno após pagamento online no Mercado Pago.

---

## 7. Páginas do Entregador

### 7.1 `AppEntregador`

**Rota:** `/AppEntregador`

**Propósito:** App mobile para entregadores gerenciarem suas entregas.

**Autenticação:** Informa o telefone cadastrado → sistema busca `Entregador` por telefone + pizzaria_id.

**Abas:**

1. **Entregas Ativas:** Lista de entregas atribuídas com botões de aceitar/sair/entregar
2. **Histórico:** Entregas passadas com filtro por período
3. **Financeiro:** Saldo acumulado, pagamentos recebidos, RegistroEntrega
4. **Perfil:** Dados pessoais, dados bancários, avaliações

**Recursos:**
- Rastreamento GPS em tempo real (atualiza `Entregador.latitude/longitude`)
- Push notifications para nova entrega
- Integração Google Maps / Waze
- Foto de comprovante de entrega
- Avaliação recebida do cliente

---

## 8. Páginas Administrativas

### 8.1 `AcessoAdmin`

Tela de login admin da plataforma (role=admin no base44).

### 8.2 `AdminUsers`

Gestão de usuários da plataforma (apenas admin).

### 8.3 `AcessoUsuario`

**Propósito:** Login dos estabelecimentos no painel.

**Fluxo:**
1. Email + Senha → busca `Pizzaria` por email
2. Se `eh_senha_temporaria: true` → redireciona para `CriarNovaSenha`
3. Se correto → salva no localStorage e redireciona para `Pedidos`

**Recuperação de senha:**
- Gera código de segurança
- Envia por email via `base44.integrations.Core.SendEmail`
- Valida código → permite nova senha

### 8.4 `CriarNovaSenha`

Tela de criação de nova senha após primeiro acesso com senha temporária.

---

## 9. Backend Functions (Deno)

Todas as funções ficam em `functions/` e são chamadas via:
```js
const response = await base44.functions.invoke('nomeDaFuncao', payload);
// response.data contém o retorno
```

---

### 9.1 `geocodificarEndereco`

**Propósito:** Converter endereço em coordenadas (ou reverso: coordenadas em endereço).

**Input:**
```json
{
  "endereco": "Rua das Flores, 123, Centro, São Paulo, SP, 01310-200, Brasil",
  // OU para geocodificação reversa:
  "latitude": -23.5505,
  "longitude": -46.6333
}
```

**Geocodificação direta (endereço → lat/lng) — 6 estratégias de fallback:**
1. Endereço completo como enviado
2. CEP isolado + Brasil
3. CEP + cidade
4. Primeiros 3 segmentos do endereço
5. Rua + cidade + estado
6. Cidade + estado (fallback amplo)

**Geocodificação reversa (lat/lng → endereço):**
- Chama Nominatim reverse
- Retorna: CEP normalizado, logradouro, número, bairro, cidade, estado

**Output (sucesso):**
```json
{
  "success": true,
  "latitude": -23.5505,
  "longitude": -46.6333,
  // OU para reverso:
  "endereco": {
    "cep": "01310200",
    "logradouro": "Avenida Paulista",
    "numero": "1578",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "estado": "SP",
    "latitude": -23.5505,
    "longitude": -46.6333
  }
}
```

**API utilizada:** OpenStreetMap Nominatim (`nominatim.openstreetmap.org`)

---

### 9.2 `calcularRotaEntrega`

**Propósito:** Calcular a distância real por rota (não em linha reta) e a taxa de entrega correspondente.

**Input:**
```json
{
  "origemLat": -23.45,
  "origemLng": -46.34,
  "destinoLat": -23.50,
  "destinoLng": -46.39,
  "pizzariaId": "abc123"
}
```

**Lógica:**
1. Chama **OSRM** (`router.project-osrm.org`) para rota real de carro
2. Extrai distância em km
3. Verifica `raio_maximo_atendimento_km` — se exceder, retorna `foraAreaEntrega: true`
4. Calcula taxa:
   - Se dentro do raio base → `taxa_entrega_base` (ou 0 se `entrega_gratis_dentro_raio_base`)
   - Se fora do raio base → `taxa_base + ceil(kmExtra / 0.5) * 0.5 * taxa_adicional_por_km`
   - (cobra em blocos de 0,5 km arredondando para cima)

**Output (sucesso dentro da área):**
```json
{
  "success": true,
  "distanciaKm": 7.42,
  "taxaEntrega": 12.50,
  "foraAreaEntrega": false,
  "detalhes": {
    "dentro_raio_base": false,
    "km_percorridos": 7.42,
    "raio_base": 5,
    "taxa_base": 8.00,
    "km_excedente": 2.42,
    "km_cobrado": 2.5,
    "blocos": 5,
    "taxa_adicional_por_km": 1.80,
    "valor_adicional": 4.50
  }
}
```

**Output (fora da área):**
```json
{
  "success": true,
  "distanciaKm": 25.3,
  "foraAreaEntrega": true,
  "erro": "Seu endereço está fora da área de entrega (25.3 km). Entregamos até 20 km."
}
```

---

### 9.3 `criarPagamentoMercadoPago`

**Propósito:** Criar uma cobrança PIX ou cartão via Mercado Pago.

**Input:**
```json
{
  "pedidoId": "abc123",
  "pizzariaId": "xyz456",
  "valor": 89.90,
  "descricao": "Pedido #05 - NinjaGO",
  "pagador": { "email": "cliente@email.com" },
  "tipoPagamento": "pix"
}
```

**Fluxo:**
1. Busca `Pizzaria` para obter `mp_access_token`
2. Cria preferência/intenção de pagamento no MP
3. Retorna QR Code, código PIX e ID da transação

---

### 9.4 `webhookMercadoPago`

**Propósito:** Receber notificações de pagamento do Mercado Pago e atualizar o pedido.

**Rota:** `POST /webhookMercadoPago?pizzaria_id=XXX`

**Fluxo:**
1. Valida assinatura do webhook
2. Busca o pagamento no MP pelo ID
3. Se `status: approved` → atualiza `Pedido.status_pagamento = 'pago'`
4. Envia notificação ao cliente

---

### 9.5 `processarPagamentoMercadoPago`

Processa pagamentos de cartão de crédito/débito com tokenização.

---

### 9.6 `otimizarRotaEntregador`

Recalcula a rota otimizada para um entregador com múltiplas entregas pendentes.

---

### 9.7 `gerarSenhasTemporarias`

Gera senhas temporárias para novos estabelecimentos e as salva criptografadas.

---

### 9.8 `gerarNovaSenha`

Processa a troca de senha (validação do código de recuperação + hash da nova senha).

---

### 9.9 `atualizarSenhaEstabelecimento`

Atualiza a senha do estabelecimento após validação.

---

### 9.10 `uploadLogoEstabelecimento`

Faz upload da logo do estabelecimento e retorna a URL pública.

---

### 9.11 `gerarImagensProdutos` / `gerarImagensProdutosLote`

Gera imagens de produtos via IA com base no nome e descrição do produto.

---

### 9.12 `ifoodPolling`

Polling de novos pedidos do iFood (executado como scheduled automation).

---

### 9.13 `webhookPedidoExterno`

Recebe pedidos de plataformas externas (iFood, 99Food) via webhook.

---

### 9.14 `testarMercadoPago` / `enviarWebhookMercadoPagoTeste`

Funções de diagnóstico para testar credenciais e webhooks do Mercado Pago.

---

## 10. Fluxo de Pedido Completo

```
Cliente acessa CardapioCliente
  ↓
Seleciona produtos → Carrinho
  ↓
Inicia Checkout
  ├── Step 1: Tipo cliente (Cadastro/Convidado/Login)
  ├── Step 2: Dados pessoais + Endereço + Cálculo de Frete
  │     ├── ViaCEP preenche endereço pelo CEP
  │     ├── geocodificarEndereco → converte endereço em lat/lng
  │     └── calcularRotaEntrega → distância real + taxa via OSRM
  ├── Step 3: Forma de pagamento (PIX online ou pagar na entrega)
  └── Step 4: Revisão final
  ↓
Confirmar Pedido
  ├── salvarCliente() → cria/atualiza Cliente + pontos de fidelidade
  ├── criarPedido() → cria registro Pedido (status: novo)
  │
  ├── [PIX online] → Step 5: PixCheckout
  │     ├── criarPagamentoMercadoPago → QR Code
  │     └── Polling status → ao pagar → redirect AcompanharPedido
  │
  └── [Pagar na entrega] → enviarNotificacaoStatusPedido → redirect AcompanharPedido
  
Painel interno recebe pedido (status: novo)
  ↓
Operador aceita → status: em_preparo
  ↓
Cozinha prepara → Marcar Pronto → status: pronto (notifica cliente)
  ↓
Atribuir Entrega (AtribuirEntregaModal / MapaTempoReal)
  ├── Cria registro Entrega (status: pendente, entregador_id)
  └── Pedido → status: em_entrega
  ↓
AppEntregador recebe notificação
  ├── Aceita entrega → Entrega: aceita
  ├── Sai para entrega → Entrega: em_rota
  └── Entrega concluída → Entrega: entregue → Pedido: entregue
  ↓
ControleComandas → conferência financeira
  └── Finaliza → Pedido: finalizada
```

---

## 11. Cálculo de Taxa de Entrega

### Configurações na Pizzaria:

| Campo | Exemplo | Descrição |
|---|---|---|
| `taxa_entrega_base` | R$ 8,00 | Valor fixo cobrado |
| `raio_entrega_km` | 5 km | Área coberta pela taxa base |
| `raio_maximo_atendimento_km` | 20 km | Limite máximo (0 = sem limite) |
| `taxa_adicional_por_km` | R$ 1,80 | Valor extra por km além do raio base |
| `entrega_gratis_dentro_raio_base` | false | Se true, entrega grátis dentro do raio base |
| `valor_minimo_entrega_gratis` | R$ 80,00 | Se pedido ≥ este valor, entrega grátis |

### Algoritmo:

```
1. Se valor_pedido ≥ valor_minimo_entrega_gratis → taxa = 0 (GRÁTIS)

2. Calcular distância real via OSRM

3. Se distancia > raio_maximo_atendimento_km → RECUSAR pedido

4. Se distancia ≤ raio_entrega_km:
   → taxa = entrega_gratis_dentro_raio_base ? 0 : taxa_entrega_base

5. Se distancia > raio_entrega_km:
   → kmExtra = distancia - raio_entrega_km
   → blocos = ceil(kmExtra / 0.5)      ← arredonda para cima em blocos de 500m
   → kmCobrado = blocos × 0.5
   → valorAdicional = kmCobrado × taxa_adicional_por_km
   → taxa = taxa_entrega_base + valorAdicional
```

### Exemplo prático:

- Taxa base: R$ 8,00 | Raio base: 5 km | Taxa adicional: R$ 1,80/km
- Cliente a **8,3 km**:
  - kmExtra = 8.3 - 5 = 3,3 km
  - blocos = ceil(3.3 / 0.5) = 7 blocos
  - kmCobrado = 7 × 0.5 = 3,5 km
  - valorAdicional = 3.5 × 1.80 = R$ 6,30
  - **Taxa total = R$ 8,00 + R$ 6,30 = R$ 14,30**

---

## 12. Sistema de Geocodificação

O sistema usa **Nominatim (OpenStreetMap)** como serviço gratuito, sem chave de API.

### Estratégias de fallback (ordem de tentativa):

1. **Endereço completo original** — como recebido do cliente
2. **CEP isolado** — extrai CEP da string e busca "XXXXXXXX Brasil"
3. **CEP + cidade** — combina CEP extraído com cidade detectada
4. **3 primeiros segmentos** — reduz a string para "Rua, Número, Bairro"
5. **Rua + cidade + estado** — versão simplificada sem bairro/CEP
6. **Cidade + estado** — fallback mais amplo para pelo menos localizar a região

### Geocodificação reversa (GPS → endereço):

Usada quando o cliente clica em "Usar Minha Localização" no checkout:
1. Navegador retorna `latitude` e `longitude`
2. Chama `geocodificarEndereco` com as coordenadas
3. Nominatim reverse retorna o endereço estruturado
4. Preenche o formulário automaticamente

### Limitações do Nominatim:

- Rate limit: 1 req/segundo por IP
- Cobertura variável por região
- Endereços rurais ou novos podem não ser encontrados

---

## 13. Pagamentos Online — Mercado Pago

### Configuração:

1. Estabelecimento acessa **Configurações → Pagamento**
2. Insere **Public Key** e **Access Token** do Mercado Pago
3. Configura a **URL do Webhook** no painel do Mercado Pago:
   ```
   https://app.base44.app/api/apps/{APP_ID}/functions/webhookMercadoPago?pizzaria_id={PIZZARIA_ID}
   ```

### Fluxo PIX online:

```
Cliente escolhe PIX
  ↓
criarPagamentoMercadoPago (backend)
  ├── Busca mp_access_token da Pizzaria
  ├── Cria payment intent no MP
  └── Retorna: qr_code, qr_code_base64, id_pagamento
  ↓
PixCheckout exibe QR Code
  ├── Timer de 15 minutos
  ├── Polling a cada 10s do status do pedido
  └── Ao detectar status_pagamento=pago → redireciona
  ↓
webhookMercadoPago (backend) recebe confirmação do MP
  ├── Verifica assinatura
  ├── Atualiza Pedido.status_pagamento = 'pago'
  └── Envia notificação ao cliente
```

---

## 14. Sistema de Fidelidade

### Acúmulo de pontos:

- **Regra:** R$ 1,00 gasto = 1 ponto
- **Quando:** Ao finalizar pedido como cliente cadastrado
- **Onde:** `Cliente.pontos_fidelidade += floor(valor_produtos)`

### Resgate:

1. Cliente acessa `PerfilCliente → Programa de Fidelidade`
2. Vê recompensas disponíveis (`Recompensa` da sua pizzaria)
3. Resgata → cria `ResgatePontos` com `codigo_cupom` único
4. No checkout, insere o código → desconto aplicado automaticamente

### Tipos de recompensa:

| Tipo | Como funciona |
|---|---|
| `desconto_valor` | Desconto fixo em R$ |
| `desconto_percentual` | Desconto em % do subtotal |
| `entrega_gratis` | Zera a taxa de entrega |
| `produto_gratis` | Adiciona produto sem cobrança |
| `upgrade` | Personalizado pelo estabelecimento |

---

## 15. Integrações Externas

### 15.1 ViaCEP

- **Uso:** Autocompletar endereço a partir do CEP
- **URL:** `https://viacep.com.br/ws/{CEP}/json/`
- **Onde:** Formulário de endereço no Checkout (cliente) e Configurações (estabelecimento)

### 15.2 OpenStreetMap / Nominatim

- **Uso:** Geocodificação de endereços
- **URL:** `https://nominatim.openstreetmap.org/`
- **Chave:** Não necessária (gratuito com respeito ao rate limit)

### 15.3 OSRM (Open Source Routing Machine)

- **Uso:** Cálculo de rota real por estrada (distância real para frete)
- **URL:** `https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}`
- **Chave:** Não necessária (gratuito)
- **Fallback:** Se falhar, sistema usa distância em linha reta (Haversine)

### 15.4 Mercado Pago

- **Uso:** Pagamentos online PIX e cartão no cardápio do cliente
- **Credenciais:** Por estabelecimento (Public Key + Access Token)
- **Modo:** Cada estabelecimento usa sua própria conta MP

### 15.5 iFood

- **Uso:** Receber pedidos do iFood automaticamente
- **Auth:** OAuth2 com `client_id`, `client_secret`, `merchant_id`
- **Polling:** Automation agendada que consulta API do iFood periodicamente
- **Toggle:** Liga/desliga pelo painel (NovoPedido ou Configurações)

### 15.6 Base44 Core (InvokeLLM)

- **Uso:** Cálculo de distância entre endereços no NovoPedido (painel interno)
- **Modelo:** Default (gpt-4o-mini)
- **Add internet context:** true (usa Google/Maps para calcular distância real)

---

## 16. Layout e Navegação

### Layout Interno (Admin/Estabelecimento)

Componente: `Layout` (sidebar + topbar)

**Sidebar (desktop):**
- Logo NinjaGO
- Menu de navegação com ícones
- Avatar do usuário + logout

**Menu principal:**

| Item | Página | Ícone |
|---|---|---|
| Novo Pedido | `NovoPedido` | ClipboardList |
| Pedidos | `Pedidos` | ClipboardList |
| Cozinha | `Cozinha` | Pizza |
| Produtos | `Produtos` | Pizza |
| Mapa ao Vivo | `MapaTempoReal` | MapPin |
| Entregadores | `Entregadores` | Bike |
| Financeiro | `Financeiro` | BarChart3 |
| Relatórios | `Relatorios` | BarChart3 |
| Integrações | `Integracoes` | Plug |
| Configurações | `Configuracoes` | Settings |

**Mobile Bottom Navigation:**
- Pedidos | Novo | Cozinha | Entregadores | Mais (menu drawer)

**Tema:** Dark (padrão) ou Light, salvo em `localStorage('theme')`.

**Páginas SEM layout:**
`Home`, `AppEntregador`, `AdminUsers`, `CardapioCliente`, `AcompanharPedido`, `AcessoCliente`, `PerfilCliente`, `AcessoUsuario`, `PagamentoSucesso`, `PagamentoFalha`, `AcessoAdmin`, `NotificacoesCliente`, `CriarNovaSenha`

---

## 17. Configurações do Estabelecimento

### Como as configurações são salvas:

1. Admin digita dados na página `Configuracoes`
2. Clica em **Salvar Alterações**
3. Sistema faz `Pizzaria.update(id, dadosCompletos)`
4. Flag `mp_credenciais_salvas: true` oculta as credenciais sensíveis na UI após salvar

### Localização do estabelecimento:

1. CEP digitado → ViaCEP preenche endereço → Nominatim retorna lat/lng
2. OU: Mapa interativo → clique fixa o pin → `onLocationChange(lat, lng)`
3. Lat/lng salva em `Pizzaria.latitude` e `Pizzaria.longitude`
4. Usada em: mapa ao vivo, cálculo de rota, raio de entrega visual

### Domínio Personalizado:

1. Estabelecimento registra subdomínio (ex: `cardapio.minhaloja.com.br`)
2. Configura CNAME apontando para `cname.base44.app`
3. Informa domínio em Configurações → Salvar
4. Base44 roteia o domínio para o app com `pizzariaId` correto

---

## 18. Módulo Financeiro

### Hierarquia:

```
Financeiro (hub)
├── ControleComandas — conferir pedidos entregues
├── FluxoDeCaixa — receitas vs despesas
└── ConfiguracoesFinanceiras — dados bancários, KPIs meta
```

### KPIs calculados:

```
Receita do Mês = Σ(Pedido.valor_total) onde status='finalizada' e no mês atual
Custos do Mês = Σ(Custo.valor) onde data >= inicio_do_mês
Lucro do Mês = Receita - Custos
Ticket Médio = Receita / Qtd. Pedidos Finalizados
```

### Fluxo de Conferência de Comanda:

```
Entrega concluída (status: entregue)
  ↓ aparece em ControleComandas
Operador confere:
  - Forma de pagamento recebida
  - Comprovante (upload foto)
  - Valor correto
  - Observações financeiras
  ↓ Finalizar
Pedido: status = 'finalizada'
  ↓ computa na Receita do Mês
```

---

## 19. Notificações

### Sistema de notificações ao cliente:

Implementado em `components/pedidos/NotificacaoHelper.js`

**Quando dispara:**
- `novo → em_preparo` → "Seu pedido foi aceito! Estamos preparando."
- `em_preparo → pronto` → "Seu pedido está pronto e saindo para entrega!"
- `pronto → em_entrega` → "Seu pedido saiu para entrega!"
- `em_entrega → entregue` → "Pedido entregue! Bom apetite!"

**Mecanismo:**
- Cria registro na entidade `Notificacao`
- Cliente vê em `NotificacoesCliente`
- `AcompanharPedido` usa notificações do browser (Web Push API — permissão solicitada na página)

**Notificações internas (painel):**
- Entidade `Notificacao` com `lida: false`
- Exibidas no sino do topbar (máximo 5 não lidas)

---

## 20. Multi-tenant — Isolamento de Dados

O sistema é **multi-tenant** — múltiplos estabelecimentos compartilham o mesmo banco de dados, isolados por `pizzaria_id`.

### Regras de isolamento:

1. **Todas as queries** incluem `{ pizzaria_id: pizzariaId }` como filtro
2. O `pizzariaId` é obtido de:
   - `localStorage('estabelecimento_logado').id` (prioridade)
   - `base44.auth.me().pizzaria_id` (usuário base44 vinculado)
   - URL param `?pizzariaId=XXX` (cardápio público)
3. Usuário admin (role=admin) pode ver todas as pizzarias
4. Usuário com `pizzaria_id` no perfil só acessa dados da sua pizzaria

### Cardápio público — identificação do estabelecimento:

```
1. URL param: ?pizzariaId=XXX          → prioridade máxima
2. localStorage('pizzaria_id_atual')   → sessão anterior
3. Subdomínio custom (Home.jsx)        → mapeia subdomínio → pizzariaId
4. Default hardcoded                   → '697ea8faa6ffe9fc35c32a91'
```

### Segurança nas funções backend:

- Funções que usam dados sensíveis (MP tokens) buscam sempre do banco (`asServiceRole`)
- Webhook do MP valida assinatura antes de processar
- Funções admin verificam `user.role === 'admin'`

---

## Apêndice A — Variáveis de Ambiente

| Variável | Onde usar | Descrição |
|---|---|---|
| `BASE44_APP_ID` | Automático | ID do app na plataforma Base44 |

> Credenciais do Mercado Pago são armazenadas **por estabelecimento** na entidade `Pizzaria.configuracoes`, não em variáveis de ambiente globais.

---

## Apêndice B — Tecnologias e Bibliotecas

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18.2 | Framework frontend |
| react-router-dom | 6.x | Roteamento |
| @tanstack/react-query | 5.x | Cache e fetching de dados |
| Tailwind CSS | 3.x | Estilização |
| shadcn/ui | latest | Componentes UI |
| framer-motion | 11.x | Animações |
| lucide-react | 0.475 | Ícones |
| react-leaflet | 4.2 | Mapas interativos |
| recharts | 2.x | Gráficos |
| moment | 2.x | Manipulação de datas |
| sonner | 2.x | Toasts/notificações |
| Deno | runtime | Backend Functions |
| Base44 SDK | 0.8.21 | Integração com plataforma |
| OpenStreetMap/Nominatim | - | Geocodificação |
| OSRM | - | Roteamento |
| Mercado Pago | 2.x (npm) | Pagamentos |

---

## Apêndice C — Glossário

| Termo | Significado |
|---|---|
| **Pizzaria** | Entidade central = qualquer estabelecimento (pizzaria, lanchonete, açaí etc.) |
| **Comanda** | Pedido físico impresso ou número sequencial do dia |
| **Taxa base** | Taxa de entrega fixa cobrada dentro do raio base |
| **Raio base** | Área em km coberta pela taxa base |
| **Raio máximo** | Limite máximo de atendimento (pedidos além disso são recusados) |
| **Polling** | Verificação periódica de status (pedidos iFood, pagamento PIX) |
| **Entrega grátis** | Quando taxa = R$ 0,00 (por raio ou valor mínimo do pedido) |
| **Geocodificação** | Conversão endereço ↔ coordenadas geográficas |
| **OSRM** | Open Source Routing Machine — calcula rotas reais por estradas |
| **Webhook** | Notificação HTTP enviada pelo MP quando pagamento é confirmado |
| **Multi-tenant** | Vários estabelecimentos no mesmo sistema, isolados por pizzaria_id |
| **Token MP** | Credencial do Mercado Pago — uma por estabelecimento |

---

*Documentação gerada em: 18/03/2026*
*Versão do sistema: NinjaGO Delivery v1.x*