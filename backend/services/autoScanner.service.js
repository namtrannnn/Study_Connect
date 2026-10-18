/**
 * Auto-Scanner Service (Proxy sang Stage 3 Async Queue Worker chuẩn Blueprint)
 */
const {
  processAsyncModerationQueue,
  startStage3Worker,
} = require("./moderation/stage3_asyncQueue.service");

async function scanUncheckedPosts() {
  return await processAsyncModerationQueue();
}

function startAutoScanner(intervalMs = 30 * 1000) {
  return startStage3Worker(intervalMs);
}

module.exports = {
  scanUncheckedPosts,
  startAutoScanner,
};
