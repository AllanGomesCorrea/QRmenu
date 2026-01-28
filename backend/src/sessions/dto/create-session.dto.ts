import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  customerName: string;

  @ApiProperty({ example: '11999999999' })
  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  customerPhone: string;

  @ApiProperty({ description: 'QR Code da mesa' })
  @IsString()
  @IsNotEmpty({ message: 'QR Code é obrigatório' })
  qrCode: string;

  @ApiProperty({ description: 'Device fingerprint hash' })
  @IsString()
  @IsNotEmpty({ message: 'Fingerprint é obrigatório' })
  deviceFingerprint: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({ description: 'Latitude do cliente', required: false })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({ description: 'Longitude do cliente', required: false })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export class VerifyCodeDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  code: string;

  @ApiProperty({ example: '11999999999' })
  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  customerPhone: string;

  @ApiProperty({ description: 'QR Code da mesa' })
  @IsString()
  @IsNotEmpty({ message: 'QR Code é obrigatório' })
  qrCode: string;

  @ApiProperty({ description: 'Device fingerprint hash' })
  @IsString()
  @IsNotEmpty({ message: 'Fingerprint é obrigatório' })
  deviceFingerprint: string;
}

export class RequestCodeDto {
  @ApiProperty({ example: '11999999999' })
  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  customerPhone: string;

  @ApiProperty({ description: 'QR Code da mesa' })
  @IsString()
  @IsNotEmpty({ message: 'QR Code é obrigatório' })
  qrCode: string;
}

