import * as redis from "redis";
import { RedisClient } from "redis";
import { promisify } from "util";
import { Container, Service, Inject } from "typedi";

@Service("RedisService")
export class RedisService {
  private _client: RedisClient;
  private options: any;
  private _isConnected: boolean = false;

  constructor(@Inject("logger") private logger) {
    this.options = this._options();
    this._client = redis.createClient(this.options);

    this._client.on("error", (err) => {
      this.logger.error("Redis server err", err);
    });

    this._client.on("connect", () => {
      this._isConnected = true;
      this.logger.info("Connected to remote Redis server!");
    });
  }

  chkAndAddSet(key, value) {
    return this.sismember(key, value).then((result) => {
      if (result == 1) {
        return true;
      } else {
        this.sadd(key, value);
        return false;
      }
    });
  }

  private _options(): any {
    return {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      db: process.env.REDIS_DB_NUMBER,
      connect_timeout: 0,
      retry_strategy: this._retryStrategy.bind(this),
    };
  }

  public async get(key: string): Promise<any> {
    if (!this._isConnected) {
      return undefined;
    }
    return promisify(this._client.get)
      .bind(this._client)(key)
      .then((result) => {
        return Promise.resolve(result ? result : undefined);
      })
      .catch((err) => {
        console.error(err);
        return undefined;
      });
  }

  /**
   *
   * @param key
   * @param value
   * @param expireTime key is valid for expireTime seconds
   */
  public async set(
    key: string,
    value: any,
    expireTime: number = 0
  ): Promise<any> {
    if (!this._isConnected) {
      return Promise.reject(new Error("redis disconnected"));
    }

    if (expireTime > 0) {
      return promisify(this._client.setex)
        .bind(this._client)(key, expireTime, value)
        .then((result) => {
          return Promise.resolve(result ? result : undefined);
        })
        .catch((err) => {
          console.error(err);
          return undefined;
        });
    } else {
      return promisify(this._client.set)
        .bind(this._client)(key, value)
        .catch((err) => {
          this.logger.error(err);
          return undefined;
        });
    }
  }

  public async sismember(key: string, value: string): Promise<any> {
    if (!this._isConnected) return undefined;

    return promisify(this._client.sismember)
      .bind(this._client)(key, value)
      .then((result) => {
        return Promise.resolve(result ? result : undefined);
      })
      .catch((err) => {
        this.logger.error(err);
        return 0;
      });
  }

  public async smembers(key: string): Promise<any> {
    if (!this._isConnected) return undefined;

    return promisify(this._client.smembers)
      .bind(this._client)(key)
      .then((result) => {
        return Promise.resolve(result ? result : undefined);
      })
      .catch((err) => {
        this.logger.error(err);
        return 0;
      });
  }
  /**
   *
   * @param key
   * @param value
   * @param expireTime key is valid for expireTime seconds
   */
  public async sadd(
    key: string,
    value: any,
    expireTime: number = 0
  ): Promise<any> {
    if (!this._isConnected) {
      return undefined;
    }

    return promisify(this._client.sadd).bind(this._client)(key, value);
  }

  public async lpush(key: string, value: any): Promise<any> {
    if (!this._isConnected) {
      return undefined;
    }

    return promisify(this._client.lpush).bind(this._client)(key, value);
  }

  public async lrem(key: string, value: any): Promise<any> {
    if (!this._isConnected) {
      return undefined;
    }

    return promisify(this._client.lrem).bind(this._client)(key, 1, value);
  }
  public async rpop(key: string): Promise<any> {
    if (!this._isConnected) {
      return undefined;
    }

    return promisify(this._client.rpop).bind(this._client)(key);
  }

  public async lrange(key: string, start, end): Promise<any> {
    if (!this._isConnected) {
      return undefined;
    }

    return promisify(this._client.lrange).bind(this._client)(key, start, end);
  }
  public async lpos(key: string, value: any): Promise<any> {
    if (!this._isConnected) {
      return undefined;
    }

    return promisify(this._client.lpos).bind(this._client)(key, value);
  }

  /**
   * Multiple get
   * @param key
   */
  public async mget(key: string[]): Promise<any> {
    if (!this._isConnected) {
      return [];
    }
    return new Promise((resolve, reject) => {
      this._client.mget(key, (err, reply) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  public async hmset(key, data): Promise<any> {
    if (!this._isConnected) {
      return undefined;
    }

    return promisify(this._client.hmset).bind(this._client)(key, data);
  }

  public async hgetall(key: string): Promise<any> {
    if (!this._isConnected) {
      return [];
    }
    return new Promise((resolve, reject) => {
      this._client.hgetall(key, (err, reply) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  /**
   * Multiple set
   * @param keys
   */
  public async mset(keys: string[]): Promise<any> {
    throw new Error("not implemented yet");
  }

  /**
   *
   * @param key
   * @param value
   * @param expireTime key is valid for expireTime seconds
   */
  public async expire(key: string, expireTime: number = 0): Promise<any> {
    if (!this._isConnected) {
      return undefined;
    }

    return promisify(this._client.expire).bind(this._client)(key, expireTime);
  }

  public close(): void {
    this._client.quit();
  }

  private _retryStrategy(ret: any): any {
    this._isConnected = false;
    if (ret.error && ret.error.code === "ECONNREFUSED") {
      console.error("The redis server refused the connection");
    } else if (ret.error && ret.error.code === "ENOTFOUND") {
      console.error("The redis URL is not accessible");
    } else if (ret.error && ret.error.code) {
      console.error("The redis has error : " + ret.error.message);
    }
    return this.options.retry_window;
  }
}
