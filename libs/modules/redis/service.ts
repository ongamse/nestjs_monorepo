import { HttpStatus } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { createClient, RedisClientOptions, RedisClientType } from 'redis';

import { ApiException } from '../../../libs/utils/exception';
import { ILoggerService } from '../global/logger/adapter';
import { ICacheService } from './adapter';
import { RedisKeyArgument, RedisKeyValue, RedisValeuArgument } from './types';

@Injectable()
export class RedisService implements ICacheService {
  client: RedisClientType;
  private readonly successKey = 'OK';

  constructor(private readonly config: RedisClientOptions, private readonly logger: ILoggerService) {
    this.client = createClient(this.config);
  }

  async connect(): Promise<RedisClientType> {
    await this.client.connect();
    this.logger.log('Redis connected!', RedisService.name);
    return this.client;
  }

  async set(key: RedisKeyArgument, value: RedisValeuArgument, config?: unknown): Promise<void> {
    const setResult = await this.client.set(key, value, config);
    if (setResult !== this.successKey) this.throwException(`Cache ${this.set.name} error: ${key} ${value}`);
  }

  async get(key: RedisKeyArgument): Promise<unknown> {
    const getResult = await this.client.get(key);
    if (!getResult) this.logger.warn(`Not found key: ${key}`, RedisService.name);

    return getResult;
  }

  async del(key: RedisKeyArgument): Promise<void> {
    const deleted = await this.client.del(key);
    if (!deleted) this.throwException(`Cache key: ${key} not deleted`);
  }

  async setMulti(redisList: RedisKeyValue[]): Promise<void> {
    const multi = this.client.multi();

    for (const model of redisList) {
      multi.rPush(model.key, model.value);
    }

    await multi.exec();
  }

  async pExpire(key: RedisKeyArgument, miliseconds: number): Promise<void> {
    const expired = await this.client.pExpire(key, miliseconds);
    if (!expired) this.throwException(`Set expire error key: ${key}`);
  }

  async hGet(key: RedisKeyArgument, field: RedisKeyArgument): Promise<unknown | unknown[]> {
    return await this.client.hGet(key, field);
  }

  async hSet(key: RedisKeyArgument, field: RedisKeyArgument, value: RedisValeuArgument): Promise<number> {
    return await this.client.hSet(key, field, value);
  }

  async hGetAll(key: RedisKeyArgument): Promise<unknown | unknown[]> {
    return await this.client.hGetAll(key);
  }

  private throwException(error: string) {
    throw new ApiException(error, HttpStatus.INTERNAL_SERVER_ERROR, RedisService.name);
  }
}
