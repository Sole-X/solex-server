import { Logger, QueryRunner } from 'typeorm';
import { createLogger, Logger as WinstonLogger, transports, format } from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import winston from 'winston';

export class CustomLogger implements Logger {
  private readonly queryLogger: WinstonLogger;
  private readonly customFormat: any;
  constructor() {
    this.customFormat = format.printf(
      ({ level, message, label, timestamp }) => `${timestamp} [${label}] ${level}: ${message}`,
    );

    this.queryLogger = winston.createLogger({
      transports: new winstonDaily({
        level: 'warn',
        datePattern: 'YYYY-MM-DD',
        dirname: 'logs/error',
        filename: `typeorm.%DATE%.error.log`,
        maxFiles: 60,
        zippedArchive: true,
      }),
      format: this.customFormat,
    });
  }

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    return;
  }

  logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    this.queryLogger.error({
      level: 'error',
      message: `${error} - ${query} - ${JSON.stringify(parameters)}`,
      timestamp: Date.now(),
      label: 'query',
    });
  }

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    this.queryLogger.error({
      level: 'error',
      message: `${time} - ${query} - ${JSON.stringify(parameters)}`,
      timestamp: Date.now(),
      label: 'slow',
    });
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    this.queryLogger.log({
      level: 'warn',
      message,
      timestamp: Date.now(),
      label: 'schema',
    });
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    this.queryLogger.log({
      level: 'warn',
      message,
      timestamp: Date.now(),
      label: 'migration',
    });
  }

  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    return;
  }
}
