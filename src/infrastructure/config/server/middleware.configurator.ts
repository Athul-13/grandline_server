import express, { Application, ErrorRequestHandler } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { injectable, inject } from 'tsyringe';
import { SERVER_CONFIG } from '../../../shared/config';
import { CONFIG_TOKENS } from '../../di/tokens';

/**
 * Middleware configuration interface
 */
export interface MiddlewareConfig {
  corsOptions?: cors.CorsOptions;
  bodyParserOptions?: {
    json?: { limit?: string };
    urlencoded?: { extended?: boolean; limit?: string };
  };
}

/**
 * Express middleware configurator class
 */
@injectable()
export class MiddlewareConfigurator {
  /**
   * Creates a new middleware configurator
   */
  constructor(
    @inject(CONFIG_TOKENS.ExpressApp)
    private readonly app: Application,
    @inject(CONFIG_TOKENS.ErrorHandler)
    private readonly errorHandler: ErrorRequestHandler,
    private readonly config: MiddlewareConfig = {}
  ) {}

  /**
   * Configures all middleware on the Express app
   * Order matters: CORS -> Cookie Parser -> Body Parsers -> Error Handler (last)
   * Note: Webhook paths are excluded from JSON parsing to preserve raw body for signature verification
   */
  public configure(): void {
    // CORS middleware (first - handles preflight requests)
    const corsOptions = this.config.corsOptions || {
      ...SERVER_CONFIG.CORS,
      methods: [...SERVER_CONFIG.CORS.methods],
      allowedHeaders: [...SERVER_CONFIG.CORS.allowedHeaders],
    };
    this.app.use(cors(corsOptions));

    // Cookie parser middleware
    this.app.use(cookieParser());

    // Body parsing middleware - exclude webhook paths to preserve raw body for Stripe signature verification
    const jsonOptions = this.config.bodyParserOptions?.json || SERVER_CONFIG.BODY_PARSER.json;
    const urlencodedOptions =
      this.config.bodyParserOptions?.urlencoded || SERVER_CONFIG.BODY_PARSER.urlencoded;

    // JSON parser - skip webhook routes
    this.app.use((req, res, next) => {
      if (req.path.startsWith('/api/v1/webhooks')) {
        return next(); // Skip JSON parsing for webhook routes
      }
      const jsonParser = jsonOptions ? express.json(jsonOptions) : express.json();
      return jsonParser(req, res, next);
    });

    // URL encoded parser - skip webhook routes
    this.app.use((req, res, next) => {
      if (req.path.startsWith('/api/v1/webhooks')) {
        return next(); // Skip URL encoded parsing for webhook routes
      }
      const urlencodedParser = urlencodedOptions
        ? express.urlencoded(urlencodedOptions)
        : express.urlencoded({ extended: true });
      return urlencodedParser(req, res, next);
    });

    // Error handling middleware (must be last - catches all errors)
    this.app.use(this.errorHandler);
  }
}

