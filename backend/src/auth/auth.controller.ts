import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CryptoService } from './crypto.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { Public } from '../common/decorators';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cryptoService: CryptoService,
  ) {}

  @Public()
  @Get('public-key')
  @ApiOperation({ summary: 'Obter chave pública para criptografar senhas' })
  @ApiResponse({ status: 200, description: 'Chave pública RSA' })
  getPublicKey() {
    return {
      publicKey: this.cryptoService.getPublicKeyForWebCrypto(),
      algorithm: 'RSA-OAEP',
      hash: 'SHA-256',
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar novo restaurante e admin' })
  @ApiResponse({
    status: 201,
    description: 'Restaurante e usuário criados com sucesso',
  })
  @ApiResponse({ status: 409, description: 'Email ou slug já existe' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login com email e senha' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiResponse({ status: 200, description: 'Tokens renovados com sucesso' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout (invalidar refresh token)' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do usuário logado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async me(@CurrentUser() user: CurrentUserData) {
    return this.authService.validateUser(user.id);
  }
}

