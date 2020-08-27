import * as bcrypt from "bcrypt";
import UserWithThatEmailAlreadyExistsException from "../exceptions/UserWithThatEmailAlreadyExistsException";
import UserWithThatUsernameAlreadyExistsException from "../exceptions/UserWithThatUsernameAlreadyExistsException";
import WrongCredentialsException from "../exceptions/WrongCredentialsException";
import DataStoredInAccessToken from "../interface/dataStoredInAccessToken.interface";
import DataStoredInRefreshToken from "../interface/dataStoredInRefreshToken.interface";
import CreateUserDto from "../user/user.dto";
import User from "../user/user.interface";
import userModel from "../user/user.model";
import { redisClient } from "../index";
import { promisify } from "util";

class AuthenticationService {
  public user = userModel;

  public async register(userData: CreateUserDto) {
    const userWithEmail = await this.user.findOne({ email: userData.email });
    const userWithUsername = await this.user.findOne({ username: userData.username });
    if (userWithEmail) {
      throw new UserWithThatEmailAlreadyExistsException(userData.email);
    }
    if (userWithUsername) {
      throw new UserWithThatUsernameAlreadyExistsException(userData.username);
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user: User = await this.user.create({
      ...userData,
      password: hashedPassword
    });
    return `Register user ${user.username} successful!`;
  }

  public async refreshToken(accessToken: string, accessTokenData: DataStoredInAccessToken, refreshTokenData: DataStoredInRefreshToken): Promise<User> {
    const getAsync = promisify(redisClient.get).bind(redisClient);
    try {
      const value = await getAsync(refreshTokenData.tokenId);
      if (!value) {
        throw new WrongCredentialsException();
      }
      if (accessToken !== refreshTokenData.accessToken) {
        throw new WrongCredentialsException();
      }
      redisClient.setex(refreshTokenData.tokenId, 1, "");
      const user: User = await this.user.findById(accessTokenData._id);
      return user;
    } catch (error) {
      throw new WrongCredentialsException();
    }
  }
}

export default AuthenticationService;