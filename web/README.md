# 📱 QRMenu Web (App do Cliente)

Aplicação frontend para **clientes** do restaurante - escanear QR Code, visualizar cardápio e fazer pedidos.

## 📚 Índice

- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Fluxo do Usuário](#fluxo-do-usuário)
- [Componentes](#componentes)
- [Hooks](#hooks)
- [Stores (Estado Global)](#stores-estado-global)
- [Serviços](#serviços)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)

---

## 🏗️ Arquitetura

```
┌────────────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR DO CLIENTE                           │
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
│  │  │                        PAGES                              │    │  │
│  │  │  Landing │ Restaurants │ TablePage │ RestaurantPage       │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  │                              │                                    │  │
│  │  ┌──────────────────────────────────────────────────────────┐    │  │
│  │  │                     COMPONENTS                            │    │  │
│  │  │  Header │ Menu │ Cart │ Orders │ Modals                   │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  │                              │                                    │  │
│  │  ┌──────────────────────────────────────────────────────────┐    │  │
│  │  │                       HOOKS                               │    │  │
│  │  │  useMenu │ useSession │ useOrders │ useSocket             │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  │                              │                                    │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                        │  │
│  │  │   sessionStore  │  │    cartStore    │                        │  │
│  │  │   (Sessão)      │  │   (Carrinho)    │                        │  │
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
              │   (REST)         │        │  (Socket.IO)     │
              └──────────────────┘        └──────────────────┘
```

### Fluxo de Dados

1. **React Query** gerencia dados do servidor (cardápio, pedidos)
2. **Zustand** gerencia estado local (sessão, carrinho)
3. **Socket.IO** recebe atualizações em tempo real
4. **localStorage** persiste sessão e carrinho

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
| **Zod** | 3.x | Validação de schemas |
| **Lucide React** | - | Ícones |
| **FingerprintJS** | 4.x | Identificação de dispositivo |

---

## 📁 Estrutura de Pastas

```
web/
├── public/                    # Arquivos estáticos
├── src/
│   ├── main.tsx              # Ponto de entrada
│   ├── App.tsx               # Rotas e providers
│   ├── index.css             # Estilos globais (Tailwind)
│   │
│   ├── components/           # Componentes reutilizáveis
│   │   ├── cart/
│   │   │   └── CartDrawer.tsx       # Drawer do carrinho
│   │   ├── layout/
│   │   │   ├── Header.tsx           # Cabeçalho
│   │   │   └── Footer.tsx           # Rodapé
│   │   ├── menu/
│   │   │   ├── MenuCategory.tsx     # Seção de categoria
│   │   │   ├── MenuItem.tsx         # Card de item
│   │   │   └── MenuItemModal.tsx    # Modal de detalhes
│   │   └── orders/
│   │       └── OrdersDrawer.tsx     # Drawer de pedidos
│   │
│   ├── pages/                # Páginas da aplicação
│   │   ├── customer/
│   │   │   ├── TablePage.tsx        # Registro na mesa (QR)
│   │   │   └── RestaurantPage.tsx   # Cardápio e pedidos
│   │   └── landing/
│   │       ├── AboutPage.tsx        # Página sobre
│   │       ├── RestaurantsListPage.tsx  # Lista de restaurantes
│   │       └── RestaurantPublicPage.tsx # Página pública
│   │
│   ├── hooks/                # Custom hooks
│   │   ├── useMenu.ts        # Buscar cardápio
│   │   ├── useSession.ts     # Gerenciar sessão
│   │   ├── useOrders.ts      # Buscar pedidos
│   │   └── useSocket.ts      # Conexão WebSocket
│   │
│   ├── stores/               # Estado global (Zustand)
│   │   ├── sessionStore.ts   # Sessão do cliente
│   │   └── cartStore.ts      # Carrinho de compras
│   │
│   ├── services/             # Serviços externos
│   │   ├── api.ts            # Cliente Axios
│   │   └── fingerprint.ts    # Gerador de fingerprint
│   │
│   ├── types/                # Tipos TypeScript
│   │   └── index.ts          # Interfaces globais
│   │
│   └── utils/                # Utilitários
│       ├── cn.ts             # Merge de classes CSS
│       └── formatters.ts     # Formatação (moeda, data)
│
├── tailwind.config.js        # Configuração Tailwind
├── vite.config.ts            # Configuração Vite
├── tsconfig.json             # Configuração TypeScript
├── Dockerfile                # Container para produção
└── package.json
```

---

## 🚶 Fluxo do Usuário

### 1. Escanear QR Code

```
┌─────────────────────────────────────────────────────────────────┐
│  QR Code na Mesa  →  URL: /r/{slug}/mesa/{qrCode}              │
│                                                                 │
│  Exemplo: https://qrmenu.com/r/casa-do-sabor/mesa/M1-ABC123    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        TablePage.tsx                            │
│                                                                 │
│  1. Verifica status da mesa (GET /sessions/table/:qrCode/status)│
│  2. Exibe formulário de registro                                │
│     - Nome do cliente                                           │
│     - Telefone (11 dígitos)                                     │
│  3. Solicita código SMS (POST /sessions/request-code)           │
│  4. Cliente digita código de 6 dígitos                          │
│  5. Verifica código (POST /sessions/verify)                     │
│  6. Redireciona para /pedido                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RestaurantPage.tsx                         │
│                                                                 │
│  Header: Logo | Nome | Carrinho | Pedidos                       │
│  ─────────────────────────────────────────────                  │
│  Destaques: [Item] [Item] [Item]                                │
│  ─────────────────────────────────────────────                  │
│  Categoria: Entradas                                            │
│    [Item] [Item] [Item]                                         │
│  Categoria: Pratos Principais                                   │
│    [Item] [Item] [Item]                                         │
│  ─────────────────────────────────────────────                  │
│  FAB: [🛒 Ver Carrinho] [👤 Garçom] [📋 Conta]                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Fazer Pedido

```
1. Cliente clica em um item do cardápio
   └─▶ MenuItemModal abre com detalhes

2. Cliente seleciona:
   - Quantidade
   - Extras/adicionais
   - Observações (opcional)

3. Clica em "Adicionar ao Carrinho"
   └─▶ Item é adicionado ao cartStore

4. Abre CartDrawer
   └─▶ Lista itens, total, botão "Fazer Pedido"

5. Confirma pedido
   └─▶ POST /orders/session
   └─▶ Limpa carrinho
   └─▶ Notifica cozinha via WebSocket
```

### 3. Acompanhar Pedido

```
1. Cliente abre OrdersDrawer
   └─▶ GET /orders/session/my-orders

2. Vê lista de pedidos com status:
   - 🕐 PENDING (Aguardando confirmação)
   - ✅ CONFIRMED (Confirmado)
   - 🔥 PREPARING (Em preparo)
   - 🍽️ READY (Pronto!)
   - 💰 PAID (Pago)
   - ❌ CANCELLED (Cancelado)

3. WebSocket notifica mudanças de status
   └─▶ order:updated
   └─▶ UI atualiza automaticamente
```

### 4. Finalizar

```
1. Cliente clica "Solicitar Conta"
   └─▶ WebSocket: table:request-bill
   └─▶ Cooldown de 60 segundos

2. Caixa fecha a conta
   └─▶ POST /tables/:id/release

3. WebSocket: session:closed
   └─▶ Modal "Obrigado!" aparece
   └─▶ Sessão e carrinho são limpos
```

---

## 🧱 Componentes

### CartDrawer

Drawer lateral para visualização e gerenciamento do carrinho.

**Props:** `isOpen`, `onClose`

**Funcionalidades:**
- Listar itens do carrinho
- Alterar quantidade
- Remover itens
- Mostrar subtotal
- Botão para finalizar pedido

### OrdersDrawer

Drawer lateral para acompanhamento de pedidos.

**Props:** `isOpen`, `onClose`

**Funcionalidades:**
- Listar pedidos da mesa
- Destacar pedidos do próprio usuário (vs. outros da mesa)
- Mostrar totais (meu total vs. total da mesa)
- Status com cores e ícones

### MenuItemModal

Modal de detalhes de um item do cardápio.

**Props:** `item`, `isOpen`, `onClose`

**Funcionalidades:**
- Imagem ampliada
- Descrição completa
- Seleção de extras
- Quantidade
- Observações
- Botão adicionar ao carrinho

---

## 🪝 Hooks

### useMenu

Busca o cardápio público de um restaurante.

```typescript
const { data, isLoading, error } = useMenu(slug);
// data: { restaurant, categories, featuredItems }
```

### useSession

Gerencia o fluxo de sessão (registro, verificação).

```typescript
const { mutate: requestCode } = useRequestCode();
const { mutate: verifyCode } = useVerifyCode();
const { mutate: createSession } = useCreateSession();
```

### useOrders

Busca pedidos da sessão atual.

```typescript
const { data: orders, refetch } = useSessionOrders();
```

### useSocket

Gerencia conexão WebSocket e eventos em tempo real.

```typescript
const { callWaiter, requestBill, cooldowns } = useSocket();

// callWaiter - chama garçom (cooldown 60s)
// requestBill - solicita conta (cooldown 60s)
// cooldowns - { callWaiter: number, requestBill: number }
```

---

## 📦 Stores (Estado Global)

### sessionStore

Gerencia a sessão do cliente (persistida em localStorage).

```typescript
interface SessionStore {
  session: TableSession | null;
  sessionToken: string | null;
  fingerprint: string | null;
  
  setSession: (session, token) => void;
  setFingerprint: (fp) => void;
  clearSession: () => void;
  isSessionValid: () => boolean;
}
```

### cartStore

Gerencia o carrinho de compras (persistido em localStorage).

```typescript
interface CartStore {
  items: CartItem[];
  restaurantSlug: string | null;
  
  addItem: (item) => void;
  removeItem: (id) => void;
  updateQuantity: (id, quantity) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}
```

---

## 🌐 Serviços

### api.ts

Cliente Axios configurado com:
- Base URL da API
- Interceptors para injetar headers de sessão
- Tratamento de erros

```typescript
import api from './services/api';

// Headers automáticos:
// x-session-token: {sessionToken}
// x-fingerprint: {fingerprint}
```

### fingerprint.ts

Gera identificador único do dispositivo usando FingerprintJS.

```typescript
const fingerprint = await generateFingerprint();
// Retorna hash único do dispositivo
```

---

## ⚙️ Variáveis de Ambiente

Criar arquivo `.env` na raiz do web:

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
npm run dev        # Inicia servidor de desenvolvimento (Vite)

# Build
npm run build      # Compila para dist/

# Preview
npm run preview    # Visualiza build de produção

# Lint
npm run lint       # Verifica código com ESLint
```

---

## 🎨 Estilos

### Tailwind CSS

Configuração customizada em `tailwind.config.js`:

```javascript
// Cores personalizadas
colors: {
  primary: { ... },   // Cor principal do tema
  secondary: { ... }, // Cor secundária
}

// Animações
animation: {
  'fade-in': 'fadeIn 0.3s ease-in-out',
  'slide-up': 'slideUp 0.3s ease-out',
}
```

### Framer Motion

Usado para animações em:
- Modais (entrada/saída)
- Drawers (slide)
- Cards (hover)
- Listas (stagger)

---

## 📱 Responsividade

A aplicação é **mobile-first**, otimizada para smartphones:

- **Mobile** (< 640px): Layout em coluna
- **Tablet** (640px - 1024px): Grid 2 colunas
- **Desktop** (> 1024px): Grid 3+ colunas

---

## 🔐 Segurança

- **Sessão por dispositivo**: Fingerprint único
- **Token de sessão**: Gerado pelo backend, armazenado em localStorage
- **Validação**: Todos os formulários validados com Zod
- **HTTPS**: Recomendado em produção
- **Cooldowns**: Previne spam de notificações

---

## 🧪 Testando

1. Acesse uma mesa via QR Code ou URL direta:
   ```
   http://localhost:5173/r/casa-do-sabor/mesa/CASA-DO-SABOR-M1-XXXXXX
   ```

2. Preencha nome e telefone

3. O código SMS aparece no console do backend:
   ```
   📱 CÓDIGO DE VERIFICAÇÃO (MOCK)
      Telefone: 11999999999
      Código: 123456
   ```

4. Digite o código e navegue pelo cardápio

5. Faça pedidos e acompanhe em tempo real

---

## 📞 Suporte

Para dúvidas, consulte os componentes em `src/` ou abra uma issue no repositório.
