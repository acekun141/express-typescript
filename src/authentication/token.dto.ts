import { IsString } from "class-validator";

class TokenIdDto {
  @IsString()
  tokenId: string;
}

export default TokenIdDto;