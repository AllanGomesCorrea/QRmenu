import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase is not allowed in production');
    }

    // Delete in order respecting foreign keys
    await this.$transaction([
      this.orderLog.deleteMany(),
      this.orderItem.deleteMany(),
      this.order.deleteMany(),
      this.bill.deleteMany(),
      this.verificationCode.deleteMany(),
      this.tableSession.deleteMany(),
      this.menuItemExtra.deleteMany(),
      this.menuItem.deleteMany(),
      this.menuCategory.deleteMany(),
      this.table.deleteMany(),
      this.refreshToken.deleteMany(),
      this.user.deleteMany(),
      this.restaurant.deleteMany(),
    ]);
  }
}

