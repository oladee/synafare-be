import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { KEYS_KEY } from './require-keys.decorator';

type KeyRequirement = string | { key: string; mustBeTrue?: boolean };

@Injectable()
export class KeysGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredKeys = this.reflector.getAllAndOverride<KeyRequirement[]>(
      KEYS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredKeys || requiredKeys.length === 0) {
      return true; // No restriction
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Access denied: no user found');
    }

    const missingOrInvalid: string[] = [];

    for (const req of requiredKeys) {
      if (typeof req === 'string') {
        // Must exist
        if (!(req in user)) {
          missingOrInvalid.push(req);
        }
      } else if (req.mustBeTrue) {
        // Must exist and be strictly true
        if (!(req.key in user) || user[req.key] !== true) {
          missingOrInvalid.push(req.key);
        }
      } else {
        // Must exist (same as string case)
        if (!(req.key in user)) {
          missingOrInvalid.push(req.key);
        }
      }
    }

    if (missingOrInvalid.length > 0) {
      throw new ForbiddenException(
        `Access denied: missing or invalid keys [${missingOrInvalid.join(', ')}]`,
      );
    }

    return true;
  }
}
