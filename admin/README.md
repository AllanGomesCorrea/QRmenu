# 🎛️ QRMenu Admin (Painel Administrativo)

Aplicação frontend para **gestão** do restaurante - dashboard, cozinha, caixa, cardápio, mesas, usuários e relatórios.

## 📚 Índice

- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Sistema de Permissões (RBAC)](#sistema-de-permissões-rbac)
- [Páginas](#páginas)
- [Componentes](#componentes)
- [Hooks](#hooks)
- [Stores (Estado Global)](#stores-estado-global)
- [Notificações em Tempo Real](#notificações-em-tempo-real)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)

---

## 🏗️ Arquitetura

```
┌────────────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR DO ADMIN                             │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         React Application                        │  │
│  │                                                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │  │
│  │  │   React Router  │  │  React Query    │  │    Zustand      │  │  │
│  │  │   (Navegação)   │  │  (Server State) │  │  (Client State) │  │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │  │
│  │                                                                   │  │
│  │  ┌──────────────────────────────────────────────────────────┐    │  │
│  │  │                    LAYOUT + ROUTING                       │    │  │
│  │  │  ProtectedRoute → RBAC → Sidebar → Header → Content       │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  │                              │                                    │  │
│  │  ┌──────────────────────────────────────────────────────────┐    │  │
│  │  │                        PAGES                              │    │  │
│  │  │  Login │ Dashboard │ Kitchen │ Cashier │ Tables │ Menu   │    │  │
│  │  │  Users │ Reports │ Settings                               │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  │                              │                                    │  │
│  │  ┌──────────────────────────────────────────────────────────┐    │  │
│  │  │                       HOOKS                               │    │  │
│  │  │  useMenu │ useOrders │ useTables │ useReports │ useSocket │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  │                              │                                    │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                        │  │
│  │  │   authStore     │  │ notificationStore│                       │  │
│  │  │   (Auth/JWT)    │  │  (Notificações) │                        │  │
│  │  └─────────────────┘  └─────────────────┘                        │  │
│  │                                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                         │                           │                   │
│                    HTTP │                   WebSocket                   │
└──────────────────────────────────────────────────────────────────────────┘
                         │                           │
                         ▼                           ▼
              ┌──────────────────┐        ┌──────────────────┐
              │   Backend API    │        │  WebSocket GW    │
              │   (REST + JWT)   │        │  (Socket.IO)     │
              └──────────────────┘        └──────────────────┘
```

### Fluxo de Autenticação

```
1. Usuário acessa /login
   └─▶ Carrega chave pública RSA

2. Digita email e senha
   └─▶ Senha criptografada com RSA

3. POST /auth/login
   └─▶ Retorna accessToken + refreshToken

4. Tokens salvos no authStore (localStorage)

5. Todas as requisições incluem:
   └─▶ Authorization: Bearer {accessToken}

6. Token expira? Interceptor faz refresh automático
```

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | 18.x | UI Library |
| **TypeScript** | 5.x | Tipagem estática |
| **Vite** | 5.x | Build tool |
| **React Router** | 6.x | Navegação SPA |
| **React Query** | 5.x | Cache e fetching |
| **Zustand** | 4.x | Estado global |
| **Tailwind CSS** | 3.x | Estilização |
| **Framer Motion** | 10.x | Animações |
| **Socket.IO Client** | 4.x | WebSocket |
| **React Hook Form** | 7.x | Formulários |
| **Zod** | 3.x | Validação |
| **Recharts** | 3.x | Gráficos |
| **Lucide React** | - | Ícones |

---

## 📁 Estrutura de Pastas

```
admin/
├── public/                    # Arquivos estáticos
├── src/
│   ├── main.tsx              # Ponto de entrada
│   ├── App.tsx               # Rotas e providers
│   ├── index.css             # Estilos globais (Tailwind)
│   │
│   ├── components/           # Componentes reutilizáveis
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx   # Guard de rotas com RBAC
│   │   └── layout/
│   │       ├── Layout.tsx           # Layout principal
│   │       ├── Sidebar.tsx          # Menu lateral
│   │       ├── Header.tsx           # Cabeçalho
│   │       └── NotificationsDropdown.tsx  # Sino de notificações
│   │
│   ├── config/               # Configurações
│   │   └── permissions.ts    # RBAC - roles e permissões
│   │
│   ├── constants/            # Constantes
│   │   └── colors.ts         # Paleta de cores
│   │
│   ├── pages/                # Páginas da aplicação
│   │   ├── LoginPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── kitchen/
│   │   │   └── KitchenPage.tsx
│   │   ├── cashier/
│   │   │   └── CashierPage.tsx
│   │   ├── tables/
│   │   │   ├── TablesPage.tsx
│   │   │   ├── TableModal.tsx
│   │   │   └── QRCodeModal.tsx
│   │   ├── menu/
│   │   │   ├── MenuPage.tsx
│   │   │   ├── CategoryModal.tsx
│   │   │   └── MenuItemModal.tsx
│   │   ├── users/
│   │   │   └── UsersPage.tsx
│   │   ├── reports/
│   │   │   └── ReportsPage.tsx
│   │   └── settings/
│   │       └── SettingsPage.tsx
│   │
│   ├── hooks/                # Custom hooks
│   │   ├── useMenu.ts        # CRUD cardápio
│   │   ├── useOrders.ts      # Pedidos
│   │   ├── useTables.ts      # Mesas
│   │   ├── useReports.ts     # Relatórios
│   │   ├── usePermissions.ts # Verificar permissões
│   │   └── useSocket.ts      # WebSocket
│   │
│   ├── providers/            # React Context Providers
│   │   └── AuthProvider.tsx  # Contexto de autenticação
│   │
│   ├── stores/               # Estado global (Zustand)
│   │   ├── authStore.ts      # Autenticação (tokens)
│   │   └── notificationStore.ts  # Notificações
│   │
│   ├── services/             # Serviços externos
│   │   ├── api.ts            # Cliente Axios
│   │   └── crypto.ts         # Criptografia RSA
│   │
│   ├── types/                # Tipos TypeScript
│   │   └── index.ts          # Interfaces globais
│   │
│   └── utils/                # Utilitários
│       └── formatters.ts     # Formatação (moeda, data)
│
├── tailwind.config.js        # Configuração Tailwind
├── vite.config.ts            # Configuração Vite
├── tsconfig.json             # Configuração TypeScript
├── Dockerfile                # Container para produção
└── package.json
```

---

## 🔐 Sistema de Permissões (RBAC)

### Roles (Cargos)

| Role | Descrição | Página Inicial |
|------|-----------|----------------|
| **SUPER_ADMIN** | Gerencia todos os restaurantes | /dashboard |
| **ADMIN** | Dono/gerente do restaurante | /dashboard |
| **MANAGER** | Supervisor (somente visualização) | /dashboard |
| **KITCHEN** | Cozinha | /kitchen |
| **WAITER** | Garçom | /tables |
| **CASHIER** | Caixa | /cashier |

### Permissões por Role

```
┌─────────────────┬───────┬───────┬─────────┬─────────┬────────┬─────────┐
│    Permissão    │ Super │ Admin │ Manager │ Kitchen │ Waiter │ Cashier │
│                 │ Admin │       │         │         │        │         │
├─────────────────┼───────┼───────┼─────────┼─────────┼────────┼─────────┤
│ dashboard:view  │   ✅   │   ✅   │    ✅    │    ❌    │   ❌    │    ❌    │
│ kitchen:view    │   ✅   │   ✅   │    ✅    │    ✅    │   ✅    │    ❌    │
│ kitchen:manage  │   ✅   │   ✅   │    ❌    │    ✅    │   ❌    │    ❌    │
│ cashier:view    │   ✅   │   ✅   │    ✅    │    ❌    │   ❌    │    ✅    │
│ cashier:manage  │   ✅   │   ✅   │    ❌    │    ❌    │   ❌    │    ✅    │
│ tables:view     │   ✅   │   ✅   │    ✅    │    ❌    │   ✅    │    ✅    │
│ tables:manage   │   ✅   │   ✅   │    ❌    │    ❌    │   ❌    │    ❌    │
│ menu:view       │   ✅   │   ✅   │    ✅    │    ❌    │   ❌    │    ❌    │
│ menu:manage     │   ✅   │   ✅   │    ❌    │    ❌    │   ❌    │    ❌    │
│ users:view      │   ✅   │   ✅   │    ❌    │    ❌    │   ❌    │    ❌    │
│ users:manage    │   ✅   │   ✅   │    ❌    │    ❌    │   ❌    │    ❌    │
│ reports:view    │   ✅   │   ✅   │    ❌    │    ❌    │   ❌    │    ❌    │
│ settings:view   │   ✅   │   ✅   │    ❌    │    ❌    │   ❌    │    ❌    │
│ settings:manage │   ✅   │   ✅   │    ❌    │    ❌    │   ❌    │    ❌    │
└─────────────────┴───────┴───────┴─────────┴─────────┴────────┴─────────┘
```

### Uso no Código

```typescript
// Hook usePermissions
const { hasPermission, canManage } = usePermissions();

// Verificar permissão específica
if (hasPermission('menu:manage')) {
  // Mostrar botão de editar
}

// Guard de rota
<ProtectedRoute permission="kitchen:view">
  <KitchenPage />
</ProtectedRoute>
```

---

## 📄 Páginas

### LoginPage (`/login`)

Tela de login com:
- Email e senha
- Criptografia RSA da senha
- Redirect para página inicial baseada no role

### DashboardPage (`/dashboard`)

Painel com métricas:
- Pedidos do dia
- Faturamento
- Mesas ocupadas
- Gráficos de vendas

### KitchenPage (`/kitchen`)

Kanban de pedidos:
- Colunas: Pendentes → Confirmados → Preparando → Prontos
- Atualização em tempo real
- Botões de ação por status

### CashierPage (`/cashier`)

Gestão de contas:
- Mesas com contas abertas
- Detalhamento por cliente
- Processamento de pagamento
- Fechamento de mesa

### TablesPage (`/tables`)

Gestão de mesas:
- Grid visual com status
- Criar/editar mesas
- Gerar/baixar QR Codes
- Ativar/desativar mesas

### MenuPage (`/menu`)

Gestão do cardápio:
- Categorias colapsáveis
- CRUD de itens
- Toggle disponibilidade
- Reordenação drag-and-drop

### UsersPage (`/users`)

Gestão de usuários:
- Lista de funcionários
- CRUD com roles
- Ativar/desativar

### ReportsPage (`/reports`)

Relatórios e métricas:
- Filtros por período
- Vendas por dia/semana/mês
- Top itens vendidos
- Exportação (futuro)

### SettingsPage (`/settings`)

Configurações do restaurante:
- Dados básicos
- Horário de funcionamento
- Geolocalização
- Aparência

---

## 🧱 Componentes

### Layout

```typescript
<Layout>
  <Sidebar />      // Menu lateral com links
  <Header />       // Barra superior com user info
  <NotificationsDropdown />  // Sino com notificações
  <Outlet />       // Conteúdo da página
</Layout>
```

### ProtectedRoute

Guard de rotas que verifica:
1. Se está autenticado
2. Se tem permissão necessária

```typescript
<ProtectedRoute permission="menu:manage">
  <MenuPage />
</ProtectedRoute>
```

### NotificationsDropdown

Dropdown com notificações em tempo real:
- Novos pedidos
- Garçom chamado
- Conta solicitada
- Badge com contador de não lidas

---

## 🪝 Hooks

### useMenu

CRUD completo do cardápio.

```typescript
const { 
  categories, 
  createCategory, 
  updateItem,
  toggleAvailability 
} = useMenu();
```

### useOrders

Gestão de pedidos para cozinha e caixa.

```typescript
const { 
  orders, 
  kitchenOrders,
  updateStatus,
  cancelOrder 
} = useOrders();
```

### useTables

Gestão de mesas.

```typescript
const { 
  tables,
  createTable,
  activateTable,
  releaseTable,
  getQRCode 
} = useTables();
```

### useReports

Dados para relatórios.

```typescript
const { 
  stats,
  dailySales,
  topItems 
} = useReports(period);
```

### usePermissions

Verificação de permissões RBAC.

```typescript
const { 
  hasPermission,
  canManage,
  canView 
} = usePermissions();
```

### useSocket

Conexão WebSocket para tempo real.

```typescript
// Conecta automaticamente quando autenticado
// Escuta eventos e adiciona notificações
```

---

## 📦 Stores (Estado Global)

### authStore

Gerencia autenticação e tokens.

```typescript
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  restaurantId: string | null;
  
  login: (tokens, user) => void;
  logout: () => void;
  setTokens: (access, refresh) => void;
  isAuthenticated: () => boolean;
}
```

### notificationStore

Gerencia notificações em tempo real.

```typescript
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  
  addNotification: (notification) => void;
  markAsRead: (id) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}
```

---

## 🔔 Notificações em Tempo Real

### Eventos Recebidos

| Evento | Descrição | Ação |
|--------|-----------|------|
| `order:created` | Novo pedido | Notificação + refetch |
| `order:updated` | Status alterado | Refetch |
| `table:waiter-called` | Garçom chamado | Notificação |
| `table:bill-requested` | Conta solicitada | Notificação |

### Fluxo

```
1. WebSocket conecta com JWT
   └─▶ auth: { token: accessToken }

2. Socket se inscreve na sala do restaurante
   └─▶ subscribe:restaurant { restaurantId }

3. Eventos chegam em tempo real
   └─▶ notificationStore.addNotification()
   └─▶ React Query invalida cache

4. UI atualiza automaticamente
```

---

## ⚙️ Variáveis de Ambiente

Criar arquivo `.env` na raiz do admin:

```env
# API Backend
VITE_API_URL=http://localhost:3000

# WebSocket
VITE_WS_URL=http://localhost:3000
```

---

## 📜 Scripts

```bash
# Desenvolvimento
npm run dev        # Inicia servidor (porta 5174)

# Build
npm run build      # Compila para dist/

# Preview
npm run preview    # Visualiza build

# Lint
npm run lint       # Verifica código
```

---

## 🎨 Estilos

### Tema de Cores

```javascript
// constants/colors.ts
const colors = {
  primary: '#3B82F6',    // Azul
  success: '#22C55E',    // Verde
  warning: '#F59E0B',    // Amarelo
  danger: '#EF4444',     // Vermelho
  // ...
}
```

### Status de Pedidos

| Status | Cor | Descrição |
|--------|-----|-----------|
| PENDING | Amarelo | Aguardando |
| CONFIRMED | Azul | Confirmado |
| PREPARING | Laranja | Em preparo |
| READY | Verde | Pronto |
| PAID | Cinza | Pago |
| CANCELLED | Vermelho | Cancelado |

---

## 🧪 Testando

### Credenciais de Teste

```
# Admin completo
joao@casadosabor.com / Admin@123

# Cozinha
carlos@casadosabor.com / Admin@123

# Garçom
pedro@casadosabor.com / Admin@123

# Caixa
lucia@casadosabor.com / Admin@123

# Gerente (somente visualização)
ana@casadosabor.com / Admin@123
```

### Fluxo de Teste

1. **Login** como Admin
2. **Dashboard**: Verificar métricas
3. **Cardápio**: Criar/editar itens
4. **Mesas**: Gerar QR Code
5. Abrir Web em outra aba, fazer pedido
6. **Cozinha**: Ver pedido chegar em tempo real
7. **Caixa**: Processar pagamento

---

## 📱 Responsividade

- **Desktop** (> 1024px): Layout completo com sidebar
- **Tablet** (768px - 1024px): Sidebar colapsável
- **Mobile** (< 768px): Menu hamburguer

---

## 🔐 Segurança

- **JWT** com refresh automático
- **RSA** para criptografia de senha no transporte
- **RBAC** para controle de acesso granular
- **Guards** em todas as rotas protegidas
- **Logout** limpa tokens e redireciona

---

## 📞 Suporte

Para dúvidas, consulte os componentes em `src/` ou abra uma issue no repositório.
