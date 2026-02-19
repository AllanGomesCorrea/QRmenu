import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, VerifyCodeDto, RequestCodeDto } from './dto';
import { Public } from '../common/decorators';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Public()
  @Get('table/:qrCode/status')
  @ApiOperation({ summary: 'Verificar status da mesa' })
  @ApiResponse({ status: 200, description: 'Status da mesa' })
  @ApiResponse({ status: 404, description: 'Mesa não encontrada' })
  async checkTableStatus(@Param('qrCode') qrCode: string) {
    return this.sessionsService.checkTableStatus(qrCode);
  }

  @Public()
  @Get('table/:qrCode/check')
  @ApiOperation({ summary: 'Verificar se dispositivo já tem sessão ativa' })
  @ApiResponse({ status: 200, description: 'Status da sessão existente' })
  async checkExistingSession(
    @Param('qrCode') qrCode: string,
    @Query('fingerprint') fingerprint: string,
  ) {
    return this.sessionsService.checkExistingSession(qrCode, fingerprint);
  }

  @Public()
  @Post('request-code')
  @ApiOperation({ summary: 'Solicitar código de verificação' })
  @ApiResponse({ status: 200, description: 'Código enviado' })
  @ApiResponse({ status: 400, description: 'Mesa não disponível' })
  async requestCode(@Body() dto: RequestCodeDto) {
    return this.sessionsService.requestVerificationCode(dto);
  }

  @Public()
  @Post('create')
  @ApiOperation({ summary: 'Criar sessão (antes da verificação)' })
  @ApiResponse({ status: 201, description: 'Sessão criada' })
  async createSession(
    @Body() dto: CreateSessionDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    return this.sessionsService.createSession(dto, ipAddress);
  }

  @Public()
  @Post('verify')
  @ApiOperation({ summary: 'Verificar código e ativar sessão' })
  @ApiResponse({ status: 200, description: 'Sessão verificada' })
  @ApiResponse({ status: 400, description: 'Código inválido' })
  async verifyCode(
    @Body() dto: VerifyCodeDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    return this.sessionsService.verifyAndActivate(dto, ipAddress);
  }

  @Public()
  @Get(':sessionId')
  @ApiHeader({ name: 'x-session-token', required: true })
  @ApiOperation({ summary: 'Obter dados da sessão' })
  @ApiResponse({ status: 200, description: 'Dados da sessão' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async getSession(
    @Param('sessionId') sessionId: string,
    @Headers('x-session-token') sessionToken: string,
  ) {
    // Validate token
    const tokenData = await this.sessionsService.validateSessionToken(sessionToken);
    if (!tokenData || tokenData.sessionId !== sessionId) {
      return { error: 'Token inválido ou expirado' };
    }

    return this.sessionsService.getSession(sessionId);
  }

  @Public()
  @Post(':sessionId/end')
  @ApiHeader({ name: 'x-session-token', required: true })
  @ApiOperation({ summary: 'Encerrar sessão' })
  @ApiResponse({ status: 200, description: 'Sessão encerrada' })
  async endSession(
    @Param('sessionId') sessionId: string,
    @Headers('x-session-token') sessionToken: string,
  ) {
    // Validate token
    const tokenData = await this.sessionsService.validateSessionToken(sessionToken);
    if (!tokenData || tokenData.sessionId !== sessionId) {
      return { error: 'Token inválido ou expirado' };
    }

    return this.sessionsService.endSession(sessionId);
  }
}

