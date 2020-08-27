import { cleanEnv, port, str } from "envalid";

function validateEnv() {
  cleanEnv(process.env, {
    JWT_SECRET: str(),
    MONGO_USER: str(),
    MONGO_PASSWORD: str(),
    MONGO_PATH: str(),
    REDIS_HOST: str(),
    REDIS_PORT: port(),
    PORT: port()
  })
}

export default validateEnv;