import { Module, forwardRef } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { QRCodeService } from './qrcode.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [forwardRef(() => WebsocketModule)],
  controllers: [TablesController],
  providers: [TablesService, QRCodeService],
  exports: [TablesService, QRCodeService],
})
export class TablesModule {}
