import { applyDecorators, Controller } from '@nestjs/common';

export function V1Controller(path: string): ClassDecorator {
  return applyDecorators(
    Controller({
      path,
      version: '1',
    }),
  );
}
