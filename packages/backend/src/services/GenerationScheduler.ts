import * as cron from 'node-cron';
import { PhraseGeneratorService } from './PhraseGeneratorService';

/**
 * GenerationScheduler manages automated sentence generation on a 4-hour schedule.
 * 
 * Features:
 * - Runs cron job every 4 hours
 * - Prevents concurrent executions with mutex lock
 * - Supports manual triggering for testing
 * - Logs generation status and errors
 */
export class GenerationScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  private isGenerating: boolean = false;
  private phraseGenerator: PhraseGeneratorService;

  constructor(phraseGenerator: PhraseGeneratorService) {
    this.phraseGenerator = phraseGenerator;
  }

  /**
   * Start the scheduler with 4-hour interval
   * Cron expression: "0 star-slash-4 star star star" means at minute 0 of every 4th hour
   */
  start(): void {
    if (this.cronJob) {
      console.log('[GenerationScheduler] Scheduler already running');
      return;
    }

    // Schedule for every 4 hours at minute 0
    this.cronJob = cron.schedule('0 */4 * * *', async () => {
      console.log('[GenerationScheduler] Cron job triggered');
      await this.triggerGeneration();
    });

    console.log('[GenerationScheduler] Scheduler started - will run every 4 hours');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('[GenerationScheduler] Scheduler stopped');
    }
  }

  /**
   * Manually trigger generation (for testing or admin use)
   * Uses mutex lock to prevent concurrent executions
   */
  async triggerGeneration(): Promise<void> {
    // Mutex lock - prevent concurrent executions
    if (this.isGenerating) {
      console.log('[GenerationScheduler] Generation already in progress, skipping');
      return;
    }

    this.isGenerating = true;
    const startTime = Date.now();

    try {
      console.log('[GenerationScheduler] Starting sentence generation...');
      await this.phraseGenerator.generateAllSentences();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[GenerationScheduler] Generation completed successfully in ${duration}s`);
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`[GenerationScheduler] Generation failed after ${duration}s:`, error);
      throw error;
    } finally {
      // Release mutex lock
      this.isGenerating = false;
    }
  }

  /**
   * Check if generation is currently in progress
   */
  isRunning(): boolean {
    return this.isGenerating;
  }

  /**
   * Check if scheduler is active
   */
  isSchedulerActive(): boolean {
    return this.cronJob !== null;
  }
}
