export class StockfishWorker {
  private worker: Worker;
  private ready: boolean = false;

  constructor() {
    this.worker = new Worker(new URL('../workers/stockfish.worker', import.meta.url));
    this.worker.onmessage = (e) => {
      if (e.data.type === 'ready') this.ready = true;
    };
    this.worker.postMessage({ type: 'init' });
  }

  analyze(fen: string, depth: number = 12): Promise<any> {
    return new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        if (e.data.type === 'analysis') {
          resolve(e.data);
          this.worker.removeEventListener('message', handler);
        }
      };
      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ type: 'analyze', fen, depth });
    });
  }

  terminate() {
    this.worker.terminate();
  }
}
