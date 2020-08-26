import HttpException from "./HttpException";

class UserWithThatUsernameExistsException extends HttpException {
  constructor(username: string) {
    super(400, `User with username ${username} existed`);
  }
}

export default UserWithThatUsernameExistsException;