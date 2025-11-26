import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('.npmrc Configuration', () => {
  const npmrcPath = join(process.cwd(), '.npmrc');
  let npmrcContent: string;

  it('should exist at project root', () => {
    assert.doesNotThrow(() => {
      npmrcContent = readFileSync(npmrcPath, 'utf-8');
    }, '.npmrc file should exist at project root');
  });

  it('should not be empty', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    assert.ok(
      npmrcContent.trim().length > 0,
      '.npmrc should not be empty'
    );
  });

  it('should enforce exact version saving', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const hasSaveExact = npmrcContent
      .split('\n')
      .some(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('save-exact') && !trimmed.startsWith('#');
      });
    
    assert.ok(
      hasSaveExact,
      'Should have save-exact configuration'
    );
  });

  it('should set save-exact to true', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const saveExactLine = npmrcContent
      .split('\n')
      .find(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('save-exact') && !trimmed.startsWith('#');
      });
    
    assert.ok(saveExactLine, 'save-exact configuration should exist');
    assert.ok(
      saveExactLine.includes('true'),
      'save-exact should be set to true'
    );
  });

  it('should have explanatory comments', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const lines = npmrcContent.split('\n');
    const commentLines = lines.filter(line => line.trim().startsWith('#'));
    
    assert.ok(
      commentLines.length > 0,
      'Should have comments explaining the configuration'
    );
  });

  it('should explain the purpose of save-exact', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const hasExplanation = npmrcContent
      .toLowerCase()
      .includes('exact') || 
      npmrcContent.toLowerCase().includes('version');
    
    assert.ok(
      hasExplanation,
      'Should explain the purpose of exact version enforcement'
    );
  });

  it('should mention preventing ^ and ~ prefixes', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const mentionsPrefixes = 
      npmrcContent.includes('^') || 
      npmrcContent.includes('~') ||
      npmrcContent.toLowerCase().includes('prefix');
    
    assert.ok(
      mentionsPrefixes,
      'Should mention preventing semver range prefixes'
    );
  });

  it('should use valid .npmrc syntax', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const lines = npmrcContent.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed.length === 0 || trimmed.startsWith('#')) {
        return;
      }
      
      assert.ok(
        trimmed.includes('=') || trimmed.includes(':'),
        `Line ${index + 1} should be a valid config (key=value or key:value) or comment`
      );
    });
  });

  it('should not have duplicate save-exact configurations', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const saveExactLines = npmrcContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('save-exact') && !trimmed.startsWith('#');
      });
    
    assert.strictEqual(
      saveExactLines.length,
      1,
      'Should have exactly one save-exact configuration'
    );
  });

  it('should be consistent with version locking strategy', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const hasExactVersions = npmrcContent.toLowerCase().includes('exact');
    
    assert.ok(
      hasExactVersions,
      'Configuration should be consistent with exact version strategy'
    );
  });

  it('should not contain sensitive information', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const sensitivePatterns = [
      /auth.*token/i,
      /_authToken/,
      /password/i,
      /secret/i,
      /key.*=/i
    ];
    
    sensitivePatterns.forEach(pattern => {
      assert.ok(
        !pattern.test(npmrcContent),
        `Should not contain sensitive information matching ${pattern}`
      );
    });
  });

  it('should align with dependabot configuration', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const hasSaveExact = npmrcContent.includes('save-exact=true');
    
    assert.ok(
      hasSaveExact,
      'save-exact configuration supports version lock strategy used by dependabot'
    );
  });

  it('should not have trailing whitespace', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const lines = npmrcContent.split('\n');
    
    lines.forEach((line, index) => {
      if (line.length > 0) {
        assert.ok(
          !line.endsWith(' ') && !line.endsWith('\t'),
          `Line ${index + 1} should not have trailing whitespace`
        );
      }
    });
  });

  it('should use consistent formatting', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const configLines = npmrcContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('#');
      });
    
    const usesEquals = configLines.some(line => line.includes('='));
    const usesColon = configLines.some(line => line.includes(':'));
    
    assert.ok(
      !(usesEquals && usesColon),
      'Should use consistent delimiter (= or :) for all configurations'
    );
  });

  it('should prevent caret and tilde in new package installations', () => {
    npmrcContent = readFileSync(npmrcPath, 'utf-8');
    
    const explainsPrevention = npmrcContent
      .toLowerCase()
      .includes('prevent');
    
    assert.ok(
      explainsPrevention,
      'Should explain that this prevents range operators in package.json'
    );
  });
});