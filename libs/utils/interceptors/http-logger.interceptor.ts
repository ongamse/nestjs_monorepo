import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ILoggerService } from '../../modules/global/logger/adapter';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: ILoggerService) {}
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const host = ctx.getArgs()[0].hostname;
    const path = ctx.getArgs()[0].originalUrl;

    const context = `${ctx.getClass().name}/${ctx.getHandler().name}`;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const logger = { context: context, url: `${host}${path}`, runtime: `${Date.now() - now}ms`, time: Date.now() };
        this.loggerService.log(JSON.stringify(logger));
      }),
    );
  }
}
