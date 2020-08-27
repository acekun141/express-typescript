import { NextFunction, Response } from "express";
import * as jwt from "jsonwebtoken";
import AuthenticationTokenMissingException from "../exceptions/AuthenticationTokenMissingException";
import WrongAuthenticationTokenException from "../exceptions/WrongAuthenticationTokenException";
import DataStoredInToken from "../interface/dataStoredInAccessToken.interface";
import RequestWithUser from "../interface/requestWithUser.interface";
import userModel from "../user/user.model";
import { redisClient } from "../index";

async function authMiddleware(request: RequestWithUser, response: Response, next: NextFunction) {
  const headers = request.headers;
  if (headers && headers.authorization) {
    const secret = process.env.JWT_SECRET;
    try {
      const verificationResponse = jwt.verify(headers.authorization.split(" ")[1], secret) as DataStoredInToken;
      const id = verificationResponse._id;
      // check if tokenId in redis
      redisClient.get(verificationResponse.tokenId, async (err, data) => {
        if (err || !data) {
          next(new WrongAuthenticationTokenException());
        } else {
          const user = await userModel.findById(id);
          if (user) {
            request.user = user;
            next();
          } else {
            next(new WrongAuthenticationTokenException());
          }
        }
      })
    } catch (error) {
      next(new WrongAuthenticationTokenException());
    }
  } else {
    next(new AuthenticationTokenMissingException());
  }
}

export default authMiddleware;