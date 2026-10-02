import { describe, expect, it } from '@jest/globals';

import { classifyHost, normalizeHostname, schoolSubdomainUrl, type HostConfig } from './host.js';

const config: HostConfig = {
  baseDomain: 'shikkhacore.com',
  rootHosts: ['app.shikkhacore.com'],
  platformHosts: ['admin.shikkhacore.com'],
};

describe('normalizeHostname', () => {
  it('lowercases and strips the port and trailing dot', () => {
    expect(normalizeHostname('Greenfield.ShikkhaCore.com:3100')).toBe('greenfield.shikkhacore.com');
    expect(normalizeHostname('greenfield.shikkhacore.com.')).toBe('greenfield.shikkhacore.com');
  });

  it('rejects IP literals, empty values and malformed hosts', () => {
    expect(normalizeHostname('127.0.0.1')).toBeNull();
    expect(normalizeHostname('[::1]:4000')).toBeNull();
    expect(normalizeHostname('')).toBeNull();
    expect(normalizeHostname(undefined)).toBeNull();
    expect(normalizeHostname('bad_host.com')).toBeNull();
    expect(normalizeHostname('host.com:notaport')).toBeNull();
    expect(normalizeHostname('-leading.com')).toBeNull();
  });
});

describe('classifyHost', () => {
  it('recognises platform and root hosts', () => {
    expect(classifyHost('admin.shikkhacore.com', config).kind).toBe('platform');
    expect(classifyHost('app.shikkhacore.com:443', config).kind).toBe('root');
  });

  it('extracts the school slug from a single-label subdomain', () => {
    expect(classifyHost('greenfield.shikkhacore.com', config)).toEqual({
      kind: 'subdomain',
      hostname: 'greenfield.shikkhacore.com',
      slug: 'greenfield',
    });
  });

  it('never treats reserved labels, nested subdomains or the bare domain as schools', () => {
    expect(classifyHost('www.shikkhacore.com', config).kind).toBe('invalid');
    expect(classifyHost('api.shikkhacore.com', config).kind).toBe('invalid');
    expect(classifyHost('a.greenfield.shikkhacore.com', config).kind).toBe('invalid');
    expect(classifyHost('shikkhacore.com', config).kind).toBe('invalid');
  });

  it('treats any other valid hostname as a potential custom domain', () => {
    expect(classifyHost('portal.greenfield.edu.bd', config)).toEqual({
      kind: 'custom-domain',
      hostname: 'portal.greenfield.edu.bd',
    });
  });

  it('supports localhost-based development hosts', () => {
    const dev: HostConfig = { baseDomain: 'localhost', rootHosts: ['localhost'], platformHosts: ['admin.localhost'] };
    expect(classifyHost('localhost:3100', dev).kind).toBe('root');
    expect(classifyHost('admin.localhost:3100', dev).kind).toBe('platform');
    expect(classifyHost('riverside.localhost:3100', dev)).toMatchObject({ kind: 'subdomain', slug: 'riverside' });
  });
});

describe('schoolSubdomainUrl', () => {
  it('keeps the scheme and port of the public URL', () => {
    expect(schoolSubdomainUrl('http://localhost:3100', 'localhost', 'greenfield')).toBe(
      'http://greenfield.localhost:3100',
    );
    expect(schoolSubdomainUrl('https://app.shikkhacore.com', 'shikkhacore.com', 'riverside')).toBe(
      'https://riverside.shikkhacore.com',
    );
  });
});
