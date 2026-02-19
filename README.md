# 🍽️ QRMenu SaaS

Sistema SaaS de pedidos por QR Code para restaurantes com atualização em tempo real.

## 📚 Documentação Detalhada

| Módulo | README | Descrição |
|--------|--------|-----------|
| 🔧 **Backend** | [backend/README.md](backend/README.md) | API NestJS, endpoints, WebSocket, banco de dados |
| 📱 **Web** | [web/README.md](web/README.md) | App do cliente, cardápio, pedidos |
| 🎛️ **Admin** | [admin/README.md](admin/README.md) | Painel administrativo, cozinha, caixa |

---

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTES                                        │
│                                                                              │
│   ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐   │
│   │   📱 Web App      │    │   🎛️ Admin Panel  │    │   📲 Mobile App   │   │
│   │   (Cliente)       │    │   (Gestão)        │    │   (Futuro)        │   │
│   │   React + Vite    │    │   React + Vite    │    │                   │   │
│   │   :5173           │    │   :5174           │    │                   │   │
│   └─────────┬─────────┘    └─────────┬─────────┘    └───────────────────┘   │
│             │                        │                                       │
│             └──────────┬─────────────┘                                       │
│                        │                                                     │
│                   HTTP │ WebSocket                                           │
│                        │                                                     │
└────────────────────────┼─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🔧 BACKEND (NestJS)                                │
│                              :3000                                           │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │ Auth        │  │ Restaurants │  │ Orders      │  │ WebSocket   │        │
│   │ (JWT+RSA)   │  │ (Multi-     │  │ (Pedidos)   │  │ (Real-time) │        │
│   │             │  │  tenant)    │  │             │  │             │        │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │ Tables      │  │ Menu        │  │ Sessions    │  │ Reports     │        │
│   │ (QR Code)   │  │ (Cardápio)  │  │ (Clientes)  │  │ (Métricas)  │        │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                         │                    │
                         │                    │
              ┌──────────┴──────────┐   ┌─────┴──────────────┐
              ▼                     │   │                    ▼
    ┌──────────────────┐            │   │        ┌──────────────────┐
    │  🐘 PostgreSQL   │            │   │        │    🔴 Redis      │
    │  (Dados)         │            │   │        │  (Cache/Sessions)│
    │  :5432           │            │   │        │    :6379         │
    └──────────────────┘            │   │        └──────────────────┘
                                    │   │
                                    └───┘
                                 Docker Compose
```

---

## 📋 Pré-requisitos

- **Node.js** 18+
- **Docker** e **Docker Compose**
- **npm** ou **yarn**

---

## 🚀 Quick Start

### Setup Completo (Primeira vez)

```bash
# 1. Clonar repositório
git clone <repo-url>
cd qrmenu

# 2. Setup automatizado (cria .env, instala deps, inicia Docker, migra banco)
npm run setup
```

### Desenvolvimento Diário

```bash
# Iniciar tudo (Docker + Backend + Web + Admin)
npm run dev:all

# OU iniciar apenas o que precisa:
npm run dev:infra      # Apenas PostgreSQL + Redis
npm run dev:services   # Apenas Backend + Web + Admin
npm run dev:backend    # Apenas Backend
npm run dev:web        # Apenas Web
npm run dev:admin      # Apenas Admin
```

### Parar Serviços

```bash
# Parar serviços (mantém containers)
npm run kill

# Parar tudo (mantém containers Docker)
npm run kill:all

# Parar e remover containers Docker
npm run kill:all:down

# Parar e remover containers + APAGAR DADOS
npm run dev:infra:reset
```

---

## 🌐 URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Web App** | http://localhost:5173 | App do cliente (QR Code) |
| **Admin Panel** | http://localhost:5174 | Painel administrativo |
| **API** | http://localhost:3000 | Backend REST |
| **WebSocket** | ws://localhost:3000 | Gateway tempo real |
| **Prisma Studio** | http://localhost:5555 | UI do banco (via `npm run db:studio`) |

---

## 👤 Credenciais de Teste

### Super Admin

| Email | Senha | Acesso |
|-------|-------|--------|
| admin@qrmenu.com | Admin@123 | Todos os restaurantes |

### Casa do Sabor

| Cargo | Email | Senha |
|-------|-------|-------|
| Admin | joao@casadosabor.com | Admin@123 |
| Gerente | ana@casadosabor.com | Admin@123 |
| Cozinha | carlos@casadosabor.com | Admin@123 |
| Garçom | pedro@casadosabor.com | Admin@123 |
| Caixa | lucia@casadosabor.com | Admin@123 |

### Pizzaria Bella

| Cargo | Email | Senha |
|-------|-------|-------|
| Admin | maria@pizzariabella.com | Admin@123 |
| Cozinha | roberto@pizzariabella.com | Admin@123 |
| Garçom | fernanda@pizzariabella.com | Admin@123 |

---

## 🔐 Permissões por Cargo (RBAC)

| Cargo | Páginas | Ações |
|-------|---------|-------|
| **SUPER_ADMIN** | Todas | Tudo em todos os restaurantes |
| **ADMIN** | Dashboard, Cozinha, Caixa, Mesas, Cardápio, Usuários, Relatórios, Config | Tudo no próprio restaurante |
| **MANAGER** | Dashboard, Cozinha, Caixa, Mesas, Cardápio | Somente visualização |
| **KITCHEN** | Cozinha | Atualizar status de pedidos |
| **WAITER** | Mesas, Cozinha | Visualizar mesas e pedidos |
| **CASHIER** | Caixa, Mesas | Processar pagamentos |

---

## 📁 Estrutura do Projeto

```
qrmenu/
├── backend/              # 🔧 API NestJS
│   ├── prisma/           #    Schema e migrations
│   ├── src/              #    Código fonte
│   ├── scripts/          #    Utilitários
│   └── README.md         #    📖 Documentação detalhada
│
├── web/                  # 📱 Frontend cliente (React + Vite)
│   ├── src/
│   └── README.md         #    📖 Documentação detalhada
│
├── admin/                # 🎛️ Frontend admin (React + Vite)
│   ├── src/
│   └── README.md         #    📖 Documentação detalhada
│
├── scripts/              # Scripts de automação
│   ├── kill-ports.js     #    Mata processos nas portas
│   └── setup-env.js      #    Cria arquivos .env
│
├── docker-compose.yml    # Infraestrutura Docker
├── package.json          # Scripts npm do workspace
└── README.md             # 📖 Este arquivo
```

---

## 📝 Scripts Disponíveis

### Desenvolvimento

| Comando | Descrição |
|---------|-----------|
| `npm run dev:all` | Inicia infra + todos os serviços |
| `npm run dev:services` | Inicia backend, web e admin |
| `npm run dev:infra` | Inicia PostgreSQL e Redis (Docker) |
| `npm run dev:infra:stop` | Para containers (mantém) |
| `npm run dev:infra:down` | Para e remove containers |
| `npm run dev:infra:reset` | Para, remove containers e APAGA volumes |
| `npm run dev:backend` | Inicia apenas o backend |
| `npm run dev:web` | Inicia apenas o frontend cliente |
| `npm run dev:admin` | Inicia apenas o painel admin |

### Controle

| Comando | Descrição |
|---------|-----------|
| `npm run kill` | Mata processos nas portas 3000, 5173, 5174 |
| `npm run kill:all` | Mata processos + para containers |
| `npm run kill:all:down` | Mata processos + remove containers |
| `npm run restart` | Mata processos e reinicia serviços |

### Banco de Dados

| Comando | Descrição |
|---------|-----------|
| `npm run db:migrate` | Executa migrações do Prisma |
| `npm run db:seed` | Popula banco com dados de teste |
| `npm run db:studio` | Abre Prisma Studio (UI do banco) |
| `npm run db:reset` | Reseta banco e reexecuta migrações |
| `npm run db:generate` | Regenera cliente Prisma |

### Setup

| Comando | Descrição |
|---------|-----------|
| `npm run setup` | Setup completo automatizado |
| `npm run setup:env` | Cria arquivos .env |
| `npm run install:all` | Instala todas as dependências |

---

## 🧪 Testes Automatizados

O projeto possui testes automatizados para **backend**, **admin** e **web**. Execute:

```bash
# Rodar TODOS os testes (backend + web + admin)
npm test

# Rodar apenas backend
npm run test:backend

# Rodar apenas web (cliente)
npm run test:web

# Rodar apenas admin (painel)
npm run test:admin

# Rodar testes com cobertura
npm run test:coverage
```

### Resumo dos testes

| Projeto | Framework | Testes | Tipo |
|---------|-----------|--------|------|
| **Backend** | Jest + ts-jest | ~97 | Unit (services) + E2E |
| **Admin** | Vitest + Testing Library | ~44 | Unit (stores, config, utils) |
| **Web** | Vitest + Testing Library | ~30 | Unit (stores, utils) |

### O que é testado

- **Backend:** AuthService, OrdersService, SessionsService, TablesService, UsersService, RestaurantsService, calculateDistance, isRestaurantOpen, validação de status transitions
- **Admin:** authStore (login/logout, Super Admin selectedRestaurant, getEffectiveRestaurant), notificationStore (add/read/remove), permissions (RBAC), formatters
- **Web:** sessionStore (session lifecycle, isSessionValid), cartStore (add/remove/clear, subtotal, cross-restaurant cart), formatters

---

## 🧪 Testando a Aplicação (Manual)

### 1. Testar como Admin

1. Acesse http://localhost:5174
2. Login: `joao@casadosabor.com` / `Admin@123`
3. Navegue: Dashboard → Cardápio → Mesas → Cozinha

### 2. Testar como Cliente (QR Code)

1. No Admin, vá em **Mesas**
2. Clique no QR Code de uma mesa
3. Copie o link ou escaneie o QR
4. Preencha nome e telefone
5. O código SMS aparece no **console do backend**:

```
========================================
📱 CÓDIGO DE VERIFICAÇÃO (MOCK)
   Telefone: 11999999999
   Código: 123456
   Expira em: 300 segundos
========================================
```

6. Digite o código e navegue pelo cardápio
7. Faça um pedido

### 3. Testar Tempo Real

1. Abra **Cozinha** no Admin (http://localhost:5174/kitchen)
2. Faça um pedido pelo app do cliente
3. Veja o pedido aparecer instantaneamente
4. Confirme e prepare o pedido
5. Veja a atualização no app do cliente

### 4. Testar Diferentes Cargos

- **Cozinha:** `carlos@casadosabor.com` → Apenas tela de Cozinha
- **Caixa:** `lucia@casadosabor.com` → Apenas Caixa e Mesas
- **Garçom:** `pedro@casadosabor.com` → Apenas Mesas e Cozinha
- **Gerente:** `ana@casadosabor.com` → Visualização (sem edição)

---

## 🐛 Solução de Problemas

### Erro de conexão com banco

```bash
# Verificar se containers estão rodando
docker ps

# Reiniciar infraestrutura
npm run dev:infra:stop
npm run dev:infra
```

### Erro de dependências

```bash
# Reinstalar tudo
rm -rf node_modules backend/node_modules web/node_modules admin/node_modules
npm run install:all
```

### Erro de Prisma

```bash
# Regenerar cliente
npm run db:generate

# Ou resetar tudo
npm run db:reset
```

### Sessão inválida no cliente

```bash
# Limpar localStorage no navegador
# DevTools (F12) → Application → Local Storage → Clear
```

### Portas ocupadas

```bash
# Matar processos nas portas
npm run kill
```

---

## 🔧 Variáveis de Ambiente

### Backend (.env)

```env
PORT=3000
DATABASE_URL="postgresql://qrmenu:qrmenu123@localhost:5432/qrmenu"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="sua-chave-secreta"
GEOLOCATION_ENABLED=false
```

### Web (.env)

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### Admin (.env)

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

---

## 🐳 Docker

### Volumes (Dados Persistentes)

| Volume | Conteúdo |
|--------|----------|
| `postgres_data` | Banco de dados PostgreSQL |
| `redis_data` | Cache e sessões Redis |

> ⚠️ Os volumes são **preservados** ao parar containers com `docker-compose stop` ou `docker-compose down`. Use `docker-compose down -v` para **apagar dados**.

### Comandos Úteis

```bash
# Ver containers rodando
docker ps

# Ver logs do PostgreSQL
docker logs qrmenu-postgres

# Ver logs do Redis
docker logs qrmenu-redis

# Entrar no PostgreSQL
docker exec -it qrmenu-postgres psql -U qrmenu

# Entrar no Redis
docker exec -it qrmenu-redis redis-cli
```

---

## 📞 Suporte

Para detalhes específicos, consulte a documentação de cada módulo:

- **Backend:** [backend/README.md](backend/README.md)
- **Web:** [web/README.md](web/README.md)
- **Admin:** [admin/README.md](admin/README.md)

---

## 📄 Licença

Projeto privado - Todos os direitos reservados.
