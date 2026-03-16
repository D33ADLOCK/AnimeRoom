import fs from "fs";
import path from "path";

export class PipelineLogger {
  private startTime = Date.now();
  private events: Record<
    string,
    { start?: number; end?: number; durationMs?: number }
  > = {};

  startTask(name: string) {
    this.events[name] = { start: Date.now() };
  }

  endTask(name: string) {
    if (this.events[name]?.start) {
      this.events[name].end = Date.now();
      this.events[name].durationMs =
        this.events[name].end! - this.events[name].start!;
    }
  }

  printReport(jobId: string = "unknown") {
    const totalTime = Date.now() - this.startTime;
    console.log("\n=======================================================");
    console.log("               🚀 PIPELINE PERFORMANCE LOG              ");
    console.log("=======================================================\n");

    const report = {
      jobId,
      timestamp: new Date().toISOString(),
      totalPipelineDurationMs: totalTime,
      totalPipelineDurationSec: (totalTime / 1000).toFixed(2) + "s",
      tasks: Object.fromEntries(
        Object.entries(this.events).map(([k, v]) => [
          k,
          {
            start: v.start ? new Date(v.start).toISOString() : null,
            end: v.end ? new Date(v.end).toISOString() : null,
            durationSec: v.durationMs
              ? `${(v.durationMs / 1000).toFixed(2)}s`
              : "INCOMPLETE",
          },
        ]),
      ),
    };

    console.log(JSON.stringify(report, null, 2));
    console.log("\n=======================================================\n");

    try {
      // Create logs directory if it doesn't exist
      const logsDir = path.join(process.cwd(), "logs");
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Save file with timestamp + jobId
      const filename = `pipeline-${jobId}-${Date.now()}.json`;
      const filePath = path.join(logsDir, filename);

      fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
      console.log(`📂 Log saved successfully to: ${filePath}`);
    } catch (err) {
      console.error("❌ Failed to save pipeline log to file:", err);
    }

    return report;
  }
}
