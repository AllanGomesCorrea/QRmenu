# 🔧 QRMenu Backend

API REST construída com **NestJS** para o sistema de pedidos por QR Code.

## 📚 Índice

- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Módulos](#módulos)
- [Banco de Dados](#banco-de-dados)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [WebSocket](#websocket)
- [Endpoints da API](#endpoints-da-api)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│         (Web App, Admin Panel, Mobile Apps)                             │
└────────────────────────┬───────────────────────────────┬────────────────┘
                         │ HTTP/REST                     │ WebSocket
                         ▼                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           NestJS Application                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Guards     │  │ Interceptors │  │   Filters    │                  │
│  │  (JWT, RBAC) │  │  (Transform) │  │   (Errors)   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                      CONTROLLERS (REST API)                     │    │
│  │  Auth │ Users │ Restaurants │ Tables │ Menu │ Orders │ Reports │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                         SERVICES                                │    │
│  │  Business Logic │ Validation │ Data Transformation              │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐    │
│  │  WebSocket GW   │  │  Prisma Client  │  │   Redis Service      │    │
│  │  (Socket.IO)    │  │  (PostgreSQL)   │  │   (Cache/Sessions)   │    │
│  └─────────────────┘  └─────────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                         │                               │
                         ▼                               ▼
              ┌──────────────────┐            ┌──────────────────┐
              │   PostgreSQL     │            │      Redis       │
              │   (Persistent)   │            │   (Cache/Pub)    │
              └──────────────────┘            └──────────────────┘
```

### Fluxo de uma Requisição

1. **Requisição HTTP** chega ao servidor
2. **Middleware global** processa (CORS, Body Parser)
3. **Guards** validam autenticação (JWT) e autorização (RBAC)
4. **Interceptors** transformam dados de entrada/saída
5. **Controller** recebe e valida com DTOs
6. **Service** executa lógica de negócio
7. **Prisma** persiste/busca dados no PostgreSQL
8. **Redis** é usado para cache e sessões temporárias
9. **WebSocket** notifica clientes em tempo real
10. **Filters** tratam exceções e formatam erros

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 18+ | Runtime JavaScript |
| **NestJS** | 10.x | Framework backend |
| **TypeScript** | 5.x | Tipagem estática |
| **Prisma** | 5.x | ORM para PostgreSQL |
| **PostgreSQL** | 15 | Banco de dados relacional |
| **Redis** | 7.x | Cache e sessões |
| **Socket.IO** | 4.x | WebSocket para tempo real |
| **Passport** | 0.7.x | Autenticação JWT |
| **class-validator** | - | Validação de DTOs |
| **bcrypt** | - | Hash de senhas |
| **qrcode** | - | Geração de QR Codes |

---

## 📁 Estrutura de Pastas

```
backend/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados
│   ├── migrations/            # Histórico de migrações
│   └── seed.ts                # Dados de teste
│
├── scripts/
│   └── get-verification-codes.ts  # Script para obter códigos SMS
│
├── src/
│   ├── main.ts                # Ponto de entrada
│   ├── app.module.ts          # Módulo raiz
│   │
│   ├── config/
│   │   └── configuration.ts   # Configurações globais
│   │
│   ├── common/                # Recursos compartilhados
│   │   ├── decorators/        # @Public, @Roles, @CurrentUser
│   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   ├── filters/           # HttpExceptionFilter
│   │   ├── interceptors/      # TransformInterceptor
│   │   └── types/             # Tipos TypeScript
│   │
│   ├── auth/                  # Autenticação
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── crypto.service.ts  # RSA para senhas
│   │   └── strategies/        # Passport JWT
│   │
│   ├── users/                 # Gestão de usuários
│   ├── restaurants/           # Multi-tenancy
│   ├── tables/                # Mesas e QR Codes
│   ├── menu/                  # Cardápio (categorias e itens)
│   ├── orders/                # Pedidos
│   ├── sessions/              # Sessões de clientes
│   ├── reports/               # Relatórios
│   │
│   ├── prisma/                # Serviço Prisma
│   ├── redis/                 # Serviço Redis
│   └── websocket/             # Gateway WebSocket
│
├── Dockerfile                 # Container para produção
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## 🧩 Módulos

### AuthModule
Gerencia autenticação via JWT com refresh tokens.
- Login/logout
- Registro de usuários (admin)
- Refresh de tokens
- Criptografia RSA para senhas

### UsersModule
CRUD de usuários por restaurante com RBAC.
- Roles: SUPER_ADMIN, ADMIN, MANAGER, KITCHEN, WAITER, CASHIER

### RestaurantsModule
Multi-tenancy com isolamento por restaurante.
- Configurações (horários, geolocalização)
- Planos de assinatura

### TablesModule
Gestão de mesas com QR Codes únicos.
- Ativação/fechamento de mesas
- Geração de QR Code (PNG + URL)
- Status: INACTIVE, ACTIVE, OCCUPIED, BILL_REQUESTED, CLOSED

### MenuModule
Cardápio com categorias e itens.
- Categorias ordenáveis
- Itens com extras/adicionais
- Flags: vegano, vegetariano, sem glúten, picante
- Disponibilidade em tempo real

### OrdersModule
Sistema de pedidos com ciclo de vida completo.
- Criação via sessão do cliente
- Estados: PENDING → CONFIRMED → PREPARING → READY → PAID
- Cancelamento com motivo
- Notificações em tempo real

### SessionsModule
Sessões de clientes (sem cadastro).
- Verificação via SMS (mock)
- Fingerprint do dispositivo
- Validação de geolocalização
- Timeout automático

### ReportsModule
Relatórios e métricas do restaurante.
- Vendas por período
- Top itens vendidos
- Estatísticas de pedidos

### WebsocketModule
Comunicação em tempo real via Socket.IO.
- Eventos de pedidos
- Notificações para cozinha/caixa
- Chamada de garçom
- Solicitação de conta

---

## 🗄️ Banco de Dados

### Modelos Principais

```
Restaurant (Multi-tenant)
    ├── Users (Staff)
    ├── Tables
    │     └── TableSessions (Clientes)
    │           └── Orders
    │                 └── OrderItems
    ├── MenuCategories
    │     └── MenuItems
    │           └── MenuItemExtras
    └── Bills (Contas)
```

### Relacionamentos

- **Restaurant** → tem muitos Users, Tables, MenuCategories, Orders
- **Table** → pertence a Restaurant, tem muitas Sessions
- **TableSession** → pertence a Table, tem muitos Orders
- **Order** → pertence a Table, Session, Restaurant
- **MenuItem** → pertence a Category e Restaurant

---

## 🔐 Autenticação e Autorização

### JWT (JSON Web Token)

```
Access Token:  15 minutos
Refresh Token: 7 dias
```

### Fluxo de Login

1. Frontend solicita **chave pública RSA**
2. Senha é criptografada com a chave pública
3. Backend descriptografa com chave privada
4. Senha é verificada com bcrypt
5. Tokens JWT são gerados e retornados

### RBAC (Role-Based Access Control)

| Role | Permissões |
|------|------------|
| **SUPER_ADMIN** | Acesso total a todos os restaurantes |
| **ADMIN** | Tudo no próprio restaurante |
| **MANAGER** | Visualização (sem edição) |
| **KITCHEN** | Ver/atualizar status de pedidos |
| **WAITER** | Ver mesas e pedidos |
| **CASHIER** | Processar pagamentos, fechar contas |

### Decorators

```typescript
@Public()              // Remove proteção JWT
@Roles(UserRole.ADMIN) // Requer role específica
@CurrentUser()         // Injeta usuário autenticado
```

---

## 🔌 WebSocket

### Conexão

```
URL: ws://localhost:3000
Namespace: /
```

### Autenticação

**Admin/Staff:**
```javascript
socket.auth = { token: 'jwt_access_token' }
```

**Cliente (sessão):**
```javascript
socket.auth = { sessionToken: 'session_token', fingerprint: 'device_hash' }
```

### Eventos

#### Servidor → Cliente

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `order:created` | `{ orderId, tableNumber, itemCount, customerName }` | Novo pedido |
| `order:updated` | `{ orderId, status, ... }` | Status alterado |
| `table:waiter-called` | `{ tableId, tableNumber, reason }` | Garçom chamado |
| `table:bill-requested` | `{ tableId, tableNumber, customerName }` | Conta solicitada |
| `session:closed` | `{}` | Sessão encerrada pelo caixa |

#### Cliente → Servidor

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `table:call-waiter` | `{ reason?: string }` | Chamar garçom |
| `table:request-bill` | `{}` | Solicitar conta |
| `subscribe:restaurant` | `{ restaurantId }` | Entrar em sala |
| `unsubscribe:restaurant` | `{ restaurantId }` | Sair da sala |

---

## 📡 Endpoints da API

Base URL: `http://localhost:3000`

### Auth (`/auth`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/auth/public-key` | Chave RSA pública | ❌ |
| POST | `/auth/register` | Registrar usuário | ✅ Admin |
| POST | `/auth/login` | Login | ❌ |
| POST | `/auth/refresh` | Renovar token | ❌ |
| POST | `/auth/logout` | Logout | ✅ |
| GET | `/auth/me` | Usuário atual | ✅ |

### Users (`/users`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/users` | Listar usuários | ✅ Admin |
| GET | `/users/:id` | Buscar usuário | ✅ Admin |
| POST | `/users` | Criar usuário | ✅ Admin |
| PATCH | `/users/:id` | Atualizar usuário | ✅ Admin |
| DELETE | `/users/:id` | Remover usuário | ✅ Admin |

### Restaurants (`/restaurants`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/restaurants/public` | Listar restaurantes públicos | ❌ |
| GET | `/restaurants/slug/:slug` | Buscar por slug | ❌ |
| GET | `/restaurants/me` | Meu restaurante | ✅ |
| PATCH | `/restaurants/me` | Atualizar meu restaurante | ✅ Admin |
| GET | `/restaurants/me/stats` | Estatísticas | ✅ |
| GET | `/restaurants` | Listar todos (SuperAdmin) | ✅ SuperAdmin |

### Tables (`/tables`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/tables` | Listar mesas | ✅ |
| GET | `/tables/stats` | Estatísticas de mesas | ✅ |
| GET | `/tables/by-status` | Mesas por status | ✅ |
| GET | `/tables/qr/:qrCode` | Buscar por QR Code | ❌ |
| GET | `/tables/:id` | Detalhes da mesa | ✅ |
| POST | `/tables` | Criar mesa | ✅ Admin |
| POST | `/tables/bulk` | Criar várias mesas | ✅ Admin |
| PATCH | `/tables/:id` | Atualizar mesa | ✅ Admin |
| DELETE | `/tables/:id` | Remover mesa | ✅ Admin |
| POST | `/tables/:id/activate` | Ativar mesa | ✅ Waiter+ |
| POST | `/tables/:id/close` | Fechar mesa | ✅ Waiter+ |
| POST | `/tables/:id/release` | Liberar mesa (pagar) | ✅ Cashier |
| GET | `/tables/:id/qrcode` | Download QR Code PNG | ✅ |
| POST | `/tables/:id/regenerate-qr` | Regenerar QR Code | ✅ Admin |

### Sessions (`/sessions`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/sessions/table/:qrCode/status` | Status da mesa | ❌ |
| GET | `/sessions/table/:qrCode/check` | Verificar sessão existente | ❌ |
| POST | `/sessions/request-code` | Solicitar código SMS | ❌ |
| POST | `/sessions/create` | Criar sessão | ❌ |
| POST | `/sessions/verify` | Verificar código | ❌ |
| GET | `/sessions/:sessionId` | Detalhes da sessão | ❌ |
| POST | `/sessions/:sessionId/end` | Encerrar sessão | ❌ |

### Menu Categories (`/menu/categories`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/menu/categories` | Listar categorias | ✅ |
| GET | `/menu/categories/:id` | Detalhes da categoria | ✅ |
| POST | `/menu/categories` | Criar categoria | ✅ Admin |
| PATCH | `/menu/categories/:id` | Atualizar categoria | ✅ Admin |
| DELETE | `/menu/categories/:id` | Remover categoria | ✅ Admin |
| POST | `/menu/categories/reorder` | Reordenar categorias | ✅ Admin |

### Menu Items (`/menu/items`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/menu/items` | Listar itens | ✅ |
| GET | `/menu/items/:id` | Detalhes do item | ✅ |
| POST | `/menu/items` | Criar item | ✅ Admin |
| PATCH | `/menu/items/:id` | Atualizar item | ✅ Admin |
| DELETE | `/menu/items/:id` | Remover item | ✅ Admin |
| PATCH | `/menu/items/:id/toggle-availability` | Alternar disponibilidade | ✅ Admin |
| PATCH | `/menu/items/:id/toggle-featured` | Alternar destaque | ✅ Admin |
| POST | `/menu/items/reorder` | Reordenar itens | ✅ Admin |

### Public Menu (`/public/menu`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/public/menu/:slug` | Menu do restaurante | ❌ |
| GET | `/public/menu/:slug/item/:itemId` | Detalhes de item | ❌ |
| GET | `/public/menu/:slug/search` | Buscar itens | ❌ |
| GET | `/public/menu/:slug/filter` | Filtrar itens | ❌ |

### Orders (`/orders`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/orders/session` | Criar pedido (cliente) | 🔑 Session |
| GET | `/orders/session/my-orders` | Meus pedidos | 🔑 Session |
| GET | `/orders/session/:orderId` | Detalhes do pedido | 🔑 Session |
| GET | `/orders/kitchen` | Pedidos da cozinha | ✅ Kitchen+ |
| GET | `/orders` | Listar pedidos | ✅ |
| GET | `/orders/stats` | Estatísticas | ✅ |
| GET | `/orders/:id` | Detalhes do pedido | ✅ |
| PATCH | `/orders/:id/status` | Atualizar status | ✅ Kitchen+ |
| PATCH | `/orders/:orderId/items/:itemId/status` | Status do item | ✅ Kitchen+ |
| POST | `/orders/:id/cancel` | Cancelar pedido | ✅ |

### Reports (`/reports`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/reports` | Relatório geral | ✅ Admin |
| GET | `/reports/stats` | Estatísticas | ✅ Admin |
| GET | `/reports/daily-sales` | Vendas diárias | ✅ Admin |
| GET | `/reports/top-items` | Top itens vendidos | ✅ Admin |

---

## ⚙️ Variáveis de Ambiente

Criar arquivo `.env` na raiz do backend:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados
DATABASE_URL="postgresql://qrmenu:qrmenu123@localhost:5432/qrmenu"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="sua-chave-secreta-muito-longa-e-segura"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Geolocalização (flag global)
GEOLOCATION_ENABLED=false

# Sessão do cliente
SESSION_TIMEOUT_MINUTES=120
```

---

## 📜 Scripts

```bash
# Desenvolvimento
npm run start:dev     # Inicia com hot-reload

# Build
npm run build         # Compila para dist/

# Produção
npm run start:prod    # Inicia versão compilada

# Prisma
npx prisma generate   # Gera cliente Prisma
npx prisma migrate dev # Cria/aplica migrações
npx prisma db seed    # Popula banco de teste
npx prisma studio     # UI visual do banco

# Utilitários
npx ts-node scripts/get-verification-codes.ts  # Ver códigos SMS pendentes
```

---

## 🧪 Fluxo do Cliente (QR Code)

```
1. Cliente escaneia QR Code da mesa
   └─▶ GET /sessions/table/:qrCode/status
       └─▶ Retorna status da mesa e restaurante

2. Cliente preenche nome e telefone
   └─▶ POST /sessions/request-code
       └─▶ Envia código SMS (mock: aparece no console)

3. Cliente digita código recebido
   └─▶ POST /sessions/verify
       └─▶ Retorna sessionToken

4. Cliente navega no cardápio
   └─▶ GET /public/menu/:slug
       └─▶ Retorna categorias e itens

5. Cliente faz pedido
   └─▶ POST /orders/session
       └─▶ Headers: x-session-token, x-fingerprint
       └─▶ Cria pedido e notifica cozinha via WebSocket

6. Cozinha confirma e prepara
   └─▶ PATCH /orders/:id/status
       └─▶ Notifica cliente via WebSocket

7. Cliente solicita conta
   └─▶ WebSocket: table:request-bill
       └─▶ Notifica caixa

8. Caixa fecha conta
   └─▶ POST /tables/:id/release
       └─▶ Marca pedidos como PAID
       └─▶ Encerra sessões
       └─▶ WebSocket: session:closed
```

---

## 🔒 Segurança

- **JWT** com refresh tokens
- **RSA** para criptografia de senhas no transporte
- **bcrypt** para hash de senhas no banco
- **Rate limiting** (Throttler)
- **CORS** configurado
- **Validação** de DTOs com class-validator
- **Guards** para autenticação e autorização
- **Fingerprint** de dispositivo para sessões

---

## 📞 Suporte

Para dúvidas sobre a API, consulte os controladores em `src/` ou abra uma issue no repositório.
