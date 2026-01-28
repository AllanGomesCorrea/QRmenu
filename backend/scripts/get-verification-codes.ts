/**
 * Script para ver os códigos de verificação pendentes no Redis
 * Uso: npx ts-node scripts/get-verification-codes.ts
 */

import Redis from 'ioredis';

async function getVerificationCodes() {
  const redis = new Redis();
  
  console.log('\n📱 Códigos de Verificação Pendentes:\n');
  console.log('─'.repeat(50));
  
  const keys = await redis.keys('verification:*');
  
  let found = false;
  for (const key of keys) {
    if (!key.includes('cooldown')) {
      const value = await redis.get(key);
      if (value) {
        const data = JSON.parse(value);
        const phone = key.split(':')[1];
        console.log(`📞 Telefone: ${phone}`);
        console.log(`🔑 Código:   ${data.code}`);
        console.log('─'.repeat(50));
        found = true;
      }
    }
  }
  
  if (!found) {
    console.log('Nenhum código pendente no momento.');
    console.log('─'.repeat(50));
  }
  
  console.log('\n💡 Dica: Este código expira em 5 minutos!\n');
  
  await redis.disconnect();
}

getVerificationCodes();
