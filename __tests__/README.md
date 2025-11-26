# Test Suite Documentation

This test suite provides comprehensive validation for the configuration files and documentation added in this branch.

## Overview

The test suite validates three critical files that were added to support the Next.js canary version deployment strategy:

1. **`.github/dependabot.yml`** - Dependabot configuration that prevents automatic updates
2. **`.npmrc`** - npm configuration enforcing exact version installation
3. **`README.md`** - Documentation explaining the deployment strategy

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Configuration file tests only
npm run test:config

# Documentation tests only
npm run test:docs
```

### Run Individual Test Files
```bash
# Dependabot configuration tests
node --test __tests__/config/dependabot.test.ts

# .npmrc configuration tests
node --test __tests__/config/npmrc.test.ts

# README.md documentation tests
node --test __tests__/docs/readme.test.ts
```

## Test Coverage

### 1. Dependabot Configuration Tests (`__tests__/config/dependabot.test.ts`)

**Total Tests: 16**

#### What is Tested:
- ✅ File existence and location
- ✅ Valid YAML syntax and structure
- ✅ Dependabot v2 schema compliance
- ✅ npm package ecosystem configuration
- ✅ Schedule configuration (weekly updates)
- ✅ Next.js update blocking (all semver types)
- ✅ React and react-dom update blocking (major/minor)
- ✅ Consistent ignore patterns across React packages
- ✅ Proper YAML indentation (2 spaces)
- ✅ Descriptive comments explaining rules
- ✅ No invalid configuration keys
- ✅ Valid update-types values

#### Why This Matters:
The Dependabot configuration is critical because:
- Prevents automatic upgrades from Next.js canary to stable versions
- Protects against breaking changes in experimental features
- Ensures version lock strategy is enforced at the dependency management level
- React packages must stay compatible with Next.js canary

### 2. .npmrc Configuration Tests (`__tests__/config/npmrc.test.ts`)

**Total Tests: 15**

#### What is Tested:
- ✅ File existence at project root
- ✅ Non-empty configuration
- ✅ `save-exact=true` setting present
- ✅ Explanatory comments included
- ✅ Purpose of exact version enforcement explained
- ✅ Mention of preventing `^` and `~` prefixes
- ✅ Valid .npmrc syntax
- ✅ No duplicate configurations
- ✅ Consistency with version lock strategy
- ✅ No sensitive information (tokens, passwords)
- ✅ Alignment with Dependabot configuration
- ✅ No trailing whitespace
- ✅ Consistent formatting (= vs :)
- ✅ Prevention of semver range operators

#### Why This Matters:
The .npmrc configuration:
- Enforces exact versions in package.json (no `^` or `~`)
- Works in conjunction with Dependabot to maintain version lock
- Prevents accidental version range specifications during `npm install`
- Ensures reproducible builds across environments

### 3. README Documentation Tests (`__tests__/docs/readme.test.ts`)

**Total Tests: 32**

#### What is Tested:
- ✅ File existence and non-empty content
- ✅ Main title (H1 heading) presence
- ✅ Next.js canary version (15.4.0-canary.47) documented
- ✅ Tech Stack section present
- ✅ Next.js listed with canary version in Tech Stack
- ✅ Important Notes section present
- ✅ Next.js Canary Version subsection present
- ✅ Explanation of why canary is used
- ✅ Experimental features listed (PPR, Client Segment Cache, Node.js Middleware)
- ✅ Version lock warning present
- ✅ Breaking change risks explained
- ✅ Dependabot configuration mentioned
- ✅ Explanation that Dependabot ignores Next.js updates
- ✅ Upgrade instructions provided
- ✅ Instruction to review release notes
- ✅ Link to Next.js releases included
- ✅ Mention of checking experimental feature support
- ✅ Instruction to update next.config.ts
- ✅ Advice to remove unsupported experimental flags
- ✅ Recommendation for local testing before deployment
- ✅ Getting Started section present
- ✅ Valid markdown formatting
- ✅ Consistent heading hierarchy
- ✅ No broken markdown links
- ✅ Code blocks with language identifiers
- ✅ All major tech stack components documented
- ✅ Ordered list for upgrade steps
- ✅ At least 3-4 upgrade steps
- ✅ Comprehensive content (300+ words)
- ✅ No trailing whitespace
- ✅ Canary version mentioned in multiple places

#### Why This Matters:
The README documentation:
- Provides critical context for future developers
- Explains the rationale behind the version lock strategy
- Gives clear upgrade instructions to prevent breaking changes
- Documents the experimental features being leveraged
- Helps maintain project stability during handoffs

## Test Technology Stack

- **Test Runner**: Node.js native test runner (Node v18+)
- **Assertion Library**: Node.js `assert` module
- **YAML Parser**: `yaml` package (v2.6.1)
- **TypeScript**: Tests written in TypeScript for type safety

## Why Node.js Native Test Runner?

We chose Node.js native test runner because:
- ✅ No additional test framework dependencies needed
- ✅ Native support in Node v18+ (project uses v24.3.0)
- ✅ Fast execution with minimal overhead
- ✅ Built-in TypeScript support
- ✅ Simple and maintainable
- ✅ Perfect for configuration validation tests

## Test Design Philosophy

### 1. Configuration as Code
These tests treat configuration files as first-class code that needs validation:
- Syntax validation (YAML, key-value pairs)
- Schema validation (correct structure)
- Semantic validation (correct values and relationships)
- Documentation validation (comments explaining decisions)

### 2. Fail-Fast Principle
Tests are designed to catch configuration errors immediately:
- Before deployment
- Before Dependabot runs
- Before developers accidentally upgrade dependencies

### 3. Living Documentation
The tests serve as executable documentation:
- They explain what each configuration does
- They document the relationships between configurations
- They encode the project's deployment strategy

## Common Issues and Solutions

### Issue: Tests fail with "Cannot find module 'yaml'"
**Solution**: Run `npm install` to install the `yaml` dependency

### Issue: Tests fail with TypeScript errors
**Solution**: Ensure TypeScript is installed: `npm install typescript`

### Issue: File not found errors
**Solution**: Run tests from project root directory

### Issue: YAML parsing errors
**Solution**: Check YAML file indentation (must be 2 spaces)

## Maintenance Guidelines

### When to Update Tests

1. **When adding new Dependabot ignore rules**
   - Update `dependabot.test.ts` to verify new rules
   - Add tests for the specific dependency being ignored

2. **When modifying .npmrc**
   - Update `npmrc.test.ts` to validate new settings
   - Ensure new settings align with version lock strategy

3. **When updating README**
   - Update `readme.test.ts` if structure changes
   - Add tests for new critical information sections

### Test Maintenance Checklist

- [ ] Tests should be updated when configuration changes
- [ ] New configuration options should have corresponding tests
- [ ] Test descriptions should be clear and specific
- [ ] Tests should not duplicate validation (DRY principle)
- [ ] Failed tests should provide actionable error messages

## Continuous Integration

To integrate these tests into CI/CD:

### GitHub Actions Example
```yaml
name: Validate Configuration
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '24'
      - run: npm install
      - run: npm test
```

## Future Enhancements

Potential additions to the test suite:

1. **Integration Tests**
   - Verify Dependabot actually ignores specified packages
   - Test that `npm install` respects .npmrc settings

2. **Link Validation**
   - Check that all external links in README are accessible
   - Validate GitHub release link is correct

3. **Version Consistency**
   - Cross-reference Next.js version across all files
   - Ensure package.json matches README documentation

4. **Schema Validation**
   - Use JSON schema to validate Dependabot config
   - Validate against official Dependabot v2 schema

## Contributing

When contributing new tests:

1. Follow the existing test structure
2. Use descriptive test names that explain what is being validated
3. Include comments explaining why the validation matters
4. Keep tests focused and atomic (one assertion per concept)
5. Ensure tests fail for the right reasons

## Summary

This test suite provides **63 comprehensive test cases** across **3 test files**, ensuring that:
- Configuration files are syntactically valid
- Version lock strategy is properly enforced
- Documentation accurately reflects the deployment strategy
- Future developers understand the rationale behind decisions

**Total Coverage**: 100% of changed files in this branch have comprehensive validation tests.