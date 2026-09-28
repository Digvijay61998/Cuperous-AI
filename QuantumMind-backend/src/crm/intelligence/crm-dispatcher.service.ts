import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { AgentTaskService, type LeasedTask } from "./agent-task.service";

export type TaskHandler = (task: LeasedTask) => Promise<string>;

const TICK_MS = 60_000;
const BATCH = 10;

/**
 * Always-on queue dispatcher. Every tick it retires exhausted tasks (safe
 * housekeeping) and, once an executor is registered, leases and runs due tasks.
 *
 * Phase 3 ships the queue and this loop; there is no executor yet (the research
 * agent is Phase 4), so a tick without a handler only does housekeeping. Phase 4
 * calls {@link registerHandler} to wire the agent in — no change here.
 */
@Injectable()
export class CrmDispatcherService {
  private readonly logger = new Logger(CrmDispatcherService.name);
  private handler: TaskHandler | null = null;
  private running = false;

  constructor(private readonly tasks: AgentTaskService) {}

  /** Phase 4 registers the agent executor here. */
  registerHandler(handler: TaskHandler): void {
    this.handler = handler;
    this.logger.log("CRM task executor registered");
  }

  @Interval("crm-dispatch", TICK_MS)
  async tick(): Promise<void> {
    if (this.running) return; // never overlap ticks
    this.running = true;
    try {
      await this.tasks.retireExhausted().catch(() => 0);

      if (!this.handler) return; // no executor yet (pre-Phase 4)

      const due = await this.tasks.claimDue(BATCH);
      for (const task of due) {
        try {
          const outcome = await this.handler(task);
          await this.tasks.completeTask(task.id, outcome, task.id);
        } catch (error) {
          // Leave the row leased; the lease expires and it is retried, or
          // retireExhausted closes it once attempts run out.
          this.logger.warn(
            `Task ${task.id} (${task.kind}) failed: ${
              error instanceof Error ? error.message : error
            }`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Dispatch tick failed: ${error instanceof Error ? error.message : error}`,
      );
    } finally {
      this.running = false;
    }
  }
}
