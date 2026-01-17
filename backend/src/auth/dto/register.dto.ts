import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ example: 'joao@restaurante.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Senha deve conter letras maiúsculas, minúsculas e números',
  })
  password: string;

  @ApiProperty({ example: '11999999999', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  // Restaurant data for initial registration
  @ApiProperty({ example: 'Casa do Sabor' })
  @IsString()
  @IsNotEmpty({ message: 'Nome do restaurante é obrigatório' })
  restaurantName: string;

  @ApiProperty({ example: 'casa-do-sabor' })
  @IsString()
  @IsNotEmpty({ message: 'Slug do restaurante é obrigatório' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  restaurantSlug: string;

  @ApiProperty({ example: 'Rua das Flores, 123' })
  @IsString()
  @IsNotEmpty({ message: 'Endereço é obrigatório' })
  address: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  city: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @IsNotEmpty({ message: 'Estado é obrigatório' })
  state: string;

  @ApiProperty({ example: '01310-100' })
  @IsString()
  @IsNotEmpty({ message: 'CEP é obrigatório' })
  zipCode: string;

  @ApiProperty({ example: '1133334444' })
  @IsString()
  @IsNotEmpty({ message: 'Telefone do restaurante é obrigatório' })
  restaurantPhone: string;

  @ApiProperty({ example: 'contato@restaurante.com' })
  @IsEmail({}, { message: 'Email do restaurante inválido' })
  @IsNotEmpty({ message: 'Email do restaurante é obrigatório' })
  restaurantEmail: string;
}

