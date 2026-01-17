import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { QRCodeService } from './qrcode.service';

@Module({
  controllers: [TablesController],
  providers: [TablesService, QRCodeService],
  exports: [TablesService, QRCodeService],
})
export class TablesModule {}
