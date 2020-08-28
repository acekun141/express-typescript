import * as jwt from "jsonwebtoken";
import * as uuid from "uuid";
import { redisClient } from "../index";
import User from "../user/user.interface";
import TokenData from "../interface/tokenData.interface";
import DataStoredInAccessToken from "../interface/dataStoredInAccessToken.interface";
import DataStoredInRefreshToken from "../interface/dataStoredInRefreshToken.interface";
import TokenNotFoundException from "../exceptions/TokenNotFoundException";
import { promisify } from "util";

class TokenService {
  private getValue; 

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    this.getValue = promisify(redisClient.get).bind(redisClient);
  }

  public createToken(user: User, agentInfo: any): TokenData {
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

  public removeToken(tokenId: string): void {
    redisClient.setex(tokenId, 1, "");
  }
  
  public async getValueOfToken(tokenId: string): Promise<string> {
    try {
      const value = await this.getValue(tokenId)
      if (!value) {
        throw new TokenNotFoundException(tokenId);
      }
      return value;
    } catch (error) {
      throw error;
    }
  }
}
export default TokenService;