import * as express from "express";
import * as morgan from "morgan";
import * as cors from "cors";
import * as helmet from "helmet";
import * as bodyParser from "body-parser";

class App {
  public app: express.Application;
  constructor(controllers: any[]) {
    this.app = express();

    this.initializeMiddleware();
    this.initializeControllers(controllers);
  }

  private initializeMiddleware() {
    this.app.use(express());
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(morgan("dev"));
    this.app.use(bodyParser.json());
  }

  private initializeControllers(controllers: any[]) {
    controllers.forEach(controller => {
      this.app.use(controller.router);
    })
  }

  public listen() {
    const port = 8000;
    this.app.listen(port, () => {
      console.log(`This app running at port ${port}`);
    })
  }
}

export default App;