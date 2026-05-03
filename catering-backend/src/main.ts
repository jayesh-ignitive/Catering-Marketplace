import './load-env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadPublicRoot = join(process.cwd(), 'storage', 'public');
  if (!existsSync(uploadPublicRoot)) {
    mkdirSync(uploadPublicRoot, { recursive: true });
  }
  app.useStaticAssets(uploadPublicRoot, { prefix: '/uploads/', index: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const fromEnv = process.env.CORS_ORIGIN?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const corsOrigins =
    fromEnv && fromEnv.length > 0
      ? fromEnv
      : [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3001',
        ];
  app.enableCors({ origin: corsOrigins, credentials: true });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
}
bootstrap();
