# 🍽️ QRMenu SaaS

Sistema SaaS de pedidos por QR Code para restaurantes com atualização em tempo real.

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **Docker** e **Docker Compose**
- **npm** ou **yarn**

## 🚀 Quick Start

### 1. Configurar ambiente

```bash
# Criar arquivos .env
npm run setup:env
```

### 2. Instalar dependências

```bash
npm run install:all
```

### 3. Iniciar infraestrutura (PostgreSQL + Redis)

```bash
npm run dev:infra
```

Aguarde alguns segundos para os containers iniciarem.

### 4. Configurar banco de dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate

# Popular com dados de teste
npm run db:seed
```

### 5. Iniciar todos os serviços

```bash
npm run dev:services
```

Ou simplesmente:

```bash
npm start
```

## 🌐 URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Web** | http://localhost:5173 | App do cliente |
| **Admin** | http://localhost:5174 | Painel administrativo |
| **API** | http://localhost:3000 | Backend API |
| **WebSocket** | http://localhost:3000/ws | Gateway tempo real |

## 👤 Credenciais de Teste

### Super Admin
- **Email:** admin@qrmenu.com
- **Senha:** Admin@123

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

## 🔐 Permissões por Cargo (RBAC)

| Cargo | Acesso no Painel Admin | Pode Editar? |
|-------|------------------------|--------------|
| **SUPER_ADMIN** | Tudo (todos os restaurantes) | ✅ Tudo |
| **ADMIN** | Dashboard, Cozinha, Caixa, Mesas, Cardápio, Usuários, Relatórios, Configurações | ✅ Tudo |
| **MANAGER** | Dashboard, Cozinha, Caixa, Mesas, Cardápio | ❌ Apenas visualização |
| **KITCHEN** | Cozinha | ✅ Atualizar status de pedidos |
| **WAITER** | Mesas, Cozinha | ❌ Apenas visualização |
| **CASHIER** | Caixa, Mesas | ✅ Processar pagamentos |

### Detalhes das Permissões do Manager (Gerente)

O **Manager** tem acesso de **somente visualização** às seguintes áreas:
- ✅ **Dashboard** - Visualizar métricas e estatísticas
- ✅ **Cozinha** - Visualizar pedidos (não pode alterar status)
- ✅ **Caixa** - Visualizar contas
- ✅ **Mesas** - Visualizar mesas e QR Codes
- ✅ **Cardápio** - Visualizar categorias e itens

O **Manager NÃO pode**:
- ❌ Criar/editar/excluir mesas
- ❌ Criar/editar/excluir categorias do cardápio
- ❌ Criar/editar/excluir itens do cardápio
- ❌ Alterar disponibilidade de itens
- ❌ Acessar Usuários, Relatórios ou Configurações

## 📁 Estrutura do Projeto

```
qrmenu/
├── backend/          # API NestJS
│   ├── prisma/       # Schema e migrations
│   └── src/          # Código fonte
├── web/              # Frontend cliente (React + Vite)
│   └── src/
├── admin/            # Frontend admin (React + Vite)
│   └── src/
├── scripts/          # Scripts de automação
└── docker compose.yml
```

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev:all` | Inicia infra + todos os serviços |
| `npm run dev:services` | Inicia backend, web e admin |
| `npm run dev:infra` | Inicia PostgreSQL e Redis |
| `npm run dev:infra:stop` | Para os containers Docker |
| `npm run dev:backend` | Inicia apenas o backend |
| `npm run dev:web` | Inicia apenas o frontend cliente |
| `npm run dev:admin` | Inicia apenas o painel admin |
| `npm run kill` | Mata processos nas portas 3000, 5173, 5174 |
| `npm run kill:all` | Mata processos + para containers Docker |
| `npm run restart` | Mata processos e reinicia serviços |
| `npm run db:migrate` | Executa migrações do banco |
| `npm run db:seed` | Popula banco com dados de teste |
| `npm run db:studio` | Abre Prisma Studio (UI do banco) |
| `npm run db:reset` | Reseta banco e reexecuta migrações |

## 🧪 Testando a Aplicação

### 1. Testar como Admin

1. Acesse http://localhost:5174
2. Faça login com `joao@casadosabor.com` / `Admin@123`
3. Navegue pelo painel: Dashboard, Cardápio, Mesas, Cozinha

### 2. Testar diferentes cargos

- **Cozinha:** Login com `carlos@casadosabor.com` → Verá apenas a tela de Cozinha
- **Caixa:** Login com `lucia@casadosabor.com` → Verá apenas Caixa e Mesas
- **Garçom:** Login com `pedro@casadosabor.com` → Verá apenas Mesas e Cozinha

### 2. Testar como Cliente

1. No painel Admin, vá em "Mesas"
2. Clique no QR Code de uma mesa
3. Copie o link ou escaneie o QR
4. Complete o fluxo de verificação (o código aparece no console do backend)
5. Navegue pelo cardápio e faça um pedido

### 3. Verificar código SMS (Mock)

Como estamos usando mock para SMS, o código de verificação aparece no console do backend:

```
========================================
📱 CÓDIGO DE VERIFICAÇÃO (MOCK)
   Telefone: 11999999999
   Código: 123456
   Expira em: 300 segundos
========================================
```

### 4. Testar tempo real

1. Abra a tela da Cozinha no Admin (http://localhost:5174/kitchen)
2. Faça um pedido pelo app do cliente
3. Veja o pedido aparecer em tempo real na cozinha
4. Confirme e prepare o pedido
5. Veja a atualização no app do cliente

## 🐛 Solução de Problemas

### Erro de conexão com banco
```bash
# Verifique se os containers estão rodando
docker ps

# Reinicie a infraestrutura
npm run dev:infra:stop
npm run dev:infra
```

### Erro de dependências
```bash
# Reinstale tudo
rm -rf node_modules backend/node_modules web/node_modules admin/node_modules
npm run install:all
```

### Erro de Prisma
```bash
# Regenere o cliente
npm run db:generate

# Ou resete tudo
npm run db:reset
```

## 📄 Licença

Projeto privado - Todos os direitos reservados.

