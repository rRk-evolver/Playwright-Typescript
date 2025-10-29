import * as fs from 'fs';
import * as path from 'path';
import { BrowserContext, Page } from 'playwright';


/**
 * Screenshot and Video Capture Utility
 * Handles automatic capture of screenshots and videos for test reporting
 */
export class CaptureUtils {
  private static instance: CaptureUtils;
  private screenshotsDir: string;
  private videosDir: string;
  private tracesDir: string;

  private constructor() {
    this.screenshotsDir = path.join(process.cwd(), "reports", "screenshots");
    this.videosDir = path.join(process.cwd(), "reports", "videos");
    this.tracesDir = path.join(process.cwd(), "reports", "traces");

    // Ensure directories exist
    this.ensureDirectories();
  }

  public static getInstance(): CaptureUtils {
    if (!CaptureUtils.instance) {
      CaptureUtils.instance = new CaptureUtils();
    }
    return CaptureUtils.instance;
  }

  /**
   * Ensure capture directories exist
   */
  private ensureDirectories(): void {
    [this.screenshotsDir, this.videosDir, this.tracesDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Take screenshot with timestamp and scenario name
   */
  async takeScreenshot(
    page: Page,
    scenarioName: string,
    stepName?: string,
    status: "passed" | "failed" | "info" = "info"
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const cleanScenarioName = this.sanitizeFilename(scenarioName);
      const cleanStepName = stepName ? this.sanitizeFilename(stepName) : "";

      const filename = stepName
        ? `${status}-${cleanScenarioName}-${cleanStepName}-${timestamp}.png`
        : `${status}-${cleanScenarioName}-${timestamp}.png`;

      const filepath = path.join(this.screenshotsDir, filename);

      await page.screenshot({
        path: filepath,
        fullPage: true,
        type: "png",
      });

      console.log(`📸 Screenshot captured: ${filename}`);
      return filepath;
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
      throw error;
    }
  }

  /**
   * Start video recording for a browser context
   */
  async startVideoRecording(
    context: BrowserContext,
    scenarioName: string
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const cleanScenarioName = this.sanitizeFilename(scenarioName);
      const filename = `${cleanScenarioName}-${timestamp}.webm`;
      const videoPath = path.join(this.videosDir, filename);

      // Note: Video recording should be started when creating the context
      // This method returns the expected path
      console.log(`🎥 Video recording prepared: ${filename}`);
      return videoPath;
    } catch (error) {
      console.error("Failed to prepare video recording:", error);
      throw error;
    }
  }

  /**
   * Start trace recording
   */
  async startTrace(page: Page, scenarioName: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const cleanScenarioName = this.sanitizeFilename(scenarioName);
      const filename = `${cleanScenarioName}-${timestamp}.zip`;
      const tracePath = path.join(this.tracesDir, filename);

      await page.context().tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });

      console.log(`🔍 Trace recording started: ${filename}`);
      return tracePath;
    } catch (error) {
      console.error("Failed to start trace recording:", error);
      throw error;
    }
  }

  /**
   * Stop trace recording and save
   */
  async stopTrace(page: Page, tracePath: string): Promise<void> {
    try {
      await page.context().tracing.stop({ path: tracePath });
      console.log(`🔍 Trace recording saved: ${path.basename(tracePath)}`);
    } catch (error) {
      console.error("Failed to stop trace recording:", error);
      throw error;
    }
  }

  /**
   * Capture step screenshot for reporting
   */
  async captureStepScreenshot(
    page: Page,
    scenarioName: string,
    stepName: string,
    status: "passed" | "failed" | "skipped" = "passed"
  ): Promise<string | null> {
    // Only capture on failure or if explicitly requested
    const shouldCapture =
      status === "failed" ||
      process.env.SCREENSHOT === "always" ||
      process.env.SCREENSHOT === "on-failure";

    if (!shouldCapture) {
      return null;
    }

    // Map skipped to info for screenshot naming
    const screenshotStatus: "passed" | "failed" | "info" =
      status === "skipped" ? "info" : status;
    return await this.takeScreenshot(
      page,
      scenarioName,
      stepName,
      screenshotStatus
    );
  }

  /**
   * Generate video recording with context
   */
  async createVideoRecordingContext(scenarioName: string): Promise<{
    recordVideo: { dir: string; size?: { width: number; height: number } };
    videoPath: string;
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const cleanScenarioName = this.sanitizeFilename(scenarioName);
    const videoDir = path.join(
      this.videosDir,
      `${cleanScenarioName}-${timestamp}`
    );

    // Ensure video directory exists
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    return {
      recordVideo: {
        dir: videoDir,
        size: { width: 1280, height: 720 },
      },
      videoPath: path.join(videoDir, "video.webm"),
    };
  }

  /**
   * Attach screenshot to Cucumber report
   */
  attachScreenshotToCucumber(world: any, screenshotPath: string): void {
    try {
      if (fs.existsSync(screenshotPath)) {
        const screenshot = fs.readFileSync(screenshotPath);
        world.attach(screenshot, "image/png");
        console.log(`📎 Screenshot attached to Cucumber report`);
      }
    } catch (error) {
      console.error("Failed to attach screenshot to Cucumber report:", error);
    }
  }

  /**
   * Clean old capture files
   */
  cleanOldCaptures(olderThanDays: number = 7): void {
    console.log(`🧹 Cleaning captures older than ${olderThanDays} days...`);

    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    [this.screenshotsDir, this.videosDir, this.tracesDir].forEach((dir) => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);

          if (stats.mtime.getTime() < cutoffTime) {
            if (stats.isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(filePath);
            }
            console.log(`   Removed: ${file}`);
          }
        });
      }
    });
  }

  /**
   * Get capture statistics
   */
  getCaptureStats(): {
    screenshots: number;
    videos: number;
    traces: number;
    totalSize: string;
  } {
    const stats = {
      screenshots: 0,
      videos: 0,
      traces: 0,
      totalSize: "0 MB",
    };

    let totalBytes = 0;

    // Count screenshots
    if (fs.existsSync(this.screenshotsDir)) {
      const screenshots = fs.readdirSync(this.screenshotsDir);
      stats.screenshots = screenshots.length;
      screenshots.forEach((file) => {
        const filePath = path.join(this.screenshotsDir, file);
        totalBytes += fs.statSync(filePath).size;
      });
    }

    // Count videos
    if (fs.existsSync(this.videosDir)) {
      const videos = fs.readdirSync(this.videosDir);
      stats.videos = videos.length;
      videos.forEach((file) => {
        const filePath = path.join(this.videosDir, file);
        const fileStat = fs.statSync(filePath);
        if (fileStat.isDirectory()) {
          // Video directories
          const videoFiles = fs.readdirSync(filePath);
          videoFiles.forEach((videoFile) => {
            totalBytes += fs.statSync(path.join(filePath, videoFile)).size;
          });
        } else {
          totalBytes += fileStat.size;
        }
      });
    }

    // Count traces
    if (fs.existsSync(this.tracesDir)) {
      const traces = fs.readdirSync(this.tracesDir);
      stats.traces = traces.length;
      traces.forEach((file) => {
        const filePath = path.join(this.tracesDir, file);
        totalBytes += fs.statSync(filePath).size;
      });
    }

    // Convert bytes to MB
    stats.totalSize = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;

    return stats;
  }

  /**
   * Sanitize filename for cross-platform compatibility
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9\-_\s]/gi, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .toLowerCase()
      .substring(0, 100); // Limit length
  }

  /**
   * Get relative path for reporting
   */
  getRelativePath(absolutePath: string): string {
    return path.relative(process.cwd(), absolutePath);
  }
}
