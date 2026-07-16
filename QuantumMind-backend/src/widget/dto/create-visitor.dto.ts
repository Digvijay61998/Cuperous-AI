import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateVisitor {
  @IsString()
  @IsOptional()
  name: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  phone: string;
}
