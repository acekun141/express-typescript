import * as express from "express";
import * as morgan from "morgan";
import * as cors from "cors";
import * as helmet from "helmet";
import * as bodyParser from "body-parser";
import * as mongoose from "mongoose";
import * as redis from "redis";
import errorMiddleware from "./middleware/error.middleware";
import Controller from "./interface/controller.interface";

class App {
  public app: express.Application;
  public redisClient: redis.RedisClient;
  constructor(controllers: Controller[]) {
    this.app = express();

    this.connectToTheMongoDb();
    this.connectToTheRedisDb();
    this.initializeMiddleware();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  private initializeMiddleware() {
    this.app.use(express());
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(morgan("dev"));
    this.app.use(bodyParser.json());
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller: Controller) => {
      this.app.use(controller.router);
    })
  }
  
  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private connectToTheMongoDb() {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH } = process.env;
    const mongoLink = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}?authSource=admin`;
    console.log(mongoLink);
    mongoose.connect(mongoLink, {
      useNewUrlParser: true, useUnifiedTopology: true
    })
      .then(() => console.log("Connect to database successful!"))
      .catch(() => console.log("Cannot connect to DB"));
  }

  private connectToTheRedisDb() {
    const redisHost = process.env.REDIS_HOST;
    const redisPort: any = process.env.REDIS_PORT;
    this.redisClient = redis.createClient({ host: redisHost, port: redisPort });
    this.redisClient.on("error", (error) => {
      console.log(error);
    })
  }

  public getRedisClient() {
    return this.redisClient;
  }

  public getServer() {
    return this.app;
  }

  public listen() {
    this.app.listen({port: process.env.PORT, host: "0.0.0.0"}, () => {
      console.log(`This app running at port ${process.env.PORT}`);
    })
  }
}

export default App;