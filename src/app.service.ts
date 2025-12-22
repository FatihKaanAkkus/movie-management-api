import { Injectable } from '@nestjs/common';
import { ApiInfoDto } from './app.api-info.dto';

@Injectable()
export class AppService {
  getHello(): ApiInfoDto {
    return {
      description:
        'Welcome to the Movie Management API!' +
        ' Please refer to the documentation for usage details at /api.',
      availableVersions: ['v1'],
      docsUrl: '/api',
    };
  }
}
