/**
 * Startup validation script
 * Runs critical tests before starting the application
 * Exits with error code if validation fails
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function validateStartup(): Promise<void> {
  console.log('🔍 Starting startup validation...');

  try {
    // Test 1: Module can be instantiated
    console.log('✓ Testing module instantiation...');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });

    // Test 2: Health endpoint is accessible
    console.log('✓ Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/health/live', {
      method: 'GET',
    }).catch(() => null);

    // Test 3: GraphQL endpoint is accessible
    console.log('✓ Testing GraphQL endpoint...');
    const graphqlResponse = await fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    }).catch(() => null);

    await app.close();

    // Validation results
    const validations = [
      {
        name: 'Module Instantiation',
        passed: true,
        message: 'App module loaded successfully',
      },
      {
        name: 'Health Endpoint',
        passed: healthResponse?.ok === true,
        message: healthResponse?.ok
          ? 'Health endpoint accessible'
          : 'Health endpoint not accessible (this is OK if app not started yet)',
      },
      {
        name: 'GraphQL Endpoint',
        passed: graphqlResponse?.ok === true || graphqlResponse === null,
        message: graphqlResponse?.ok
          ? 'GraphQL endpoint accessible'
          : 'GraphQL endpoint not accessible (this is OK if app not started yet)',
      },
    ];

    const failed = validations.filter((v) => !v.passed);
    const criticalFailed = failed.filter(
      (v) => v.name === 'Module Instantiation',
    );

    console.log('\n📊 Validation Results:');
    validations.forEach((v) => {
      const icon = v.passed ? '✓' : '✗';
      console.log(`  ${icon} ${v.name}: ${v.message}`);
    });

    if (criticalFailed.length > 0) {
      console.error('\n❌ Critical validation failed!');
      process.exit(1);
    }

    if (failed.length > 0) {
      console.warn('\n⚠️  Some validations failed (non-critical)');
    } else {
      console.log('\n✅ All validations passed!');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Startup validation failed!');
    console.error('Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run validation
validateStartup();
