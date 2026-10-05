import { describe, expect, it } from 'vitest';
import { EnvValidationError, parseEnv } from '../src/config/env.js';

describe('parseEnv', () => {
  it('applies defaults, treating empty values as unset', () => {
    expect(parseEnv({ PORT: '' })).toEqual({
      NODE_ENV: 'development',
      PORT: 4000,
      CORS_ORIGINS: ['http://localhost:5173'],
      LOG_LEVEL: 'info',
      TRUST_PROXY: false,
    });
  });

  it('parses comma-separated CORS origins and normalizes them', () => {
    const env = parseEnv({ CORS_ORIGINS: 'http://localhost:5173/, https://app.dogwalkr.com ,' });

    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5173', 'https://app.dogwalkr.com']);
  });

  it.each([
    ['true', true],
    ['FALSE', false],
    ['0', false],
    ['1', 1],
    ['2', 2],
  ])('parses TRUST_PROXY=%s', (raw, expected) => {
    expect(parseEnv({ TRUST_PROXY: raw }).TRUST_PROXY).toBe(expected);
  });

  it('fails fast listing every invalid variable', () => {
    const attempt = () =>
      parseEnv({ PORT: 'abc', NODE_ENV: 'staging', CORS_ORIGINS: 'not a url', TRUST_PROXY: 'yes' });

    expect(attempt).toThrow(EnvValidationError);
    try {
      attempt();
    } catch (error) {
      const message = (error as EnvValidationError).message;
      for (const name of ['PORT', 'NODE_ENV', 'CORS_ORIGINS', 'TRUST_PROXY']) {
        expect(message).toContain(`- ${name}:`);
      }
    }
  });
});
