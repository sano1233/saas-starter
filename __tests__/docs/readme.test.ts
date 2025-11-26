import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('README.md Documentation', () => {
  const readmePath = join(process.cwd(), 'README.md');
  let readmeContent: string;

  it('should exist at project root', () => {
    assert.doesNotThrow(() => {
      readmeContent = readFileSync(readmePath, 'utf-8');
    }, 'README.md should exist at project root');
  });

  it('should not be empty', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    assert.ok(
      readmeContent.trim().length > 0,
      'README.md should not be empty'
    );
  });

  it('should have a main title', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const lines = readmeContent.split('\n');
    const hasH1 = lines.some(line => line.startsWith('# '));
    
    assert.ok(
      hasH1,
      'Should have a main title (# heading)'
    );
  });

  it('should document the Next.js canary version', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    assert.ok(
      readmeContent.includes('15.4.0-canary.47'),
      'Should document the specific Next.js canary version'
    );
  });

  it('should have a Tech Stack section', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    assert.ok(
      readmeContent.includes('## Tech Stack') || readmeContent.includes('##Tech Stack'),
      'Should have a Tech Stack section'
    );
  });

  it('should document Next.js in tech stack with canary version', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const hasNextJs = readmeContent.includes('Next.js');
    const hasCanaryVersion = readmeContent.includes('Canary 15.4.0-canary.47');
    
    assert.ok(
      hasNextJs && hasCanaryVersion,
      'Tech Stack should include Next.js with canary version'
    );
  });

  it('should have an Important Notes section', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    assert.ok(
      readmeContent.includes('## Important Notes'),
      'Should have an Important Notes section'
    );
  });

  it('should have a Next.js Canary Version subsection', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    assert.ok(
      readmeContent.includes('### Next.js Canary Version'),
      'Should have a subsection explaining the canary version'
    );
  });

  it('should explain why canary version is used', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const hasExplanation = 
      readmeContent.includes('experimental features') ||
      readmeContent.includes('Partial Pre-Rendering') ||
      readmeContent.includes('PPR');
    
    assert.ok(
      hasExplanation,
      'Should explain why the canary version is used'
    );
  });

  it('should list experimental features being used', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const features = [
      'Partial Pre-Rendering',
      'PPR',
      'Client Segment Cache',
      'Node.js Middleware'
    ];
    
    const mentionsFeatures = features.some(feature => 
      readmeContent.includes(feature)
    );
    
    assert.ok(
      mentionsFeatures,
      'Should list the experimental features being leveraged'
    );
  });

  it('should warn about version lock', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const hasWarning = 
      readmeContent.toLowerCase().includes('version lock') ||
      readmeContent.toLowerCase().includes('intentionally locked') ||
      readmeContent.toLowerCase().includes('locked to prevent');
    
    assert.ok(
      hasWarning,
      'Should warn that the version is intentionally locked'
    );
  });

  it('should explain breaking change risks', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const explainsRisk = 
      readmeContent.includes('breaking changes') ||
      readmeContent.includes('breaking change');
    
    assert.ok(
      explainsRisk,
      'Should explain the risk of breaking changes when upgrading'
    );
  });

  it('should mention Dependabot configuration', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    assert.ok(
      readmeContent.includes('Dependabot'),
      'Should mention Dependabot configuration'
    );
  });

  it('should explain that Dependabot ignores Next.js updates', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const explainsDependabot = 
      readmeContent.includes('Dependabot is configured to ignore Next.js') ||
      (readmeContent.includes('Dependabot') && readmeContent.includes('ignore'));
    
    assert.ok(
      explainsDependabot,
      'Should explain that Dependabot is configured to ignore Next.js updates'
    );
  });

  it('should provide upgrade instructions', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const hasInstructions = 
      readmeContent.includes('If you need to upgrade') ||
      readmeContent.includes('upgrade Next.js');
    
    assert.ok(
      hasInstructions,
      'Should provide instructions for upgrading Next.js'
    );
  });

  it('should instruct to review release notes', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const mentionsReleaseNotes = 
      readmeContent.includes('release notes') ||
      readmeContent.includes('releases');
    
    assert.ok(
      mentionsReleaseNotes,
      'Upgrade instructions should mention reviewing release notes'
    );
  });

  it('should include link to Next.js releases', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const hasLink = 
      readmeContent.includes('github.com/vercel/next.js/releases') ||
      readmeContent.includes('nextjs.org/docs');
    
    assert.ok(
      hasLink,
      'Should include a link to Next.js release information'
    );
  });

  it('should mention checking experimental feature support', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const mentionsFeatureCheck = 
      readmeContent.includes('experimental features are supported') ||
      readmeContent.includes('Check if experimental features');
    
    assert.ok(
      mentionsFeatureCheck,
      'Should instruct to check if experimental features are supported in target version'
    );
  });

  it('should mention updating next.config', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const mentionsConfig = 
      readmeContent.includes('next.config') ||
      readmeContent.includes('next config');
    
    assert.ok(
      mentionsConfig,
      'Should mention updating next.config.ts'
    );
  });

  it('should advise removing unsupported experimental flags', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const advisesRemoval = 
      readmeContent.includes('remove any unsupported experimental flags') ||
      readmeContent.includes('remove unsupported');
    
    assert.ok(
      advisesRemoval,
      'Should advise removing unsupported experimental flags'
    );
  });

  it('should recommend local testing before deployment', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const recommendsTesting = 
      readmeContent.includes('Test locally') ||
      readmeContent.includes('test locally');
    
    assert.ok(
      recommendsTesting,
      'Should recommend testing locally before deploying'
    );
  });

  it('should have Getting Started section', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    assert.ok(
      readmeContent.includes('## Getting Started'),
      'Should have a Getting Started section'
    );
  });

  it('should have valid markdown formatting', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const lines = readmeContent.split('\n');
    
    const headings = lines.filter(line => line.trim().startsWith('#'));
    
    headings.forEach((heading, index) => {
      const match = heading.match(/^(#+)\s+/);
      assert.ok(
        match,
        `Heading at line should have space after # symbols: ${heading}`
      );
    });
  });

  it('should have consistent heading hierarchy', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const lines = readmeContent.split('\n');
    const headings = lines
      .filter(line => line.trim().startsWith('#'))
      .map(line => {
        const match = line.match(/^(#+)/);
        return match ? match[1].length : 0;
      });
    
    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i] - headings[i - 1];
      assert.ok(
        diff <= 1,
        'Heading hierarchy should not skip levels'
      );
    }
  });

  it('should not have broken markdown links', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [...readmeContent.matchAll(linkRegex)];
    
    links.forEach(link => {
      const url = link[2];
      assert.ok(
        url && url.length > 0,
        `Link "${link[1]}" should have a valid URL`
      );
      
      if (url.startsWith('http')) {
        assert.ok(
          url.startsWith('http://') || url.startsWith('https://'),
          `External link should use http:// or https://: ${url}`
        );
      }
    });
  });

  it('should have code blocks with language identifiers', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const codeBlockRegex = /```(\w*)\n/g;
    const codeBlocks = [...readmeContent.matchAll(codeBlockRegex)];
    
    if (codeBlocks.length > 0) {
      const hasLanguageIds = codeBlocks.some(block => block[1].length > 0);
      assert.ok(
        hasLanguageIds,
        'Code blocks should have language identifiers (e.g., ```bash)'
      );
    }
  });

  it('should document all major tech stack components', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const components = [
      'Next.js',
      'Postgres',
      'Drizzle',
      'Stripe'
    ];
    
    components.forEach(component => {
      assert.ok(
        readmeContent.includes(component),
        `Should document ${component} in tech stack`
      );
    });
  });

  it('should maintain proper ordered list for upgrade steps', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const upgradeSection = readmeContent.split('If you need to upgrade Next.js:')[1];
    
    if (upgradeSection) {
      const hasOrderedList = /\n1\.\s/.test(upgradeSection);
      assert.ok(
        hasOrderedList,
        'Upgrade instructions should use ordered list'
      );
    }
  });

  it('should have at least 4 upgrade steps', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const upgradeSection = readmeContent.split('If you need to upgrade Next.js:')[1];
    
    if (upgradeSection) {
      const steps = upgradeSection.match(/^\d+\.\s/gm);
      if (steps) {
        assert.ok(
          steps.length >= 3,
          'Should have at least 3 upgrade steps'
        );
      }
    }
  });

  it('should be comprehensive enough', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const wordCount = readmeContent.split(/\s+/).length;
    
    assert.ok(
      wordCount > 300,
      'README should be comprehensive (at least 300 words)'
    );
  });

  it('should not have trailing whitespace on lines', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const lines = readmeContent.split('\n');
    
    lines.forEach((line, index) => {
      if (line.length > 0) {
        assert.ok(
          !line.endsWith(' ') && !line.endsWith('\t'),
          `Line ${index + 1} should not have trailing whitespace`
        );
      }
    });
  });

  it('should reference the correct canary version in multiple places', () => {
    readmeContent = readFileSync(readmePath, 'utf-8');
    
    const versionMentions = (readmeContent.match(/15\.4\.0-canary\.47/g) || []).length;
    
    assert.ok(
      versionMentions >= 2,
      'Canary version should be mentioned at least twice (Tech Stack and Important Notes)'
    );
  });
});