import { Delete, Get, Param, Post, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { V1Controller } from '../../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../../common/decorators/api-request.decorator';
import {
  MediaService,
  type MediaApiResult,
} from '../application/media.service';

function writeApiResult(response: Response, result: MediaApiResult): void {
  if (result.headers) {
    for (const [name, value] of Object.entries(result.headers)) {
      response.setHeader(name, value);
    }
  }

  response.status(result.status);
  if (result.isRaw) {
    response.send(result.body as string | Buffer);
    return;
  }

  response.json(result.body);
}

@V1Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async getMediaAssets(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.mediaService.getMediaAssets(request);
    writeApiResult(response, result);
  }

  @Post()
  async postMediaPrepareUpload(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.mediaService.postMediaPrepareUpload(request);
    writeApiResult(response, result);
  }

  @Post('upload-complete')
  async postMediaUploadComplete(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.mediaService.postMediaUploadComplete(request);
    writeApiResult(response, result);
  }

  @Delete(':mediaId')
  async deleteMediaAsset(
    @ApiRequest() request: Request,
    @Param('mediaId') mediaId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.mediaService.deleteMediaAsset(request, mediaId);
    writeApiResult(response, result);
  }
}
