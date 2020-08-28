import * as redis from "redis";

class redisDatabase {
  public redisClient;
  constructor() {
    this.initialize();
  }
  private initialize() {
    const redisHost = process.env.REDIS_HOST;
    const redisPort: any = process.env.REDIS_PORT;
    this.redisClient = redis.createClient({ host: redisHost, port: redisPort });
    this.redisClient.on("error", (error) => {
      console.log(error);
    })
  }
}

export default redisDatabase;