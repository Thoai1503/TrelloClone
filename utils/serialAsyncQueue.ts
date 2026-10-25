export function createSerialAsyncQueue() {
  const items: Array<() => Promise<void>> = [];
  let running = false;

  async function flush() {
    if (running) return;

    running = true;
    try {
      while (items.length > 0) {
        const task = items.shift();
        if (!task) continue;
        await task();
      }
    } finally {
      running = false;
      if (items.length > 0) {
        void flush();
      }
    }
  }

  return {
    enqueue(task: () => Promise<void>) {
      items.push(task);
      void flush();
    },
  };
}
