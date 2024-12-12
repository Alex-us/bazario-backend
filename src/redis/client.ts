import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;

export default () => {
  if (redisClient) {
    return redisClient;
  }
  redisClient = createClient({
    username: 'default',
    password: 'uGTQMPsGkznzGLpqqIvsX6zLvSaWL8NP',
    socket: {
      host: process.env.REDIS_URI,
      port: 11029,
    },
  });

  redisClient.on('error', err => console.log('Redis Client Error', err));
  return redisClient;
};
