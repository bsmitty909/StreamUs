import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandAsset } from '../database/entities/brand-asset.entity';

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
}

export interface BrandAssetSettings {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: number;
  scale?: number;
  padding?: { x: number; y: number };
}

@Injectable()
export class BrandAssetsService {
  constructor(
    @InjectRepository(BrandAsset)
    private brandAssetRepository: Repository<BrandAsset>,
  ) {}

  async create(
    userId: string,
    type: string,
    file: UploadedFile,
    settings?: BrandAssetSettings,
  ): Promise<BrandAsset> {
    const brandAsset = this.brandAssetRepository.create({
      userId,
      type,
      fileUrl: file.path,
      fileName: file.originalName,
      settings: settings || {
        position: 'top-left',
        opacity: 0.8,
        scale: 0.15,
        padding: { x: 20, y: 20 },
      },
    });

    return this.brandAssetRepository.save(brandAsset);
  }

  async findByUser(userId: string): Promise<BrandAsset[]> {
    return this.brandAssetRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<BrandAsset> {
    const brandAsset = await this.brandAssetRepository.findOne({
      where: { id, userId },
    });

    if (!brandAsset) {
      throw new NotFoundException('Brand asset not found');
    }

    return brandAsset;
  }

  async update(
    id: string,
    userId: string,
    settings: BrandAssetSettings,
  ): Promise<BrandAsset> {
    const brandAsset = await this.findOne(id, userId);

    brandAsset.settings = {
      ...brandAsset.settings,
      ...settings,
    };

    return this.brandAssetRepository.save(brandAsset);
  }

  async delete(id: string, userId: string): Promise<void> {
    const brandAsset = await this.findOne(id, userId);
    await this.brandAssetRepository.remove(brandAsset);
  }

  async getActiveLogoForStream(userId: string): Promise<BrandAsset | null> {
    const logos = await this.brandAssetRepository.find({
      where: { userId, type: 'logo' },
      order: { createdAt: 'DESC' },
      take: 1,
    });

    return logos[0] || null;
  }
}
