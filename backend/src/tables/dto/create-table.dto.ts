import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateTableDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1, { message: 'Número da mesa deve ser maior que zero' })
  number: number;

  @ApiProperty({ example: 'Varanda 1', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 4, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiProperty({ example: 'Salão Principal', required: false })
  @IsString()
  @IsOptional()
  section?: string;
}

