import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { BrandAssetsController } from './brand-assets.controller';
import { BrandAssetsService } from './brand-assets.service';
import { User } from '../database/entities/user.entity';
import { BrandAsset } from '../database/entities/brand-asset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, BrandAsset])],
  controllers: [UsersController, BrandAssetsController],
  providers: [UsersService, BrandAssetsService],
  exports: [UsersService, BrandAssetsService],
})
export class UsersModule {}
