import { env } from './common/config/env.config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ErrorLoggingInterceptor } from './common/infrastructure/interceptors/error-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  if (env.get<boolean>('ENABLE_TRACE_LOGS', false)) {
    app.useGlobalInterceptors(new ErrorLoggingInterceptor());
  }

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Movie Management API')
    .setDescription('API documentation for the Movie Management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'api-json',
  });

  const port = env.get<number>('PORT') ?? 3000;
  await app.listen(port);
}
void bootstrap();
