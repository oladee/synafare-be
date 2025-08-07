// filters/file-validation-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Catch(BadRequestException)
export class FileValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Delete single file
    if (request.file && request.file.path) {
      this.deleteFile(request.file.path);
    }

    // Delete multiple files
    if (request.files) {
      const files = Array.isArray(request.files)
        ? request.files // when using @UploadedFiles() with array
        : Object.values(request.files).flat(); // when using multiple named fields

      for (const file of files) {
        if (file?.path) {
          this.deleteFile(file.path);
        }
      }
    }

    const status = exception.getStatus();
    const resBody = exception.getResponse();

    return response.status(status).json({
      success: false,
      message: 'Validation failed',
      errors: resBody['message'] || resBody,
    });
  }

  private deleteFile(filePath: string) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Failed to delete file at ${filePath}:`, err.message);
      } else {
        console.log(`Deleted file: ${filePath}`);
      }
    });
  }
}
