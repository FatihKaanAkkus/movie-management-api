import { Request } from '@nestjs/common';

export interface IAuthRequest extends Request {
  user: {
    userId: string;
    [key: string]: any;
  };
}
