import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuItemExtraDto {
  @ApiProperty({ example: 'Bacon extra' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 5.00 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Filé Mignon ao Molho Madeira' })
  @IsString()
  @IsNotEmpty({ message: 'Nome do item é obrigatório' })
  name: string;

  @ApiProperty({ example: 'Filé grelhado com molho madeira, arroz e batatas', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 89.90 })
  @IsNumber()
  @Min(0, { message: 'Preço deve ser maior ou igual a zero' })
  price: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isVegan?: boolean;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isVegetarian?: boolean;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isGlutenFree?: boolean;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isSpicy?: boolean;

  @ApiProperty({ example: 25, required: false })
  @IsNumber()
  @IsOptional()
  prepTime?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ description: 'ID da categoria' })
  @IsUUID()
  @IsNotEmpty({ message: 'Categoria é obrigatória' })
  categoryId: string;

  @ApiProperty({ type: [CreateMenuItemExtraDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuItemExtraDto)
  @IsOptional()
  extras?: CreateMenuItemExtraDto[];
}

