#!/usr/bin/env node
const Bull = require('bull');

const videoQueue = new Bull('video-processing', {
  redis: { host: 'localhost', port: 6379 },
});

async function monitorJobs() {
  console.log('📊 Monitoring Bull Queue...\n');

  const [waiting, active, completed, failed] = await Promise.all([
    videoQueue.getWaitingCount(),
    videoQueue.getActiveCount(),
    videoQueue.getCompletedCount(),
    videoQueue.getFailedCount(),
  ]);

  console.log(`Queue Stats:`);
  console.log(`  Waiting: ${waiting}`);
  console.log(`  Active: ${active}`);
  console.log(`  Completed: ${completed}`);
  console.log(`  Failed: ${failed}\n`);

  if (failed > 0) {
    const failedJobs = await videoQueue.getFailed(0, 5);
    console.log(`Failed Jobs:`);
    failedJobs.forEach((job) => {
      console.log(`  Job ${job.id}: ${job.failedReason}`);
      console.log(`    Data:`, job.data);
    });
  }

  await videoQueue.close();
  process.exit(0);
}

monitorJobs().catch(console.error);
