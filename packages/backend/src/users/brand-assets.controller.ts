import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BrandAssetsService, type BrandAssetSettings } from './brand-assets.service';

@Controller('users/brand-assets')
@UseGuards(JwtAuthGuard)
export class BrandAssetsController {
  constructor(private brandAssetsService: BrandAssetsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/brand-assets',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|svg\+xml)$/)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadBrandAsset(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
    @Body('settings') settingsJson: string,
    @Request() req: any,
  ) {
    const settings: BrandAssetSettings = settingsJson ? JSON.parse(settingsJson) : undefined;

    return this.brandAssetsService.create(
      req.user.userId,
      type || 'logo',
      {
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/brand-assets/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
      },
      settings,
    );
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.brandAssetsService.findByUser(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.brandAssetsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() settings: BrandAssetSettings,
    @Request() req: any,
  ) {
    return this.brandAssetsService.update(id, req.user.userId, settings);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.brandAssetsService.delete(id, req.user.userId);
    return { message: 'Brand asset deleted successfully' };
  }
}
