import * as bcrypt from "bcrypt";
import { Request, Response, NextFunction, Router, response } from "express";
import * as jwt from "jsonwebtoken";
import WrongCredentialsException from "../exceptions/WrongCredentialsException";
import Controller from "../interface/controller.interface";
import DataStoredInToken from "../interface/dataStoredInToken.interface";
import TokenData from "../interface/tokenData.interface";
import validationMiddleware from "../middleware/validation.middleware";
import CreateUserDto from "../user/user.dto";
import User from "../user/user.interface";
import userModel from "../user/user.model";
import AuthenticationService from "./authentication.service";
import LogInDto from "./logIn.dto";

class AuthenticationController implements Controller {
  public path = '/auth';
  public router = Router();
  private authenticationService = new AuthenticationService();
  private user = userModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), this.registration)
    this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), this.loggingIn);
    this.router.post(`${this.path}/logout`, this.loggingOut);
  }

  private registration = async (req: Request, res: Response, next: NextFunction) => {
    const userData: CreateUserDto = req.body;
    try {
      const { cookie, user } = await this.authenticationService.register(userData);
      res.setHeader('Set-Cookie', [cookie]);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  private loggingIn = async (req: Request, res: Response, next: NextFunction) => {
    const logInData: LogInDto = req.body;
    const user = await this.user.findOne({ username: logInData.username });
    if (user) {
      const isPasswordMatching = await bcrypt.compare(
        logInData.password,
        user.password
      );
      if (isPasswordMatching) {
        const tokenData = this.createToken(user);
        res.setHeader('Set-Cookie', [this.createCookie(tokenData)]);
        res.send(200);
      }
    }
  }

  private loggingOut = (req: Request, res: Response) => {
    res.setHeader('Set-Cookie', [`Authorization=;Max-age=0`]);
    res.send(200);
  }

  private createCookie(tokenData: TokenData) {
    return `Authorization=${tokenData.token}; HttpOnly; Max-age=${tokenData.expiresIn}`;
  }

  private createToken(user: User): TokenData {
    const expiresIn = 60*60; // an hour
    const secret = process.env.JWT_SECRET;
    const dataStoredInToken: DataStoredInToken = {
      _id: user._id
    };
    return { expiresIn, token: jwt.sign(dataStoredInToken, secret, { expiresIn })};
  }
}

export default AuthenticationController;