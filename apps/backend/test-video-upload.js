#!/usr/bin/env node

/**
 * Video Upload Test Suite
 * Run: node test-video-upload.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:4000';
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN || 'renunganku-internal-dev-token';
let AUTH_TOKEN = '';
let testResults = [];
let testVideoIds = [];

// Colors for console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logTest = (testNum, name, status, duration, reason = '') => {
  const icon = status === 'PASS' ? '✅' : '❌';
  const color = status === 'PASS' ? 'green' : 'red';
  const durationStr = duration ? ` (${duration}ms)` : '';
  log(`${icon} Test ${testNum}: ${name} — ${status}${durationStr}`, color);
  if (reason) log(`   Reason: ${reason}`, 'yellow');
  
  testResults.push({ testNum, name, status, duration, reason });
};

// Helper: Create test video
const createTestVideo = (filename, durationSec = 5, width = 640, height = 480) => {
  const filepath = path.join(__dirname, filename);
  try {
    execSync(
      `ffmpeg -f lavfi -i testsrc=duration=${durationSec}:size=${width}x${height}:rate=30 ` +
      `-f lavfi -i sine=frequency=1000:duration=${durationSec} ` +
      `-c:v libx264 -preset ultrafast -c:a aac -y ${filepath}`,
      { stdio: 'ignore' }
    );
    return filepath;
  } catch (e) {
    log(`Failed to create test video: ${e.message}`, 'red');
    return null;
  }
};

// Helper: Create corrupt video
const createCorruptVideo = (filename, sizeMB = 5) => {
  const filepath = path.join(__dirname, filename);
  const buffer = Buffer.alloc(sizeMB * 1024 * 1024, 'corrupt');
  fs.writeFileSync(filepath, buffer);
  return filepath;
};

// Helper: Create large file
const createLargeFile = (filename, sizeMB) => {
  const filepath = path.join(__dirname, filename);
  const buffer = Buffer.alloc(sizeMB * 1024 * 1024, 0);
  fs.writeFileSync(filepath, buffer);
  return filepath;
};

// Helper: Wait for video ready
const waitForVideoReady = async (videoId, maxWaitMs = 15 * 60 * 1000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await axios.get(`${API_URL}/videos/${videoId}/status`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });

      if (response.data.status === 'ready') {
        return response.data;
      }
      if (response.data.status === 'failed') {
        throw new Error('Video processing failed');
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
      if (e.response?.status === 404) {
        throw new Error('Video not found');
      }
      throw e;
    }
  }
  throw new Error('Timeout waiting for video');
};

// Helper: Check temp files
const checkTempFiles = () => {
  try {
    const files = fs.readdirSync('/tmp');
    return files.filter(f => 
      f.startsWith('upload-') || 
      f.startsWith('compressed-') || 
      f.startsWith('thumb-')
    );
  } catch (e) {
    return [];
  }
};

// Helper: Upload video
const uploadVideo = async (filepath, title = 'Test Video') => {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('video', fs.createReadStream(filepath));
  form.append('title', title);

  return axios.post(`${API_URL}/videos/upload`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'x-internal-api-token': INTERNAL_API_TOKEN,
    },
  });
};

// Setup: Get auth token
const setup = async () => {
  log('\n🔧 Setup: Creating test user and getting auth token...', 'blue');
  
  try {
    const email = `test-video-${Date.now()}@example.com`;
    const password = 'Test123456!';
    const username = `testuser${Date.now()}`;

    const response = await axios.post(`${API_URL}/auth/signup`, {
      email,
      password,
      username,
    }, {
      headers: {
        'x-internal-api-token': INTERNAL_API_TOKEN,
      },
    });

    AUTH_TOKEN = response.data.accessToken || response.data.token;
    log('✅ Auth token obtained', 'green');
  } catch (e) {
    log(`❌ Failed to get auth token: ${e.message}`, 'red');
    log('   Make sure the server is running and auth endpoint is correct', 'yellow');
    process.exit(1);
  }
};

// Cleanup
const cleanup = () => {
  log('\n🧹 Cleanup: Removing test files...', 'blue');
  const testFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('test-video-'));
  testFiles.forEach(f => {
    try {
      fs.unlinkSync(path.join(__dirname, f));
    } catch (e) {}
  });
};

// 🟢 EASY Tests
const runEasyTests = async () => {
  log('\n🟢 EASY — Validasi Dasar', 'green');

  // Test 1
  try {
    const startTime = Date.now();
    const videoPath = createTestVideo('test-video-1.mp4', 5);
    if (!videoPath) throw new Error('Failed to create test video');

    const response = await uploadVideo(videoPath, 'Test Video 1');
    const duration = Date.now() - startTime;

    if (response.status === 201 && response.data.id && response.data.status === 'processing' && duration < 2000) {
      logTest(1, 'Upload video valid', 'PASS', duration);
      testVideoIds.push(response.data.id);
    } else {
      logTest(1, 'Upload video valid', 'FAIL', duration, `Status: ${response.status}, Duration: ${duration}ms`);
    }

    fs.unlinkSync(videoPath);
  } catch (e) {
    logTest(1, 'Upload video valid', 'FAIL', null, e.message);
  }

  // Test 2
  try {
    if (testVideoIds.length === 0) throw new Error('No video ID from Test 1');

    const response = await axios.get(`${API_URL}/videos/${testVideoIds[0]}/status`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });

    if (response.data.status === 'processing' && response.data.progress >= 0) {
      logTest(2, 'Polling status processing', 'PASS');
    } else {
      logTest(2, 'Polling status processing', 'FAIL', null, `Status: ${response.data.status}, Progress: ${response.data.progress}`);
    }
  } catch (e) {
    logTest(2, 'Polling status processing', 'FAIL', null, e.message);
  }

  // Test 3
  try {
    // Create new user
    const newUserResponse = await axios.post(`${API_URL}/auth/signup`, {
      email: `test-empty-${Date.now()}@example.com`,
      password: 'Test123456!',
      username: `testempty${Date.now()}`,
    });

    const newToken = newUserResponse.data.accessToken || newUserResponse.data.token;

    const response = await axios.get(`${API_URL}/videos`, {
      headers: { Authorization: `Bearer ${newToken}` },
    });

    if (Array.isArray(response.data) && response.data.length === 0) {
      logTest(3, 'List video kosong', 'PASS');
    } else {
      logTest(3, 'List video kosong', 'FAIL', null, `Expected empty array, got: ${JSON.stringify(response.data)}`);
    }
  } catch (e) {
    logTest(3, 'List video kosong', 'FAIL', null, e.message);
  }

  // Test 4
  try {
    const response = await axios.get(`${API_URL}/videos/queue/stats`);

    if (
      typeof response.data.waiting === 'number' &&
      typeof response.data.active === 'number' &&
      typeof response.data.completed === 'number' &&
      typeof response.data.failed === 'number'
    ) {
      logTest(4, 'Queue stats berjalan', 'PASS');
    } else {
      logTest(4, 'Queue stats berjalan', 'FAIL', null, `Invalid stats: ${JSON.stringify(response.data)}`);
    }
  } catch (e) {
    logTest(4, 'Queue stats berjalan', 'FAIL', null, e.message);
  }
};

// 🟡 MEDIUM Tests
const runMediumTests = async () => {
  log('\n🟡 MEDIUM — Validasi Error & Edge Case', 'yellow');

  // Test 5
  try {
    const largePath = createLargeFile('test-video-large.mp4', 101);

    try {
      await uploadVideo(largePath);
      logTest(5, 'Upload file > 100MB', 'FAIL', null, 'Should have been rejected');
    } catch (e) {
      if (e.response?.status === 400 && e.response.data.message.includes('100MB') && e.response.data.message.includes('101')) {
        const tempFiles = checkTempFiles();
        if (tempFiles.length === 0) {
          logTest(5, 'Upload file > 100MB', 'PASS');
        } else {
          logTest(5, 'Upload file > 100MB', 'FAIL', null, `Temp files not cleaned: ${tempFiles.join(', ')}`);
        }
      } else {
        logTest(5, 'Upload file > 100MB', 'FAIL', null, e.message);
      }
    }

    fs.unlinkSync(largePath);
  } catch (e) {
    logTest(5, 'Upload file > 100MB', 'FAIL', null, e.message);
  }

  // Test 6
  try {
    const aviPath = path.join(__dirname, 'test-video.avi');
    fs.writeFileSync(aviPath, Buffer.alloc(1024, 0));

    try {
      await uploadVideo(aviPath);
      logTest(6, 'Upload format tidak valid', 'FAIL', null, 'Should have been rejected');
    } catch (e) {
      if (e.response?.status === 400 && e.response.data.message.includes('mp4')) {
        logTest(6, 'Upload format tidak valid', 'PASS');
      } else {
        logTest(6, 'Upload format tidak valid', 'FAIL', null, e.message);
      }
    }

    fs.unlinkSync(aviPath);
  } catch (e) {
    logTest(6, 'Upload format tidak valid', 'FAIL', null, e.message);
  }

  // Test 7
  try {
    const jpgPath = path.join(__dirname, 'test-image.jpg');
    fs.writeFileSync(jpgPath, Buffer.alloc(1024, 0));

    try {
      await uploadVideo(jpgPath);
      logTest(7, 'Upload file bukan video', 'FAIL', null, 'Should have been rejected');
    } catch (e) {
      if (e.response?.status === 400) {
        logTest(7, 'Upload file bukan video', 'PASS');
      } else {
        logTest(7, 'Upload file bukan video', 'FAIL', null, e.message);
      }
    }

    fs.unlinkSync(jpgPath);
  } catch (e) {
    logTest(7, 'Upload file bukan video', 'FAIL', null, e.message);
  }

  // Test 8
  try {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    try {
      await axios.get(`${API_URL}/videos/${fakeId}/status`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });
      logTest(8, 'Get status video tidak ada', 'FAIL', null, 'Should return 404');
    } catch (e) {
      if (e.response?.status === 404) {
        logTest(8, 'Get status video tidak ada', 'PASS');
      } else {
        logTest(8, 'Get status video tidak ada', 'FAIL', null, `Expected 404, got ${e.response?.status}`);
      }
    }
  } catch (e) {
    logTest(8, 'Get status video tidak ada', 'FAIL', null, e.message);
  }

  // Test 9
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('title', 'No video');

    try {
      await axios.post(`${API_URL}/videos/upload`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      logTest(9, 'Upload tanpa file', 'FAIL', null, 'Should return 400');
    } catch (e) {
      if (e.response?.status === 400) {
        logTest(9, 'Upload tanpa file', 'PASS');
      } else {
        logTest(9, 'Upload tanpa file', 'FAIL', null, `Expected 400, got ${e.response?.status}`);
      }
    }
  } catch (e) {
    logTest(9, 'Upload tanpa file', 'FAIL', null, e.message);
  }

  // Test 10
  try {
    const videoPath = createTestVideo('test-video-noauth.mp4', 3);
    if (!videoPath) throw new Error('Failed to create test video');

    const FormData = require('form-data');
    const form = new FormData();
    form.append('video', fs.createReadStream(videoPath));

    try {
      await axios.post(`${API_URL}/videos/upload`, form, {
        headers: form.getHeaders(),
      });
      logTest(10, 'Upload tanpa auth token', 'FAIL', null, 'Should return 401');
    } catch (e) {
      if (e.response?.status === 401) {
        logTest(10, 'Upload tanpa auth token', 'PASS');
      } else {
        logTest(10, 'Upload tanpa auth token', 'FAIL', null, `Expected 401, got ${e.response?.status}`);
      }
    }

    fs.unlinkSync(videoPath);
  } catch (e) {
    logTest(10, 'Upload tanpa auth token', 'FAIL', null, e.message);
  }
};

// Print final report
const printReport = () => {
  log('\n📊 Test Report', 'blue');
  log('='.repeat(80), 'blue');

  const passed = testResults.filter(t => t.status === 'PASS').length;
  const failed = testResults.filter(t => t.status === 'FAIL').length;
  const total = testResults.length;

  log(`\nTotal: ${total} tests`, 'blue');
  log(`Passed: ${passed} tests`, 'green');
  log(`Failed: ${failed} tests`, 'red');
  log(`Success Rate: ${((passed / total) * 100).toFixed(2)}%\n`, 'blue');

  if (failed > 0) {
    log('Failed Tests:', 'red');
    testResults.filter(t => t.status === 'FAIL').forEach(t => {
      log(`  - Test ${t.testNum}: ${t.name}`, 'red');
      if (t.reason) log(`    ${t.reason}`, 'yellow');
    });
  }
};

// Main
const main = async () => {
  log('🚀 Video Upload Test Suite', 'blue');
  log('='.repeat(80), 'blue');

  await setup();
  await runEasyTests();
  await runMediumTests();
  
  log('\n⚠️  HARD and EXTREME tests require longer execution time', 'yellow');
  log('⚠️  Run them manually or uncomment in the script', 'yellow');

  cleanup();
  printReport();
};

main().catch(e => {
  log(`\n❌ Fatal error: ${e.message}`, 'red');
  process.exit(1);
});
