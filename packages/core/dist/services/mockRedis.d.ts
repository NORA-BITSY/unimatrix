declare class MockRedis {
    connect(): Promise<boolean>;
    ping(): Promise<string>;
    quit(): Promise<string>;
    get(key: string): Promise<null>;
    set(key: string, value: string, ..._args: any[]): Promise<string>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    incr(key: string): Promise<number>;
    hget(key: string, field: string): Promise<null>;
    hset(key: string, field: string, value: string): Promise<number>;
    hgetall(key: string): Promise<{}>;
    sadd(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<never[]>;
    srem(key: string, ...members: string[]): Promise<number>;
    setex(key: string, seconds: number, value: string): Promise<string>;
    ttl(key: string): Promise<number>;
    flushall(): Promise<string>;
    keys(pattern: string): Promise<never[]>;
    lpush(key: string, ...values: string[]): Promise<number>;
    rpop(key: string): Promise<null>;
    on(_event: string, _listener: Function): void;
    off(_event: string, _listener: Function): void;
}
export { MockRedis };
//# sourceMappingURL=mockRedis.d.ts.map