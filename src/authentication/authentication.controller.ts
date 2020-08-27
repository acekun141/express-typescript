import * as bcrypt from "bcrypt";
import { Request, Response, NextFunction, Router } from "express";
import * as jwt from "jsonwebtoken";
import * as uuid from "uuid";
import * as expressUseragent from "express-useragent";
import WrongCredentialsException from "../exceptions/WrongCredentialsException";
import TokenNotFoundException from "../exceptions/TokenNotFoundException";
import Controller from "../interface/controller.interface";
import DataStoredInAccessToken from "../interface/dataStoredInAccessToken.interface";
import DataStoredInRefreshToken from "../interface/dataStoredInRefreshToken.interface";
import TokenData from "../interface/tokenData.interface";
import validationMiddleware from "../middleware/validation.middleware";
import authMiddleware from "../middleware/auth.middleware";
import CreateUserDto from "../user/user.dto";
import User from "../user/user.interface";
import RequestWithUser from "../interface/requestWithUser.interface";
import userModel from "../user/user.model";
import AuthenticationService from "./authentication.service";
import LogInDto from "./logIn.dto";
import TokenDto from "./token.dto";
import { redisClient } from "../index";

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
    this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), expressUseragent.express(), this.loggingIn);
    this.router.post(`${this.path}/logout`, this.loggingOut);
    this.router.post(`${this.path}/refresh`, expressUseragent.express(), this.refreshing);
    this.router.post(`${this.path}/logout/another`, validationMiddleware(TokenDto), authMiddleware, this.loggingOutAnother);
  }

  private registration = async (req: Request, res: Response, next: NextFunction) => {
    const userData: CreateUserDto = req.body;
    try {
      const successMessage = await this.authenticationService.register(userData);
      res.json({ message: successMessage });
    } catch (error) {
      next(error);
    }
  }

  private loggingIn = async (req: Request & {useragent: any}, res: Response, next: NextFunction) => {
    const logInData: LogInDto = req.body;
    const user = await this.user.findOne({ username: logInData.username });
    if (user) {
      const isPasswordMatching = await bcrypt.compare(
        logInData.password,
        user.password
      );
      if (isPasswordMatching) {
        const agentInfo = {...req.useragent, userId: user._id};
        const tokenData = this.createToken(user, agentInfo);
        res.json({ tokenData });
      }
    } else {
      next(new WrongCredentialsException());
    }
  }
  
  private loggingOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reqHeader = req.headers;
      const tokenData = jwt.verify(reqHeader.authorization.split(" ")[1], process.env.JWT_SECRET) as DataStoredInAccessToken;
      // remove token in redis
      redisClient.setex(tokenData.tokenId, 1, "");
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  }

  private loggingOutAnother = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { tokenId } = req.body;
    redisClient.get(tokenId, (err, data) => {
      if (err || !data) {
        next(new TokenNotFoundException(tokenId));
      } else {
        const userId = JSON.parse(data).userId;
        if (userId === req.user._id) {
          redisClient.setex(tokenId, 1, "");
          res.sendStatus(200);
        } else {
          next(new TokenNotFoundException(tokenId));
        }
      }
    });
  }

  private refreshing = async (req: Request & { useragent: any }, res: Response, next: NextFunction) => {
    try {
      const reqHeader = req.headers;
      const accessToken = reqHeader.authorization.split(" ")[1];
      const refreshToken: any = reqHeader["x-refresh-token"];
      
      if (accessToken && refreshToken) {
        const refreshTokenData = jwt.verify(refreshToken, process.env.JWT_SECRET) as DataStoredInRefreshToken;
        const accessTokenData = jwt.verify(accessToken, process.env.JWT_SECRET) as DataStoredInAccessToken;
        const user = await this.authenticationService.refreshToken(accessToken, accessTokenData, refreshTokenData);
        const agentInfo = {...req.useragent, userId: user._id};
        const tokenData = this.createToken(user, agentInfo);
        res.json({ tokenData });
      } else {
        next(new WrongCredentialsException())
      }
    } catch (error) {
      next(error);
    }
  }

  private createToken(user: User, agentInfo: any): TokenData {
    try {
      const tokenId = uuid.v4();
      const secret = process.env.JWT_SECRET;
      // create access token;
      const accessTokenExpires = 60*60; // an hour
      const dataStoredInAccessToken: DataStoredInAccessToken = { tokenId, _id: user._id };
      const accessToken = jwt.sign(dataStoredInAccessToken, secret, { expiresIn: accessTokenExpires });
      // create refresh token
      const refreshTokenExpires = 60*60*24*7; // a week
      const dataStoredInRefreshToken: DataStoredInRefreshToken = { tokenId, accessToken };
      const refreshToken = jwt.sign(dataStoredInRefreshToken, secret, { expiresIn: refreshTokenExpires });
      // set new tokenId in redis
      redisClient.setex(tokenId, refreshTokenExpires, JSON.stringify(agentInfo));

      return { accessToken, refreshToken };
    } catch (error) {
      throw error;
    }
  }
}

export default AuthenticationController;