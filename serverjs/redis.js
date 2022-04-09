require('dotenv').config();
const { promisify } = require('util');
const redis = require('redis');
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const eventEmitter = new MyEmitter();

const client = redis.createClient(process.env.REDIS_HOST);

const lrange = promisify(client.lrange).bind(client);
const hgetall = promisify(client.hgetall).bind(client);
const type = promisify(client.type).bind(client);

const listener = redis.createClient(process.env.REDIS_HOST);

listener.on('ready', () => {
  listener.config('set', 'notify-keyspace-events', 'Elh');
  // Elh => see https://redis.io/topics/notifications to understand the configuration
  // l means we are interested in list events
  // h means we are interested in hash events

  listener.psubscribe(['__key*__:*']);

  listener.on('pmessage', async (pattern, channel, message) => {
    const messageType = await type(message);
    if (messageType === 'list') {
      const data = await lrange(message, 0, -1);
      eventEmitter.emit(message, data);
    } else if (messageType === 'hash') {
      const data = await hgetall(message);
      eventEmitter.emit(message, data);
    }
  });
});

const lpushAsync = promisify(client.lpush).bind(client);

module.exports = {
  hmset: promisify(client.hmset).bind(client),
  hmget: promisify(client.hmget).bind(client),
  hget: promisify(client.hget).bind(client),
  hset: promisify(client.hset).bind(client),
  lrange,
  hgetall,
  lpush: async (...params) => {
    console.log(...params);
    return lpushAsync(...params);
  },
  rpush: promisify(client.rpush).bind(client),
  rpoplpush: promisify(client.rpoplpush).bind(client),
  expire: promisify(client.expire).bind(client),
  hincrby: promisify(client.hincrby).bind(client),
  del: promisify(client.del).bind(client),
  rpop: promisify(client.rpop).bind(client),
  exists: promisify(client.exists).bind(client),
  eventEmitter,
};
