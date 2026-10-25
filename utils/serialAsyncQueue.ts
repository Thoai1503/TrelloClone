type SerialQueueTaskInfo = {
  name: string;
  details?: Record<string, unknown>;
};

type SerialQueueItem = {
  id: number;
  task: () => Promise<void>;
  info: SerialQueueTaskInfo;
  queuedAt: number;
};

export function createSerialAsyncQueue() {
  const items: SerialQueueItem[] = [];
  let running = false;
  let nextTaskId = 1;

  async function flush() {
    if (running) return;

    running = true;
    try {
      while (items.length > 0) {
        const item = items.shift();
        if (!item) continue;

        const startedAt = Date.now();
        console.info("[Board persist queue] Task started", {
          taskId: item.id,
          name: item.info.name,
          details: item.info.details ?? {},
          queueWaitMs: startedAt - item.queuedAt,
          remainingQueueLength: items.length,
        });

        try {
          await item.task();
          console.info("[Board persist queue] Task completed", {
            taskId: item.id,
            name: item.info.name,
            durationMs: Date.now() - startedAt,
          });
        } catch (error: unknown) {
          console.error("[Board persist queue] Task failed", {
            taskId: item.id,
            name: item.info.name,
            durationMs: Date.now() - startedAt,
            error,
          });
        }
      }
    } finally {
      running = false;
      if (items.length > 0) {
        void flush();
      }
    }
  }

  return {
    enqueue(task: () => Promise<void>, info: SerialQueueTaskInfo) {
      const item: SerialQueueItem = {
        id: nextTaskId,
        task,
        info,
        queuedAt: Date.now(),
      };
      nextTaskId += 1;
      items.push(item);
      void flush();
    },
  };
}
