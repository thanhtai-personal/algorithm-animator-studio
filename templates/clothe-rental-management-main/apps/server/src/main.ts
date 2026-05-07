import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express, Request, Response } from 'express';
import { AppModule } from './app.module';
import { AppConfigService } from './common/config/app-config.service';
import { loadServerEnvFiles } from './common/config/env-loader';
import { GlobalHttpExceptionFilter } from './common/filters/global-http-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';

function toOriginSet(origins: string[]): Set<string> {
  return new Set(
    origins
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  );
}

function buildSwaggerUiHtml(options: {
  title: string;
  swaggerJsonPath: string;
}): string {
  const swaggerJsonUrl = `/${options.swaggerJsonPath}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${options.title}</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #fafafa;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: "${swaggerJsonUrl}",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "BaseLayout",
        deepLinking: true,
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "none",
        operationsSorter: "alpha",
        tagsSorter: "alpha"
      });
    };
  </script>
</body>
</html>`;
}

function setupSwagger(app: INestApplication, config: AppConfigService): void {
  if (!config.swaggerEnabled) {
    console.info('[swagger]', {
      enabled: false,
      reason: 'SWAGGER_ENABLED=false',
    });
    return;
  }

  const builder = new DocumentBuilder()
    .setTitle('KATA Center API')
    .setDescription('OpenAPI documentation for Nest source-of-truth backend')
    .setVersion(`v${config.apiVersion}`)
    .addServer(`/${config.apiPrefix}/v${config.apiVersion}`)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase access token',
      },
      'bearer',
    );

  const document = SwaggerModule.createDocument(app, builder.build());
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  const uiPath = `/${config.swaggerPath}`;
  const jsonPath = `/${config.swaggerJsonPath}`;

  expressApp.get(uiPath, (_request: Request, response: Response) => {
    response.type('text/html').send(
      buildSwaggerUiHtml({
        title: 'KATA Center API Docs',
        swaggerJsonPath: config.swaggerJsonPath,
      }),
    );
  });
  expressApp.get(`${uiPath}/`, (_request: Request, response: Response) => {
    response.redirect(uiPath);
  });
  expressApp.get(jsonPath, (_request: Request, response: Response) => {
    response.json(document);
  });

  console.info('[swagger]', {
    enabled: true,
    uiPath,
    jsonPath,
    mode: 'cdn-ui',
  });
}

async function bootstrap() {
  loadServerEnvFiles();

  const app = await NestFactory.create(AppModule, {
    cors: false,
    rawBody: true,
  });
  const config = app.get(AppConfigService);
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.disable('x-powered-by');
  config.assertRequiredRuntimeEnv();

  app.setGlobalPrefix(config.apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: config.apiVersion,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  const allowedOrigins = toOriginSet(config.corsAllowedOrigins);
  const allowAllOrigins = allowedOrigins.has('*');
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        allowedOrigins.size === 0 ||
        allowAllOrigins ||
        allowedOrigins.has(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS_ORIGIN_DENIED'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-zalo-mini-app-session',
      'x-mini-app-session',
    ],
    credentials: true,
  });

  setupSwagger(app, config);

  await app.listen(config.port);
  console.info('[server-bootstrap]', {
    port: config.port,
    apiPrefix: `/${config.apiPrefix}/v${config.apiVersion}`,
    nodeEnv: config.nodeEnv,
  });
}

void bootstrap();
