import { describe, expect, it } from '@jest/globals';

import { classifyHost, normalizeHostname, schoolSubdomainUrl, type HostConfig } from './host.js';

const config: HostConfig = {
  baseDomain: 'eduflow.com',
  rootHosts: ['app.eduflow.com'],
  platformHosts: ['admin.eduflow.com'],
};

describe('normalizeHostname', () => {
  it('lowercases and strips the port and trailing dot', () => {
    expect(normalizeHostname('Greenfield.EduFlow.com:3100')).toBe('greenfield.eduflow.com');
    expect(normalizeHostname('greenfield.eduflow.com.')).toBe('greenfield.eduflow.com');
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
    expect(classifyHost('admin.eduflow.com', config).kind).toBe('platform');
    expect(classifyHost('app.eduflow.com:443', config).kind).toBe('root');
  });

  it('extracts the school slug from a single-label subdomain', () => {
    expect(classifyHost('greenfield.eduflow.com', config)).toEqual({
      kind: 'subdomain',
      hostname: 'greenfield.eduflow.com',
      slug: 'greenfield',
    });
  });

  it('never treats reserved labels, nested subdomains or the bare domain as schools', () => {
    expect(classifyHost('www.eduflow.com', config).kind).toBe('invalid');
    expect(classifyHost('api.eduflow.com', config).kind).toBe('invalid');
    expect(classifyHost('a.greenfield.eduflow.com', config).kind).toBe('invalid');
    expect(classifyHost('eduflow.com', config).kind).toBe('invalid');
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
    expect(schoolSubdomainUrl('https://app.eduflow.com', 'eduflow.com', 'riverside')).toBe(
      'https://riverside.eduflow.com',
    );
  });
});
