import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import UserWithThatEmailAlreadyExistsException from "../exceptions/UserWithThatEmailAlreadyExistsException";
import UserWithThatUsernameAlreadyExistsException from "../exceptions/UserWithThatUsernameAlreadyExistsException";
import DataStoredInToken from "../interface/dataStoredInToken.interface";
import TokenData from "../interface/tokenData.interface";
import CreateUserDto from "../user/user.dto";
import User from "../user/user.interface";
import userModel from "../user/user.model";

class AuthenticationService {
  public user = userModel;

  public async register(userData: CreateUserDto) {
    if (
      await this.user.findOne({ email: userData.email })
    ) {
      throw new UserWithThatEmailAlreadyExistsException(userData.email);
    }
    if (
      await this.user.findOne({ username: userData.username })
    ) {
      throw new UserWithThatUsernameAlreadyExistsException(userData.username);
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.user.create({
      ...userData,
      password: hashedPassword
    });
    const tokenData = this.createToken(user);
    const cookie = this.createCookie(tokenData);
    return { cookie, user };
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
    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, secret, { expiresIn })
    }
  }
}

export default AuthenticationService;