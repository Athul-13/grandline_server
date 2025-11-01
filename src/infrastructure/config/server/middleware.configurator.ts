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

    // Body parsing middleware
    const jsonOptions = this.config.bodyParserOptions?.json || SERVER_CONFIG.BODY_PARSER.json;
    const urlencodedOptions =
      this.config.bodyParserOptions?.urlencoded || SERVER_CONFIG.BODY_PARSER.urlencoded;

    this.app.use(jsonOptions ? express.json(jsonOptions) : express.json());
    this.app.use(urlencodedOptions ? express.urlencoded(urlencodedOptions) : express.urlencoded({ extended: true }));

    // Error handling middleware (must be last - catches all errors)
    this.app.use(this.errorHandler);
  }
}

