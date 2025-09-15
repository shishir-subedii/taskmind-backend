import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000'
  })

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,      // Strip unknown props
      forbidNonWhitelisted: true,
      transform: true,      // auto-transform to DTO types
    }),
  );

  // Global Interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global Error Handler
  app.useGlobalFilters(new GlobalExceptionFilter());
  const config = new DocumentBuilder()
    .setTitle('Docs for XYZ application')
    .setDescription('API documentation for XYZ application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory);
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
