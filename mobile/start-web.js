#!/usr/bin/env node
process.env.EXPO_STATE_DIR = __dirname + '/.expo';
process.env.EXPO_NO_TELEMETRY = '1';
process.env.CI = '1';

const { spawn } = require('child_process');

console.log('Starting Expo Web Server...');
const expoProcess = spawn('npx', ['expo', 'start', '--web', '--port', '3000'], {
  cwd: __dirname,
  env: {
    ...process.env,
    EXPO_STATE_DIR: __dirname + '/.expo',
    EXPO_NO_TELEMETRY: '1',
    CI: '1',
  },
});

expoProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

expoProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

expoProcess.on('close', (code) => {
  console.log(`Expo process exited with code ${code}`);
});
