import { Router, Response, Request, NextFunction } from "express";
import NotAuthorizedException from "../exceptions/NotAuthorizedException";
import Controller from "../interface/controller.interface";
import RequestWithUser from "../interface/requestWithUser.interface";
import authMiddleware from "../middleware/auth.middleware";
import userModel from "./user.model";
import UserNotFoundException from "../exceptions/UserNotFoundException";

class UserController implements Controller {
  public path = '/user';
  public router = Router();
  private user = userModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, authMiddleware, this.getUserProfile);
    this.router.get(`${this.path}/:id`, authMiddleware, this.getUserById);
  }

  private getUserById = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const userQuery = this.user.findById(id);
    const user = await userQuery;
    if (user) {
      response.send({ profile: user.profile });
    } else {
      next(new UserNotFoundException(id));
    }
  }

  private getUserProfile = async (request: RequestWithUser, response: Response, next: NextFunction ) => {
    const user = request.user;
    response.json({ profile: user.profile });
  }
}

export default UserController;