#!/usr/bin/env node

/**
 * Script para configurar os arquivos .env do projeto QRMenu
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const webDir = path.join(rootDir, 'web');
const adminDir = path.join(rootDir, 'admin');

// Conteúdo do .env para o backend
const backendEnv = `# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://qrmenu:qrmenu123@localhost:5432/qrmenu

# ============================================
# REDIS
# ============================================
REDIS_URL=redis://localhost:6379

# ============================================
# JWT
# ============================================
JWT_SECRET=qrmenu-dev-secret-change-in-production-123456
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# FRONTEND URLs
# ============================================
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
`;

// Conteúdo do .env para o web
const webEnv = `VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000/ws
`;

// Conteúdo do .env para o admin
const adminEnv = `VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000/ws
`;

function createEnvFile(dir, content, name = '.env') {
  const filePath = path.join(dir, name);
  
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  ${name} já existe em ${dir}, pulando...`);
    return;
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Criado ${name} em ${dir}`);
}

console.log('🔧 Configurando arquivos .env do QRMenu...\n');

createEnvFile(backendDir, backendEnv);
createEnvFile(webDir, webEnv);
createEnvFile(adminDir, adminEnv);

console.log('\n✨ Configuração concluída!');
console.log('\nPróximos passos:');
console.log('  1. npm run dev:infra     # Iniciar PostgreSQL e Redis');
console.log('  2. npm run db:migrate    # Executar migrações');
console.log('  3. npm run db:seed       # Popular banco com dados de teste');
console.log('  4. npm run dev:services  # Iniciar backend, web e admin');

