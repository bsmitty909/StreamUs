import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateStreamDto {
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;
}
