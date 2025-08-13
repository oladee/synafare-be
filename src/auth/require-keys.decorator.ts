import { SetMetadata } from '@nestjs/common';

export const KEYS_KEY = 'requiredKeys';

type KeyRequirement = string | { key: string; mustBeTrue?: boolean };

export const RequireKeys = (...keys: KeyRequirement[]) =>
  SetMetadata(KEYS_KEY, keys);
