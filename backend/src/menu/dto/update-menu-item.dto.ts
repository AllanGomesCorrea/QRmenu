import { ApiProperty } from '@nestjs/swagger';
import {
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

export class UpdateMenuItemExtraDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'Bacon extra', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 5.00, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}

export class UpdateMenuItemDto {
  @ApiProperty({ example: 'Filé Mignon ao Molho Madeira', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 89.90, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isVegan?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isVegetarian?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isGlutenFree?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isSpicy?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  prepTime?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ type: [UpdateMenuItemExtraDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateMenuItemExtraDto)
  @IsOptional()
  extras?: UpdateMenuItemExtraDto[];
}

