import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { VerificationService } from './verification.service';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, VerificationService],
  exports: [SessionsService, VerificationService],
})
export class SessionsModule {}
