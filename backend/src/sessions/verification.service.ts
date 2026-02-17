import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface VerificationRequest {
  phone: string;
  tableId: string;
  restaurantId: string;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly codeLength = 6;
  private readonly codeTTL: number;
  private readonly maxAttempts: number;
  private readonly cooldown: number;
  private readonly useMock: boolean;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private configService: ConfigService,
  ) {
    this.codeTTL = this.configService.get<number>('security.verificationCodeTTL', 300);
    this.maxAttempts = this.configService.get<number>('security.maxVerificationAttempts', 3);
    this.cooldown = this.configService.get<number>('security.cooldownBetweenCodes', 60);
    
    // Use mock if no SMS/WhatsApp provider configured
    const whatsappEnabled = this.configService.get<boolean>('whatsapp.enabled', false);
    const twilioEnabled = this.configService.get<boolean>('twilio.enabled', false);
    this.useMock = !whatsappEnabled && !twilioEnabled;

    if (this.useMock) {
      this.logger.warn('⚠️ Verification service running in MOCK mode');
    }
  }

  /**
   * Generate a random 6-digit verification code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send verification code to phone
   */
  async sendVerificationCode(request: VerificationRequest): Promise<{ message: string; expiresIn: number }> {
    const { phone, tableId, restaurantId } = request;
    const cleanPhone = phone.replace(/\D/g, '');

    // Check cooldown
    const cooldownKey = `verification:cooldown:${cleanPhone}`;
    const inCooldown = await this.redis.exists(cooldownKey);

    if (inCooldown) {
      const ttl = await this.redis.ttl(cooldownKey);
      throw new BadRequestException(
        `Aguarde ${ttl} segundos para solicitar um novo código`,
      );
    }

    // Generate code
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.codeTTL * 1000);

    // Store in database for audit
    await this.prisma.verificationCode.create({
      data: {
        phone: cleanPhone,
        code,
        tableId,
        restaurantId,
        expiresAt,
      },
    });

    // Store in Redis for quick lookup
    const redisKey = `verification:${cleanPhone}:${tableId}`;
    await this.redis.setJson(redisKey, {
      code,
      attempts: 0,
      tableId,
      restaurantId,
    }, this.codeTTL);

    // Set cooldown
    await this.redis.set(cooldownKey, '1', this.cooldown);

    // Send code via provider or mock
    if (this.useMock) {
      // In mock mode, log the code to console
      this.logger.log(`📱 [MOCK] Código de verificação para ${cleanPhone}: ${code}`);
      console.log('\n========================================');
      console.log(`📱 CÓDIGO DE VERIFICAÇÃO (MOCK)`);
      console.log(`   Telefone: ${cleanPhone}`);
      console.log(`   Código: ${code}`);
      console.log(`   Expira em: ${this.codeTTL} segundos`);
      console.log('========================================\n');
    } else {
      // TODO: Implement real SMS/WhatsApp sending
      await this.sendViaSMS(cleanPhone, code);
    }

    return {
      message: 'Código de verificação enviado',
      expiresIn: this.codeTTL,
    };
  }

  /**
   * Verify the code entered by customer
   */
  async verifyCode(
    phone: string,
    code: string,
    tableId: string,
  ): Promise<{ valid: boolean; message: string }> {
    const cleanPhone = phone.replace(/\D/g, '');
    const redisKey = `verification:${cleanPhone}:${tableId}`;

    // Get stored verification data
    const stored = await this.redis.getJson<{
      code: string;
      attempts: number;
      tableId: string;
      restaurantId: string;
    }>(redisKey);

    if (!stored) {
      throw new BadRequestException('Código expirado ou inválido. Solicite um novo código.');
    }

    // Check attempts
    if (stored.attempts >= this.maxAttempts) {
      await this.redis.del(redisKey);
      throw new BadRequestException('Número máximo de tentativas excedido. Solicite um novo código.');
    }

    // Verify code
    if (stored.code !== code) {
      // Increment attempts
      await this.redis.setJson(redisKey, {
        ...stored,
        attempts: stored.attempts + 1,
      }, await this.redis.ttl(redisKey));

      const remaining = this.maxAttempts - stored.attempts - 1;
      throw new BadRequestException(
        `Código inválido. ${remaining} tentativa(s) restante(s).`,
      );
    }

    // Mark code as used in database
    await this.prisma.verificationCode.updateMany({
      where: {
        phone: cleanPhone,
        code,
        tableId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Delete from Redis
    await this.redis.del(redisKey);

    return {
      valid: true,
      message: 'Código verificado com sucesso',
    };
  }

  /**
   * Send SMS (stub - implement with Twilio or similar)
   */
  private async sendViaSMS(phone: string, code: string): Promise<void> {
    // TODO: Implement with Twilio
    // const twilioClient = new Twilio(accountSid, authToken);
    // await twilioClient.messages.create({
    //   body: `🍽️ Seu código de verificação é: ${code}. Válido por 5 minutos.`,
    //   from: this.configService.get('twilio.phoneNumber'),
    //   to: `+55${phone}`,
    // });
    this.logger.log(`Would send SMS to +55${phone} with code ${code}`);
  }

  /**
   * Clean up expired verification codes
   */
  async cleanupExpiredCodes(): Promise<number> {
    const result = await this.prisma.verificationCode.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        usedAt: null,
      },
    });

    return result.count;
  }
}

