import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

/**
 * Rejects a malformed Mongo id with 404 (not a 500 CastError). 404 rather than
 * 400 keeps id probing indistinguishable from "does not exist".
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || !isValidObjectId(value)) {
      throw new NotFoundException('Resource not found');
    }
    return String(value);
  }
}
