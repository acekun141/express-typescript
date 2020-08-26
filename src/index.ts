import "dotenv/config";
import App from "./app";
import AuthenticationController from "./authentication/authentication.controller";
import UserController from "./user/user.controller";
import validateEnv from "./utils/validateEnv";

validateEnv();

const app = new App([
  new AuthenticationController(),
  new UserController()
]);

app.listen();