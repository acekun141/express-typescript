import { IsString, IsNumber } from "class-validator";

class CreateProfileDto {
  @IsNumber()
  public sex: number;

  @IsNumber()
  public age: number;

  @IsString()
  public base64Logo: string;
}

export default CreateProfileDto;