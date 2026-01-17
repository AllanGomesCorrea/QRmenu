# 🍽️ QRMenu SaaS - Sistema de Pedidos por QR Code

## 📋 Visão Geral do Projeto

Sistema SaaS multi-tenant que permite restaurantes cadastrarem seus estabelecimentos e gerenciarem pedidos através de QR codes individuais por mesa. Inspirado no [Gula.menu](https://gula.menu), mas com foco em **pedidos em tempo real** com validação de presença física.

### Fluxo Principal

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DO CLIENTE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   📱 Cliente escaneia QR Code da Mesa                                   │
│              │                                                          │
│              ▼                                                          │
│   ┌─────────────────────┐                                               │
│   │ Verificação de      │ ◀── Garçom libera mesa no sistema            │
│   │ Mesa Ativa?         │                                               │
│   └──────────┬──────────┘                                               │
│              │ SIM                                                      │
│              ▼                                                          │
│   ┌─────────────────────┐     ┌─────────────────────┐                  │
│   │ Já tem sessão ativa │ SIM │ Entra direto no     │                  │
│   │ neste dispositivo?  │────▶│ cardápio            │                  │
│   └──────────┬──────────┘     └─────────────────────┘                  │
│              │ NÃO                                                      │
│              ▼                                                          │
│   ┌─────────────────────┐                                               │
│   │ Cadastro: Nome +    │                                               │
│   │ Telefone            │                                               │
│   └──────────┬──────────┘                                               │
│              │                                                          │
│              ▼                                                          │
│   ┌─────────────────────┐                                               │
│   │ Código de verificação│ ◀── Enviado via WhatsApp/Telegram/SMS       │
│   │ 6 dígitos           │                                               │
│   └──────────┬──────────┘                                               │
│              │ VÁLIDO                                                   │
│              ▼                                                          │
│   ┌─────────────────────┐                                               │
│   │ 🍔 Cardápio Digital │                                               │
│   │ Seleciona itens     │                                               │
│   │ Define quantidades  │                                               │
│   │ Adiciona observações│                                               │
│   └──────────┬──────────┘                                               │
│              │                                                          │
│              ▼                                                          │
│   ┌─────────────────────┐     ┌─────────────────────┐                  │
│   │ Confirma Pedido     │────▶│ 🔔 Notifica Cozinha │                  │
│   └──────────┬──────────┘     │    em tempo real    │                  │
│              │                └─────────────────────┘                  │
│              ▼                                                          │
│   ┌─────────────────────┐                                               │
│   │ Acompanha status:   │                                               │
│   │ • Recebido          │                                               │
│   │ • Em preparo        │                                               │
│   │ • Pronto            │                                               │
│   │ • Entregue          │                                               │
│   └─────────────────────┘                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitetura do Sistema

### Arquitetura Multi-Tenant

```
┌────────────────────────────────────────────────────────────────────────┐
│                         SUPER ADMIN (Plataforma)                       │
│  • Gerencia restaurantes cadastrados                                   │
│  • Planos e assinaturas                                                │
│  • Métricas globais                                                    │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ Restaurante A │       │ Restaurante B │       │ Restaurante C │
│   (tenant_a)  │       │   (tenant_b)  │       │   (tenant_c)  │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ • Admin       │       │ • Admin       │       │ • Admin       │
│ • Cozinha     │       │ • Cozinha     │       │ • Cozinha     │
│ • Caixa       │       │ • Caixa       │       │ • Caixa       │
│ • Garçom      │       │ • Garçom      │       │ • Garçom      │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ Mesa 1..N     │       │ Mesa 1..N     │       │ Mesa 1..N     │
│ Cardápio      │       │ Cardápio      │       │ Cardápio      │
│ Pedidos       │       │ Pedidos       │       │ Pedidos       │
└───────────────┘       └───────────────┘       └───────────────┘
```

### Arquitetura Técnica

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │  Landing Page  │  │  Cliente Web   │  │  Admin Panel   │            │
│  │  (Marketing)   │  │  (Cardápio)    │  │  (Dashboard)   │            │
│  │                │  │                │  │                │            │
│  │  • Home        │  │  • Cardápio    │  │  • Cozinha     │            │
│  │  • Preços      │  │  • Carrinho    │  │  • Caixa       │            │
│  │  • Cadastro    │  │  • Pedidos     │  │  • Mesas       │            │
│  │  • Login       │  │  • Status      │  │  • Cardápio    │            │
│  └────────────────┘  └────────────────┘  │  • Relatórios  │            │
│                                          │  • Usuários    │            │
│  React + Vite + TypeScript               └────────────────┘            │
│  TailwindCSS + Framer Motion                                           │
│  Zustand (estado) + React Query                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS / WSS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  NestJS + TypeScript + Prisma ORM                                       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         API REST                                 │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  /api/auth          → Autenticação (JWT + Refresh Token)        │   │
│  │  /api/restaurants   → CRUD restaurantes (multi-tenant)          │   │
│  │  /api/tables        → Gerenciamento de mesas + QR codes         │   │
│  │  /api/menu          → Cardápio por restaurante                  │   │
│  │  /api/orders        → Pedidos (CRUD + status)                   │   │
│  │  /api/sessions      → Sessões de mesa (clientes)                │   │
│  │  /api/verification  → Códigos de verificação (WhatsApp/SMS)     │   │
│  │  /api/reports       → Relatórios e métricas                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      WebSocket Gateway                           │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  • Notificações de novos pedidos → Cozinha                      │   │
│  │  • Atualização de status → Cliente                              │   │
│  │  • Chamada de garçom → Garçom                                   │   │
│  │  • Pedido de conta → Caixa                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Serviços Externos                           │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  • Twilio / WhatsApp Business API → Verificação por SMS/WhatsApp│   │
│  │  • AWS S3 / Cloudinary → Upload de imagens                      │   │
│  │  • Redis → Cache + Sessões + Pub/Sub WebSocket                  │   │
│  │  • Bull/BullMQ → Filas de jobs (envio de mensagens)             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              DATABASE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PostgreSQL (Principal)          Redis (Cache/Sessões)                  │
│  ┌─────────────────────┐         ┌─────────────────────┐               │
│  │ • Restaurantes      │         │ • Sessões ativas    │               │
│  │ • Usuários          │         │ • Códigos verif.    │               │
│  │ • Mesas             │         │ • Cache cardápio    │               │
│  │ • Cardápio          │         │ • Pub/Sub WebSocket │               │
│  │ • Pedidos           │         └─────────────────────┘               │
│  │ • Sessões           │                                                │
│  │ • Histórico         │                                                │
│  └─────────────────────┘                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Segurança - Validação de Presença Física

### Problema Principal
> Como garantir que apenas pessoas **fisicamente presentes** no restaurante possam fazer pedidos?

### Solução Multi-Camadas

#### Camada 1: Mesa Ativa (Garçom)
```typescript
// Mesa só aceita pedidos se estiver com status ATIVA
enum TableStatus {
  INACTIVE,    // Mesa fechada (padrão)
  ACTIVE,      // Garçom ativou - aceita clientes
  OCCUPIED,    // Tem clientes ativos
  BILL_REQUESTED, // Conta solicitada
  CLOSED       // Aguardando limpeza
}
```

**Fluxo:**
1. Cliente senta na mesa
2. **Garçom ativa a mesa** no app (pode ser por proximidade NFC ou manualmente)
3. Mesa fica `ACTIVE` por tempo limitado (ex: 2 horas)
4. Ao escanear QR, sistema verifica se mesa está `ACTIVE` ou `OCCUPIED`

#### Camada 2: Verificação por Telefone
```typescript
// Código de 6 dígitos enviado via WhatsApp/SMS
interface VerificationCode {
  phone: string;
  code: string;        // "123456"
  tableId: string;
  restaurantId: string;
  expiresAt: Date;     // 5 minutos
  attempts: number;    // máx 3 tentativas
}
```

**Fluxo:**
1. Cliente informa nome + telefone
2. Sistema envia código de 6 dígitos via WhatsApp
3. Cliente insere código
4. Sessão criada vinculada ao dispositivo + telefone + mesa

#### Camada 3: Sessão com Fingerprint
```typescript
interface TableSession {
  id: string;
  tableId: string;
  customerId: string;
  phone: string;
  deviceFingerprint: string;  // Hash único do dispositivo
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;            // Expira quando mesa fecha
  isActive: boolean;
}
```

**Fingerprint inclui:**
- User-Agent do navegador
- Resolução de tela
- Timezone
- Idioma
- Canvas fingerprint
- WebGL fingerprint

#### Camada 4: Limitações de Segurança
```typescript
const SECURITY_RULES = {
  // Sessão
  maxSessionsPerTable: 10,        // Máx 10 pessoas por mesa
  sessionTimeout: '4h',           // Sessão expira em 4 horas
  
  // Verificação
  maxVerificationAttempts: 3,     // 3 tentativas de código
  verificationCodeTTL: '5m',      // Código expira em 5 min
  cooldownBetweenCodes: '60s',    // Espera 60s para novo código
  
  // Pedidos
  maxOrdersPerMinute: 5,          // Rate limit por sessão
  maxItemsPerOrder: 20,           // Limite de itens
  
  // Geolocalização (opcional - requer permissão)
  enableGeofencing: true,
  maxDistanceFromRestaurant: 100, // metros
};
```

#### Camada 5: Geofencing (Opcional)
```typescript
// Se cliente permitir localização, verificar proximidade
interface GeofenceCheck {
  restaurantLocation: {
    latitude: number;
    longitude: number;
  };
  customerLocation: {
    latitude: number;
    longitude: number;
  };
  maxDistance: number; // metros
}

function isWithinRestaurant(check: GeofenceCheck): boolean {
  const distance = calculateHaversineDistance(
    check.restaurantLocation,
    check.customerLocation
  );
  return distance <= check.maxDistance;
}
```

### Diagrama de Validação Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VALIDAÇÃO DE PEDIDO                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Pedido recebido                                                       │
│         │                                                               │
│         ▼                                                               │
│   ┌─────────────┐     NÃO    ┌──────────────────┐                      │
│   │ Mesa ativa? │──────────▶ │ ❌ ERRO: Mesa    │                      │
│   └──────┬──────┘            │    não disponível│                      │
│          │ SIM               └──────────────────┘                      │
│          ▼                                                              │
│   ┌─────────────┐     NÃO    ┌──────────────────┐                      │
│   │ Sessão      │──────────▶ │ ❌ ERRO: Sessão  │                      │
│   │ válida?     │            │    expirada      │                      │
│   └──────┬──────┘            └──────────────────┘                      │
│          │ SIM                                                          │
│          ▼                                                              │
│   ┌─────────────┐     NÃO    ┌──────────────────┐                      │
│   │ Fingerprint │──────────▶ │ ⚠️ ALERTA:       │                      │
│   │ consistente?│            │    Dispositivo   │                      │
│   └──────┬──────┘            │    diferente     │                      │
│          │ SIM               └────────┬─────────┘                      │
│          │                            │                                 │
│          │                            ▼                                 │
│          │                   ┌──────────────────┐                      │
│          │                   │ Requer nova      │                      │
│          │                   │ verificação      │                      │
│          │                   └──────────────────┘                      │
│          ▼                                                              │
│   ┌─────────────┐     NÃO    ┌──────────────────┐                      │
│   │ Rate limit  │──────────▶ │ ❌ ERRO: Muitos  │                      │
│   │ OK?         │            │    pedidos       │                      │
│   └──────┬──────┘            └──────────────────┘                      │
│          │ SIM                                                          │
│          ▼                                                              │
│   ┌─────────────┐     NÃO    ┌──────────────────┐                      │
│   │ Geofence    │──────────▶ │ ⚠️ LOG: Fora do  │                      │
│   │ (opcional)  │            │    perímetro     │                      │
│   └──────┬──────┘            └────────┬─────────┘                      │
│          │ SIM                        │                                 │
│          ▼                            │                                 │
│   ┌─────────────────────────────────────────────────────────┐          │
│   │                 ✅ PEDIDO ACEITO                         │          │
│   │  → Salva no banco                                        │          │
│   │  → Notifica cozinha via WebSocket                        │          │
│   │  → Registra log de auditoria                             │          │
│   └─────────────────────────────────────────────────────────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗃️ Modelo de Dados (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// MULTI-TENANT: RESTAURANTES
// ============================================================================

model Restaurant {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique  // URL amigável: /r/casa-do-porco
  description String?
  logoUrl     String?
  bannerUrl   String?
  
  // Endereço
  address     String
  city        String
  state       String
  zipCode     String
  latitude    Float?
  longitude   Float?
  
  // Contato
  phone       String
  email       String
  whatsapp    String?
  
  // Configurações
  settings    Json     @default("{}")  // Horários, cores, etc
  isActive    Boolean  @default(true)
  
  // Plano/Assinatura
  plan        RestaurantPlan @default(FREE)
  planExpiresAt DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relacionamentos
  users       User[]
  tables      Table[]
  categories  MenuCategory[]
  menuItems   MenuItem[]
  orders      Order[]
  
  @@index([slug])
  @@index([city, state])
}

enum RestaurantPlan {
  FREE        // Até 5 mesas, funcionalidades básicas
  STARTER     // Até 15 mesas
  PROFESSIONAL // Até 50 mesas + relatórios
  ENTERPRISE  // Ilimitado + API + suporte
}

// ============================================================================
// USUÁRIOS E AUTENTICAÇÃO
// ============================================================================

model User {
  id           String   @id @default(uuid())
  name         String
  email        String
  password     String
  phone        String?
  
  role         UserRole @default(WAITER)
  isActive     Boolean  @default(true)
  
  // Multi-tenant
  restaurantId String?
  restaurant   Restaurant? @relation(fields: [restaurantId], references: [id])
  
  // Super admin não tem restaurante vinculado
  isSuperAdmin Boolean @default(false)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relacionamentos
  refreshTokens RefreshToken[]
  orderLogs     OrderLog[]
  
  @@unique([email])
  @@index([restaurantId])
}

enum UserRole {
  SUPER_ADMIN  // Gerencia toda a plataforma
  ADMIN        // Dono/gerente do restaurante
  MANAGER      // Supervisor
  CASHIER      // Caixa - fecha contas
  KITCHEN      // Cozinha - vê pedidos para preparar
  WAITER       // Garçom - gerencia mesas
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([token])
}

// ============================================================================
// MESAS E SESSÕES
// ============================================================================

model Table {
  id           String      @id @default(uuid())
  number       Int                           // Número da mesa: 1, 2, 3...
  name         String?                       // Nome opcional: "Varanda 1"
  capacity     Int         @default(4)       // Capacidade de pessoas
  
  qrCode       String      @unique           // Código único para QR
  qrCodeUrl    String?                       // URL do QR gerado
  
  status       TableStatus @default(INACTIVE)
  
  // Multi-tenant
  restaurantId String
  restaurant   Restaurant  @relation(fields: [restaurantId], references: [id])
  
  // Localização dentro do restaurante
  section      String?     // "Salão Principal", "Varanda", "Rooftop"
  
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  // Relacionamentos
  sessions     TableSession[]
  orders       Order[]
  
  @@unique([restaurantId, number])
  @@index([restaurantId])
  @@index([qrCode])
}

enum TableStatus {
  INACTIVE       // Mesa não está em uso
  ACTIVE         // Garçom ativou, pronta para receber clientes
  OCCUPIED       // Tem clientes ativos
  BILL_REQUESTED // Conta foi solicitada
  CLOSED         // Fechada, aguardando limpeza
}

model TableSession {
  id                String   @id @default(uuid())
  
  // Identificação do cliente
  customerName      String
  customerPhone     String
  
  // Segurança
  deviceFingerprint String   // Hash do dispositivo
  ipAddress         String
  userAgent         String
  
  // Verificação
  isVerified        Boolean  @default(false)
  verifiedAt        DateTime?
  
  // Status
  isActive          Boolean  @default(true)
  
  // Relacionamentos
  tableId           String
  table             Table    @relation(fields: [tableId], references: [id])
  
  createdAt         DateTime @default(now())
  expiresAt         DateTime // Expira junto com a mesa
  
  // Pedidos feitos por esta sessão
  orders            Order[]
  
  @@index([tableId])
  @@index([customerPhone])
  @@index([deviceFingerprint])
}

// Códigos de verificação temporários (pode usar Redis também)
model VerificationCode {
  id           String   @id @default(uuid())
  phone        String
  code         String   // 6 dígitos
  tableId      String
  restaurantId String
  
  attempts     Int      @default(0)
  maxAttempts  Int      @default(3)
  
  createdAt    DateTime @default(now())
  expiresAt    DateTime // 5 minutos
  usedAt       DateTime?
  
  @@index([phone, code])
  @@index([expiresAt])
}

// ============================================================================
// CARDÁPIO
// ============================================================================

model MenuCategory {
  id           String     @id @default(uuid())
  name         String     // "Entradas", "Pratos Principais"
  description  String?
  imageUrl     String?
  sortOrder    Int        @default(0)
  isActive     Boolean    @default(true)
  
  // Multi-tenant
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
  
  // Relacionamentos
  items        MenuItem[]
  
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  
  @@index([restaurantId])
}

model MenuItem {
  id           String       @id @default(uuid())
  name         String
  description  String?
  price        Decimal      @db.Decimal(10, 2)
  
  imageUrl     String?
  
  // Flags
  isAvailable  Boolean      @default(true)
  isFeatured   Boolean      @default(false)
  isVegan      Boolean      @default(false)
  isVegetarian Boolean      @default(false)
  isGlutenFree Boolean      @default(false)
  isSpicy      Boolean      @default(false)
  
  // Tempo de preparo estimado (minutos)
  prepTime     Int?
  
  // Ordenação
  sortOrder    Int          @default(0)
  
  // Relacionamentos
  categoryId   String
  category     MenuCategory @relation(fields: [categoryId], references: [id])
  
  restaurantId String
  restaurant   Restaurant   @relation(fields: [restaurantId], references: [id])
  
  // Extras/Adicionais
  extras       MenuItemExtra[]
  
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  
  @@index([restaurantId])
  @@index([categoryId])
}

model MenuItemExtra {
  id         String   @id @default(uuid())
  name       String   // "Bacon extra", "Queijo cheddar"
  price      Decimal  @db.Decimal(10, 2)
  isRequired Boolean  @default(false)
  
  menuItemId String
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  
  @@index([menuItemId])
}

// ============================================================================
// PEDIDOS
// ============================================================================

model Order {
  id           String      @id @default(uuid())
  orderNumber  Int         // Número sequencial do dia
  
  status       OrderStatus @default(PENDING)
  
  // Totais
  subtotal     Decimal     @db.Decimal(10, 2)
  discount     Decimal     @default(0) @db.Decimal(10, 2)
  total        Decimal     @db.Decimal(10, 2)
  
  // Observações gerais
  notes        String?
  
  // Relacionamentos
  tableId      String
  table        Table       @relation(fields: [tableId], references: [id])
  
  sessionId    String
  session      TableSession @relation(fields: [sessionId], references: [id])
  
  restaurantId String
  restaurant   Restaurant  @relation(fields: [restaurantId], references: [id])
  
  // Itens do pedido
  items        OrderItem[]
  
  // Histórico de alterações
  logs         OrderLog[]
  
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  @@index([restaurantId, createdAt])
  @@index([tableId])
  @@index([status])
}

enum OrderStatus {
  PENDING      // Aguardando confirmação
  CONFIRMED    // Confirmado pela cozinha
  PREPARING    // Em preparo
  READY        // Pronto para servir
  DELIVERED    // Entregue na mesa
  CANCELLED    // Cancelado
}

model OrderItem {
  id          String   @id @default(uuid())
  
  name        String   // Snapshot do nome (caso mude no menu)
  price       Decimal  @db.Decimal(10, 2)
  quantity    Int
  
  notes       String?  // "Sem cebola", "Bem passado"
  
  // Extras selecionados
  extras      Json     @default("[]")  // [{name, price}]
  
  // Status individual do item
  status      OrderItemStatus @default(PENDING)
  
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  menuItemId  String?  // Referência ao item original (pode ser null se deletado)
  
  createdAt   DateTime @default(now())
  
  @@index([orderId])
}

enum OrderItemStatus {
  PENDING
  PREPARING
  READY
  DELIVERED
  CANCELLED
}

model OrderLog {
  id        String   @id @default(uuid())
  action    String   // "STATUS_CHANGED", "ITEM_ADDED", "ITEM_CANCELLED"
  details   Json     // Detalhes da ação
  
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  userId    String?  // Quem fez a ação (staff)
  user      User?    @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@index([orderId])
}

// ============================================================================
// CONTA / FECHAMENTO
// ============================================================================

model Bill {
  id           String      @id @default(uuid())
  billNumber   Int         // Número da conta
  
  // Totais
  subtotal     Decimal     @db.Decimal(10, 2)
  serviceCharge Decimal    @default(0) @db.Decimal(10, 2) // Taxa de serviço
  discount     Decimal     @default(0) @db.Decimal(10, 2)
  total        Decimal     @db.Decimal(10, 2)
  
  status       BillStatus  @default(OPEN)
  
  // Pagamento
  paymentMethod String?    // "CASH", "CREDIT", "DEBIT", "PIX"
  paidAt       DateTime?
  
  // Relacionamentos
  tableId      String
  restaurantId String
  
  // IDs das sessões que participaram
  sessionIds   String[]    // Array de UUIDs
  
  // IDs dos pedidos incluídos
  orderIds     String[]    // Array de UUIDs
  
  createdAt    DateTime    @default(now())
  closedAt     DateTime?
  
  @@index([restaurantId, createdAt])
  @@index([tableId])
}

enum BillStatus {
  OPEN         // Conta aberta
  REQUESTED    // Cliente pediu a conta
  PROCESSING   // Caixa processando
  PAID         // Paga
  CANCELLED    // Cancelada
}
```

---

## 🖥️ Estrutura de Pastas do Projeto

```
qrmenu-saas/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── README.md
├── DEPLOY.md
│
├── backend/                          # NestJS API
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   │
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       │
│       ├── common/
│       │   ├── decorators/
│       │   │   ├── public.decorator.ts
│       │   │   ├── roles.decorator.ts
│       │   │   ├── current-user.decorator.ts
│       │   │   └── current-restaurant.decorator.ts
│       │   ├── guards/
│       │   │   ├── jwt-auth.guard.ts
│       │   │   ├── roles.guard.ts
│       │   │   └── restaurant.guard.ts      # Valida tenant
│       │   ├── interceptors/
│       │   │   └── tenant.interceptor.ts    # Injeta restaurantId
│       │   ├── filters/
│       │   │   └── http-exception.filter.ts
│       │   └── pipes/
│       │       └── validation.pipe.ts
│       │
│       ├── config/
│       │   ├── configuration.ts
│       │   └── validation.schema.ts
│       │
│       ├── prisma/
│       │   ├── prisma.module.ts
│       │   └── prisma.service.ts
│       │
│       ├── redis/
│       │   ├── redis.module.ts
│       │   └── redis.service.ts
│       │
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── dto/
│       │   │   ├── login.dto.ts
│       │   │   ├── register.dto.ts
│       │   │   └── refresh-token.dto.ts
│       │   └── strategies/
│       │       └── jwt.strategy.ts
│       │
│       ├── restaurants/
│       │   ├── restaurants.module.ts
│       │   ├── restaurants.controller.ts
│       │   ├── restaurants.service.ts
│       │   └── dto/
│       │
│       ├── users/
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   └── dto/
│       │
│       ├── tables/
│       │   ├── tables.module.ts
│       │   ├── tables.controller.ts
│       │   ├── tables.service.ts
│       │   ├── qrcode.service.ts            # Geração de QR codes
│       │   └── dto/
│       │
│       ├── sessions/
│       │   ├── sessions.module.ts
│       │   ├── sessions.controller.ts       # Cliente se identifica
│       │   ├── sessions.service.ts
│       │   ├── verification.service.ts      # Envia códigos WhatsApp/SMS
│       │   ├── fingerprint.service.ts       # Valida dispositivo
│       │   └── dto/
│       │
│       ├── menu/
│       │   ├── menu.module.ts
│       │   ├── menu.controller.ts
│       │   ├── menu.service.ts
│       │   ├── categories.controller.ts
│       │   └── dto/
│       │
│       ├── orders/
│       │   ├── orders.module.ts
│       │   ├── orders.controller.ts
│       │   ├── orders.service.ts
│       │   └── dto/
│       │
│       ├── bills/
│       │   ├── bills.module.ts
│       │   ├── bills.controller.ts
│       │   ├── bills.service.ts
│       │   └── dto/
│       │
│       ├── websocket/
│       │   ├── websocket.module.ts
│       │   ├── websocket.gateway.ts         # Gateway principal
│       │   ├── events/
│       │   │   ├── order.events.ts
│       │   │   ├── table.events.ts
│       │   │   └── kitchen.events.ts
│       │   └── dto/
│       │
│       └── integrations/
│           ├── whatsapp/
│           │   ├── whatsapp.module.ts
│           │   └── whatsapp.service.ts      # WhatsApp Business API
│           ├── twilio/
│           │   ├── twilio.module.ts
│           │   └── twilio.service.ts        # SMS fallback
│           └── storage/
│               ├── storage.module.ts
│               └── storage.service.ts       # S3/Cloudinary
│
├── web/                                     # Landing page + Cliente
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   └── images/
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       │
│       ├── components/
│       │   ├── ui/                          # Componentes base
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Badge.tsx
│       │   │   └── index.ts
│       │   │
│       │   ├── layout/
│       │   │   ├── Header.tsx
│       │   │   ├── Footer.tsx
│       │   │   └── Layout.tsx
│       │   │
│       │   ├── menu/                        # Cardápio
│       │   │   ├── MenuCategory.tsx
│       │   │   ├── MenuItem.tsx
│       │   │   ├── MenuItemModal.tsx
│       │   │   ├── MenuSearch.tsx
│       │   │   └── FeaturedCarousel.tsx
│       │   │
│       │   ├── cart/                        # Carrinho
│       │   │   ├── Cart.tsx
│       │   │   ├── CartItem.tsx
│       │   │   ├── CartSummary.tsx
│       │   │   └── CartDrawer.tsx
│       │   │
│       │   ├── order/                       # Pedidos
│       │   │   ├── OrderStatus.tsx
│       │   │   ├── OrderHistory.tsx
│       │   │   ├── OrderConfirmation.tsx
│       │   │   └── OrderTracking.tsx
│       │   │
│       │   └── verification/                # Verificação
│       │       ├── PhoneInput.tsx
│       │       ├── CodeInput.tsx
│       │       └── VerificationModal.tsx
│       │
│       ├── pages/
│       │   ├── landing/                     # Landing page
│       │   │   ├── HomePage.tsx
│       │   │   ├── PricingPage.tsx
│       │   │   ├── FeaturesPage.tsx
│       │   │   └── RegisterPage.tsx
│       │   │
│       │   └── customer/                    # Área do cliente
│       │       ├── TablePage.tsx            # Página principal após QR
│       │       ├── MenuPage.tsx
│       │       ├── CartPage.tsx
│       │       ├── OrdersPage.tsx
│       │       └── BillPage.tsx
│       │
│       ├── hooks/
│       │   ├── useCart.ts
│       │   ├── useMenu.ts
│       │   ├── useOrder.ts
│       │   ├── useSession.ts
│       │   ├── useWebSocket.ts
│       │   └── useVerification.ts
│       │
│       ├── stores/
│       │   ├── cartStore.ts                 # Zustand
│       │   ├── sessionStore.ts
│       │   └── orderStore.ts
│       │
│       ├── services/
│       │   ├── api.ts                       # Axios instance
│       │   ├── websocket.ts                 # Socket.io client
│       │   └── fingerprint.ts               # Device fingerprint
│       │
│       ├── types/
│       │   └── index.ts
│       │
│       └── utils/
│           ├── formatters.ts
│           ├── validators.ts
│           └── cn.ts
│
├── admin/                                   # Painel Administrativo
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       │
│       ├── components/
│       │   ├── ui/                          # Reutiliza do web ou próprios
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Header.tsx
│       │   │   └── Layout.tsx
│       │   │
│       │   ├── orders/
│       │   │   ├── OrderCard.tsx
│       │   │   ├── OrderList.tsx
│       │   │   ├── OrderDetails.tsx
│       │   │   └── KitchenDisplay.tsx       # Display para cozinha
│       │   │
│       │   ├── tables/
│       │   │   ├── TableCard.tsx
│       │   │   ├── TableGrid.tsx
│       │   │   ├── TableDetails.tsx
│       │   │   └── QRCodeModal.tsx
│       │   │
│       │   └── reports/
│       │       ├── SalesChart.tsx
│       │       ├── OrdersChart.tsx
│       │       └── ReportCard.tsx
│       │
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   │
│       │   ├── dashboard/
│       │   │   └── DashboardPage.tsx
│       │   │
│       │   ├── kitchen/                     # Visão da cozinha
│       │   │   └── KitchenPage.tsx
│       │   │
│       │   ├── cashier/                     # Visão do caixa
│       │   │   ├── CashierPage.tsx
│       │   │   └── BillsPage.tsx
│       │   │
│       │   ├── waiter/                      # Visão do garçom
│       │   │   └── WaiterPage.tsx
│       │   │
│       │   ├── tables/
│       │   │   └── TablesPage.tsx
│       │   │
│       │   ├── menu/
│       │   │   ├── MenuPage.tsx
│       │   │   └── CategoriesPage.tsx
│       │   │
│       │   ├── users/
│       │   │   └── UsersPage.tsx
│       │   │
│       │   ├── settings/
│       │   │   └── SettingsPage.tsx
│       │   │
│       │   └── reports/
│       │       └── ReportsPage.tsx
│       │
│       ├── hooks/
│       │   ├── useOrders.ts
│       │   ├── useTables.ts
│       │   ├── useWebSocket.ts
│       │   └── useNotifications.ts
│       │
│       ├── stores/
│       │   ├── authStore.ts
│       │   ├── ordersStore.ts
│       │   └── tablesStore.ts
│       │
│       ├── services/
│       │   ├── api.ts
│       │   └── websocket.ts
│       │
│       └── types/
│           └── index.ts
│
└── shared/                                  # Código compartilhado (opcional)
    ├── types/
    │   └── index.ts
    └── utils/
        └── index.ts
```

---

## 🐳 Docker Compose

### Desenvolvimento

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ============================================
  # DATABASE
  # ============================================
  postgres:
    image: postgres:15-alpine
    container_name: qrmenu-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-qrmenu}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-qrmenu123}
      POSTGRES_DB: ${DB_NAME:-qrmenu}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-qrmenu}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # REDIS (Cache + Sessions + Pub/Sub)
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: qrmenu-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # BACKEND (NestJS)
  # ============================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: qrmenu-backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://${DB_USER:-qrmenu}:${DB_PASSWORD:-qrmenu123}@postgres:5432/${DB_NAME:-qrmenu}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      WHATSAPP_API_TOKEN: ${WHATSAPP_API_TOKEN}
      TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID}
      TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN}
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run start:dev

  # ============================================
  # WEB (Landing + Cliente)
  # ============================================
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    container_name: qrmenu-web
    restart: unless-stopped
    environment:
      VITE_API_URL: http://localhost:3000/api
      VITE_WS_URL: ws://localhost:3000
    ports:
      - "5173:5173"
    volumes:
      - ./web:/app
      - /app/node_modules
    command: npm run dev -- --host

  # ============================================
  # ADMIN (Painel Administrativo)
  # ============================================
  admin:
    build:
      context: ./admin
      dockerfile: Dockerfile
    container_name: qrmenu-admin
    restart: unless-stopped
    environment:
      VITE_API_URL: http://localhost:3000/api
      VITE_WS_URL: ws://localhost:3000
    ports:
      - "5174:5174"
    volumes:
      - ./admin:/app
      - /app/node_modules
    command: npm run dev -- --host --port 5174

volumes:
  postgres_data:
  redis_data:
```

### Produção

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: qrmenu-postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - qrmenu-network
    # Não expõe porta externamente

  redis:
    image: redis:7-alpine
    container_name: qrmenu-redis
    restart: always
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    networks:
      - qrmenu-network

  backend:
    image: qrmenu/backend:${VERSION:-latest}
    container_name: qrmenu-backend
    restart: always
    depends_on:
      - postgres
      - redis
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      CORS_ORIGINS: ${CORS_ORIGINS}
    networks:
      - qrmenu-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.qrmenu.com.br`)"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=3000"

  web:
    image: qrmenu/web:${VERSION:-latest}
    container_name: qrmenu-web
    restart: always
    networks:
      - qrmenu-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`qrmenu.com.br`) || Host(`www.qrmenu.com.br`)"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"

  admin:
    image: qrmenu/admin:${VERSION:-latest}
    container_name: qrmenu-admin
    restart: always
    networks:
      - qrmenu-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.admin.rule=Host(`admin.qrmenu.com.br`)"
      - "traefik.http.routers.admin.tls.certresolver=letsencrypt"

  traefik:
    image: traefik:v2.10
    container_name: qrmenu-traefik
    restart: always
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt_data:/letsencrypt
    networks:
      - qrmenu-network

networks:
  qrmenu-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  letsencrypt_data:
```

---

## 📱 WebSocket Events

### Eventos do Cliente → Servidor

```typescript
// Cliente entra na mesa
socket.emit('table:join', { 
  tableId: string, 
  sessionId: string 
});

// Cliente sai da mesa
socket.emit('table:leave', { 
  tableId: string 
});

// Novo pedido
socket.emit('order:create', {
  tableId: string,
  sessionId: string,
  items: OrderItem[]
});

// Chama garçom
socket.emit('waiter:call', {
  tableId: string,
  reason: 'ASSISTANCE' | 'BILL' | 'OTHER'
});

// Pede a conta
socket.emit('bill:request', {
  tableId: string
});
```

### Eventos do Servidor → Cliente

```typescript
// Status do pedido atualizado
socket.on('order:status', {
  orderId: string,
  status: OrderStatus,
  updatedAt: Date
});

// Novo pedido (para cozinha/caixa)
socket.on('order:new', {
  order: Order
});

// Mesa chamou garçom
socket.on('waiter:called', {
  tableId: string,
  tableNumber: number,
  reason: string
});

// Conta pronta
socket.on('bill:ready', {
  billId: string,
  total: number
});
```

---

## 🔧 Tecnologias e Dependências

### Backend (NestJS)

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/throttler": "^5.0.0",
    "@nestjs/bull": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.0",
    "bcrypt": "^5.1.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "ioredis": "^5.0.0",
    "qrcode": "^1.5.0",
    "twilio": "^4.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "prisma": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Frontend (React + Vite)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.0.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.0.0",
    "framer-motion": "^10.0.0",
    "lucide-react": "^0.300.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "@fingerprintjs/fingerprintjs": "^4.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "@hookform/resolvers": "^3.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```

---

## 📋 Fases de Implementação

### Fase 1: Fundação (2-3 semanas)

- [ ] Setup do projeto (monorepo ou repos separados)
- [ ] Docker Compose para desenvolvimento
- [ ] Configuração do Prisma + migrations
- [ ] Módulo de autenticação (JWT + roles)
- [ ] CRUD de restaurantes (multi-tenant)
- [ ] CRUD de usuários por restaurante
- [ ] Seed inicial com dados de teste

### Fase 2: Core do Cardápio (2 semanas)

- [ ] CRUD de categorias
- [ ] CRUD de itens do cardápio
- [ ] Upload de imagens (S3/Cloudinary)
- [ ] API pública do cardápio (por slug do restaurante)
- [ ] Frontend: Visualização do cardápio
- [ ] Frontend: Carrinho de compras (Zustand)

### Fase 3: Mesas e Sessões (2 semanas)

- [ ] CRUD de mesas
- [ ] Geração de QR codes únicos
- [ ] Serviço de verificação (WhatsApp/SMS)
- [ ] Criação e validação de sessões
- [ ] Device fingerprinting
- [ ] Frontend: Fluxo de verificação

### Fase 4: Pedidos em Tempo Real (2-3 semanas)

- [ ] WebSocket Gateway
- [ ] Criação de pedidos
- [ ] Atualização de status
- [ ] Notificações em tempo real
- [ ] Frontend: Tela da cozinha (Kitchen Display)
- [ ] Frontend: Acompanhamento de pedido (cliente)

### Fase 5: Fechamento e Conta (1-2 semanas)

- [ ] Sistema de conta/bill
- [ ] Agrupamento de pedidos por mesa
- [ ] Solicitação de conta
- [ ] Tela do caixa
- [ ] Fechamento de mesa

### Fase 6: Admin e Relatórios (2 semanas)

- [ ] Dashboard com métricas
- [ ] Relatórios de vendas
- [ ] Histórico de pedidos
- [ ] Exportação de dados
- [ ] Configurações do restaurante

### Fase 7: Landing Page e Onboarding (1 semana)

- [ ] Landing page marketing
- [ ] Página de preços
- [ ] Cadastro de novos restaurantes
- [ ] Wizard de configuração inicial

### Fase 8: Polimento e Deploy (1-2 semanas)

- [ ] Testes end-to-end
- [ ] Otimização de performance
- [ ] Docker Compose produção
- [ ] CI/CD pipeline
- [ ] Documentação final

---

## 🎨 Design System Sugerido

### Cores Principais

```css
:root {
  /* Primárias - Âmbar/Dourado (remetendo a restaurante) */
  --primary-50: #fffbeb;
  --primary-100: #fef3c7;
  --primary-200: #fde68a;
  --primary-300: #fcd34d;
  --primary-400: #fbbf24;
  --primary-500: #f59e0b;
  --primary-600: #d97706;
  --primary-700: #b45309;
  --primary-800: #92400e;
  --primary-900: #78350f;
  
  /* Secundárias - Verde (confirmação, sucesso) */
  --success-500: #22c55e;
  --success-600: #16a34a;
  
  /* Alerta */
  --warning-500: #eab308;
  
  /* Erro */
  --error-500: #ef4444;
  
  /* Neutros */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-500: #6b7280;
  --gray-900: #111827;
}
```

### Tipografia

```css
/* Títulos */
font-family: 'Plus Jakarta Sans', sans-serif;

/* Corpo */
font-family: 'Inter', sans-serif;
```

---

## 🚀 Comandos Úteis

```bash
# Iniciar desenvolvimento
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Rodar migrations
docker-compose exec backend npx prisma migrate dev

# Seed do banco
docker-compose exec backend npx prisma db seed

# Build para produção
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ Checklist de Segurança

- [ ] Rate limiting em todas as rotas
- [ ] Validação de input com class-validator
- [ ] Sanitização de dados
- [ ] CORS configurado corretamente
- [ ] HTTPS obrigatório em produção
- [ ] JWT com refresh tokens
- [ ] Verificação de telefone obrigatória
- [ ] Device fingerprinting
- [ ] Logs de auditoria
- [ ] Geofencing (opcional)
- [ ] Sessão expira quando mesa fecha
- [ ] Multi-tenant isolation (cada restaurante só vê seus dados)

---

## 📞 Integração WhatsApp Business API

### Opções de Integração

1. **WhatsApp Business API (Meta)** - Oficial, mais confiável
2. **Twilio** - Mais fácil de integrar, suporta WhatsApp e SMS
3. **MessageBird** - Alternativa europeia
4. **Zenvia** - Brasileiro, bom suporte local

### Exemplo com Twilio

```typescript
// backend/src/integrations/twilio/twilio.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  private client: Twilio;
  private whatsappNumber: string;

  constructor(private configService: ConfigService) {
    this.client = new Twilio(
      this.configService.get('TWILIO_ACCOUNT_SID'),
      this.configService.get('TWILIO_AUTH_TOKEN'),
    );
    this.whatsappNumber = this.configService.get('TWILIO_WHATSAPP_NUMBER');
  }

  async sendVerificationCode(phone: string, code: string): Promise<void> {
    const message = `🍽️ Seu código de verificação é: *${code}*\n\nEsse código expira em 5 minutos.`;

    await this.client.messages.create({
      body: message,
      from: `whatsapp:${this.whatsappNumber}`,
      to: `whatsapp:+55${phone}`,
    });
  }

  async sendOrderConfirmation(phone: string, orderNumber: number): Promise<void> {
    const message = `✅ Pedido #${orderNumber} recebido!\n\nAcompanhe o status pelo seu celular.`;

    await this.client.messages.create({
      body: message,
      from: `whatsapp:${this.whatsappNumber}`,
      to: `whatsapp:+55${phone}`,
    });
  }
}
```

---

## 📝 Observações Finais

Este projeto reutiliza os seguintes padrões do projeto **Casa do Porco**:

1. **Arquitetura Backend**: NestJS + Prisma + PostgreSQL
2. **Autenticação**: JWT com guards e decorators
3. **Frontend**: React + Vite + TypeScript + TailwindCSS
4. **Estado Global**: Zustand
5. **Estilização**: TailwindCSS + Framer Motion
6. **Containerização**: Docker + Docker Compose

As principais **adições** para este projeto:

1. **Multi-tenancy**: Isolamento por restaurante
2. **WebSockets**: Comunicação em tempo real
3. **Redis**: Cache e sessões
4. **Verificação por WhatsApp/SMS**: Segurança
5. **Device Fingerprinting**: Validação de dispositivo
6. **QR Code Generation**: Mesas individuais
7. **Telas especializadas**: Cozinha, Caixa, Garçom

---

**Próximos Passos:**

1. Criar novo repositório para o projeto
2. Configurar monorepo (ou repos separados)
3. Iniciar pela Fase 1: Fundação
4. Seguir o plano de implementação

---

*Documento gerado em: Janeiro 2026*
*Versão: 1.0*

