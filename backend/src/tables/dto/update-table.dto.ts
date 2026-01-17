import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { TableStatus } from '@prisma/client';

export class UpdateTableDto {
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

  @ApiProperty({ enum: TableStatus, required: false })
  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;
}

