#!/usr/bin/env node
process.env.EXPO_STATE_DIR = __dirname + '/.expo';

const { execSync } = require('child_process');

try {
  console.log('Starting Expo Web Server...');
  execSync('npx expo start --web', {
    cwd: __dirname,
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_STATE_DIR: __dirname + '/.expo',
    },
  });
} catch (error) {
  console.error('Error starting Expo:', error);
  process.exit(1);
}
