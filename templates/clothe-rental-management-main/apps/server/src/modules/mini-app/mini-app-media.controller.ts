import { Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { V1Controller } from '../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../common/decorators/api-request.decorator';
import { NullableBodyField } from '../../common/decorators/nullable-body-field.decorator';
import { MiniAppExtensionsService } from './extention-service/mini-app-extensions.service';

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

interface UploadedAudioFile {
  buffer: Buffer;
  size: number;
  mimetype?: string;
  originalname?: string;
}

@V1Controller('media')
export class MiniAppMediaController {
  constructor(
    private readonly miniAppExtensionsService: MiniAppExtensionsService,
  ) {}

  @Post('voice/transcriptions')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: { fileSize: MAX_AUDIO_BYTES },
    }),
  )
  async postVoiceTranscription(
    @ApiRequest() request: Request,
    @UploadedFile() file: UploadedAudioFile | undefined,
    @NullableBodyField('language') language: string | null,
  ): Promise<unknown> {
    return this.miniAppExtensionsService.postVoiceTranscription(
      request,
      file,
      language,
    );
  }
}
