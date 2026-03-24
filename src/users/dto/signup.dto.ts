import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @Matches(/^[a-zA-Z]{2,}\s[a-zA-Z]{2,}$/, {
    message: 'Full name must contain at least first and last name, each with at least 2 characters',
  })
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
})
  password: string;
}
