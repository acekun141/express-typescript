import { IsString, ValidateNested, IsOptional } from "class-validator";
import CreateProfileDto from "./profile.dto";

class CreateUserDto {
  @IsString()
  public username: string;

  @IsString()
  public fullname: string;

  @IsString()
  public email: string;

  @IsString()
  public password: string;

  @IsOptional()
  @ValidateNested()
  public profile: CreateProfileDto;
}

export default CreateUserDto;