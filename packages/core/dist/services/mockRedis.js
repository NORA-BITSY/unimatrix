import { logger } from '@matrix/shared';
// Mock Redis client that does nothing but doesn't throw errors
class MockRedis {
    async connect() {
        return true;
    }
    async ping() {
        return 'PONG';
    }
    async quit() {
        return 'OK';
    }
    async get(key) {
        logger.debug(`Mock Redis: GET ${key} (returning null)`);
        return null;
    }
    async set(key, value, ..._args) {
        logger.debug(`Mock Redis: SET ${key} ${value}`);
        return 'OK';
    }
    async del(key) {
        logger.debug(`Mock Redis: DEL ${key}`);
        return 1;
    }
    async exists(key) {
        logger.debug(`Mock Redis: EXISTS ${key}`);
        return 0;
    }
    async expire(key, seconds) {
        logger.debug(`Mock Redis: EXPIRE ${key} ${seconds}`);
        return 1;
    }
    async incr(key) {
        logger.debug(`Mock Redis: INCR ${key}`);
        return 1;
    }
    async hget(key, field) {
        logger.debug(`Mock Redis: HGET ${key} ${field}`);
        return null;
    }
    async hset(key, field, value) {
        logger.debug(`Mock Redis: HSET ${key} ${field} ${value}`);
        return 1;
    }
    async hgetall(key) {
        logger.debug(`Mock Redis: HGETALL ${key}`);
        return {};
    }
    async sadd(key, ...members) {
        logger.debug(`Mock Redis: SADD ${key} ${members.join(' ')}`);
        return members.length;
    }
    async smembers(key) {
        logger.debug(`Mock Redis: SMEMBERS ${key}`);
        return [];
    }
    async srem(key, ...members) {
        logger.debug(`Mock Redis: SREM ${key} ${members.join(' ')}`);
        return members.length;
    }
    async setex(key, seconds, value) {
        logger.debug(`Mock Redis: SETEX ${key} ${seconds} ${value}`);
        return 'OK';
    }
    async ttl(key) {
        logger.debug(`Mock Redis: TTL ${key}`);
        return -1;
    }
    async flushall() {
        logger.debug(`Mock Redis: FLUSHALL`);
        return 'OK';
    }
    async keys(pattern) {
        logger.debug(`Mock Redis: KEYS ${pattern}`);
        return [];
    }
    async lpush(key, ...values) {
        logger.debug(`Mock Redis: LPUSH ${key} ${values.join(' ')}`);
        return values.length;
    }
    async rpop(key) {
        logger.debug(`Mock Redis: RPOP ${key}`);
        return null;
    }
    // Event handler stubs
    on(_event, _listener) {
        // Do nothing for mock
    }
    off(_event, _listener) {
        // Do nothing for mock
    }
}
export { MockRedis };
//# sourceMappingURL=mockRedis.js.map