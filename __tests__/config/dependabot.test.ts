import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Dependabot Configuration', () => {
  const dependabotPath = join(process.cwd(), '.github', 'dependabot.yml');
  let dependabotContent: string;
  let dependabotConfig: any;

  it('should exist at .github/dependabot.yml', () => {
    assert.doesNotThrow(() => {
      dependabotContent = readFileSync(dependabotPath, 'utf-8');
    }, 'Dependabot configuration file should exist');
  });

  it('should be valid YAML format', async () => {
    const yaml = await import('yaml');
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    
    assert.doesNotThrow(() => {
      dependabotConfig = yaml.parse(dependabotContent);
    }, 'Should be valid YAML syntax');
    
    assert.ok(dependabotConfig, 'Should parse to a valid object');
  });

  it('should have version 2 schema', async () => {
    const yaml = await import('yaml');
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    dependabotConfig = yaml.parse(dependabotContent);
    
    assert.strictEqual(
      dependabotConfig.version,
      2,
      'Should use Dependabot v2 schema'
    );
  });

  it('should have updates configuration', async () => {
    const yaml = await import('yaml');
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    dependabotConfig = yaml.parse(dependabotContent);
    
    assert.ok(
      Array.isArray(dependabotConfig.updates),
      'Should have updates array'
    );
    assert.ok(
      dependabotConfig.updates.length > 0,
      'Should have at least one update configuration'
    );
  });

  it('should configure npm package ecosystem', async () => {
    const yaml = await import('yaml');
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    dependabotConfig = yaml.parse(dependabotContent);
    
    const npmUpdate = dependabotConfig.updates.find(
      (update: any) => update['package-ecosystem'] === 'npm'
    );
    
    assert.ok(npmUpdate, 'Should have npm package ecosystem configured');
    assert.strictEqual(
      npmUpdate.directory,
      '/',
      'Should monitor root directory'
    );
  });

  it('should have a valid schedule configuration', async () => {
    const yaml = await import('yaml');
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    dependabotConfig = yaml.parse(dependabotContent);
    
    const npmUpdate = dependabotConfig.updates[0];
    
    assert.ok(npmUpdate.schedule, 'Should have schedule configured');
    assert.ok(
      npmUpdate.schedule.interval,
      'Should have schedule interval'
    );
    
    const validIntervals = ['daily', 'weekly', 'monthly'];
    assert.ok(
      validIntervals.includes(npmUpdate.schedule.interval),
      `Schedule interval should be one of: ${validIntervals.join(', ')}`
    );
  });

  it('should ignore Next.js updates to prevent breaking changes', async () => {
    const yaml = await import('yaml');
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    dependabotConfig = yaml.parse(dependabotContent);
    
    const npmUpdate = dependabotConfig.updates[0];
    
    assert.ok(
      Array.isArray(npmUpdate.ignore),
      'Should have ignore configuration'
    );
    
    const nextIgnore = npmUpdate.ignore.find(
      (ignore: any) => ignore['dependency-name'] === 'next'
    );
    
    assert.ok(
      nextIgnore,
      'Should ignore Next.js updates'
    );
    
    assert.ok(
      Array.isArray(nextIgnore['update-types']),
      'Should specify update types to ignore'
    );
    
    const expectedTypes = [
      'version-update:semver-major',
      'version-update:semver-minor',
      'version-update:semver-patch'
    ];
    
    expectedTypes.forEach(type => {
      assert.ok(
        nextIgnore['update-types'].includes(type),
        `Should ignore ${type} for Next.js`
      );
    });
  });

  it('should ignore React updates', async () => {
    const yaml = await import('yaml');
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    dependabotConfig = yaml.parse(dependabotContent);
    
    const npmUpdate = dependabotConfig.updates[0];
    
    const reactIgnore = npmUpdate.ignore.find(
      (ignore: any) => ignore['dependency-name'] === 'react'
    );
    
    assert.ok(
      reactIgnore,
      'Should ignore React updates'
    );
    
    assert.ok(
      reactIgnore['update-types'].includes('version-update:semver-major'),
      'Should ignore major React updates'
    );
    
    assert.ok(
      reactIgnore['update-types'].includes('version-update:semver-minor'),
      'Should ignore minor React updates'
    );
  });

  it('should ignore react-dom updates', async () => {
    const yaml = await import('yaml');
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    dependabotConfig = yaml.parse(dependabotContent);
    
    const npmUpdate = dependabotConfig.updates[0];
    
    const reactDomIgnore = npmUpdate.ignore.find(
      (ignore: any) => ignore['dependency-name'] === 'react-dom'
    );
    
    assert.ok(
      reactDomIgnore,
      'Should ignore react-dom updates'
    );
    
    assert.ok(
      reactDomIgnore['update-types'].includes('version-update:semver-major'),
      'Should ignore major react-dom updates'
    );
    
    assert.ok(
      reactDomIgnore['update-types'].includes('version-update:semver-minor'),
      'Should ignore minor react-dom updates'
    );
  });

  it('should have consistent ignore patterns for React packages', async () => {
    const yaml = await import('yaml');
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    dependabotConfig = yaml.parse(dependabotContent);
    
    const npmUpdate = dependabotConfig.updates[0];
    
    const reactIgnore = npmUpdate.ignore.find(
      (ignore: any) => ignore['dependency-name'] === 'react'
    );
    
    const reactDomIgnore = npmUpdate.ignore.find(
      (ignore: any) => ignore['dependency-name'] === 'react-dom'
    );
    
    assert.deepStrictEqual(
      reactIgnore['update-types'].sort(),
      reactDomIgnore['update-types'].sort(),
      'React and react-dom should have consistent ignore patterns'
    );
  });

  it('should not allow patch updates for Next.js', async () => {
    const yaml = await import('yaml');
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    dependabotConfig = yaml.parse(dependabotContent);
    
    const npmUpdate = dependabotConfig.updates[0];
    
    const nextIgnore = npmUpdate.ignore.find(
      (ignore: any) => ignore['dependency-name'] === 'next'
    );
    
    assert.ok(
      nextIgnore['update-types'].includes('version-update:semver-patch'),
      'Should ignore even patch updates for Next.js canary version'
    );
  });

  it('should have valid YAML indentation', () => {
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    
    const lines = dependabotContent.split('\n');
    
    lines.forEach((line, index) => {
      if (line.trim().length > 0 && !line.trim().startsWith('#')) {
        const leadingSpaces = line.match(/^ */)?.[0].length || 0;
        
        assert.strictEqual(
          leadingSpaces % 2,
          0,
          `Line ${index + 1} should use 2-space indentation (found ${leadingSpaces} spaces)`
        );
      }
    });
  });

  it('should have descriptive comments explaining ignore rules', () => {
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    
    const lines = dependabotContent.split('\n');
    const commentLines = lines.filter(line => line.trim().startsWith('#'));
    
    assert.ok(
      commentLines.length >= 2,
      'Should have comments explaining the ignore configuration'
    );
    
    const hasNextJsComment = commentLines.some(line =>
      line.toLowerCase().includes('next') || line.toLowerCase().includes('canary')
    );
    
    assert.ok(
      hasNextJsComment,
      'Should have comment explaining Next.js ignore rule'
    );
    
    const hasReactComment = commentLines.some(line =>
      line.toLowerCase().includes('react')
    );
    
    assert.ok(
      hasReactComment,
      'Should have comment explaining React ignore rule'
    );
  });

  it('should not have syntax errors or invalid keys', async () => {
    const yaml = await import('yaml');
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    dependabotConfig = yaml.parse(dependabotContent);
    
    const validTopLevelKeys = ['version', 'updates', 'registries', 'enable-beta-ecosystems'];
    const actualKeys = Object.keys(dependabotConfig);
    
    actualKeys.forEach(key => {
      assert.ok(
        validTopLevelKeys.includes(key),
        `Invalid top-level key: ${key}. Valid keys are: ${validTopLevelKeys.join(', ')}`
      );
    });
  });

  it('should have valid update-types values', async () => {
    const yaml = await import('yaml');
    dependabotContent = readFileSync(dependabotPath, 'utf-8');
    dependabotConfig = yaml.parse(dependabotContent);
    
    const npmUpdate = dependabotConfig.updates[0];
    
    const validUpdateTypes = [
      'version-update:semver-major',
      'version-update:semver-minor',
      'version-update:semver-patch'
    ];
    
    npmUpdate.ignore.forEach((ignore: any) => {
      ignore['update-types'].forEach((type: string) => {
        assert.ok(
          validUpdateTypes.includes(type),
          `Invalid update-type: ${type}. Valid types are: ${validUpdateTypes.join(', ')}`
        );
      });
    });
  });
});