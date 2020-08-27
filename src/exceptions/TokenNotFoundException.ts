import HttpException from "./HttpException";

class TokenNotFoundException extends HttpException {
  constructor(tokenId: string) {
    super(400, `token ${tokenId} not found`);
  }
}

export default TokenNotFoundException;