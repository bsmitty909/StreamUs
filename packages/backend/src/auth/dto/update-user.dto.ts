import { IsString, IsOptional, MinLength, MaxLength, Matches, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and hyphens',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Display name cannot be empty' })
  @MaxLength(50, { message: 'Display name must not exceed 50 characters' })
  displayName?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string;
}
