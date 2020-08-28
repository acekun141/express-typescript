import "dotenv/config";
import App from "./app";
import redisDatabase from "./utils/redis.db";
import AuthenticationController from "./authentication/authentication.controller";
import UserController from "./user/user.controller";
import validateEnv from "./utils/validateEnv";

validateEnv();

const redisDb = new redisDatabase();
export const redisClient = redisDb.redisClient;

export const app = new App([
  new AuthenticationController(),
  new UserController()
]);


app.listen();