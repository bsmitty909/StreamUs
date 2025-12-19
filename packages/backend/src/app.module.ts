import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LiveKitModule } from './livekit/livekit.module';
import { StreamsModule } from './streams/streams.module';
import { GuestsModule } from './guests/guests.module';
import { typeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UsersModule,
    LiveKitModule,
    StreamsModule,
    GuestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
