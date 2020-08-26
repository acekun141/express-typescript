import HttpException from "./HttpException";

class UserWithThatEmailAlreadyException extends HttpException {
  constructor(email: string) {
    super(400, `User with email ${email} already existed`);
  }
}

export default UserWithThatEmailAlreadyException;