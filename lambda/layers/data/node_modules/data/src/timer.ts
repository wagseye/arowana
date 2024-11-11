export default class Timer {
  #startTime;
  #stopTime;

  public start(): Timer {
    if (this.#startTime) console.warn('Timer.start() method called multiple times');
    this.#startTime = Date.now();
    return this;
  }

  public stop(): Timer {
    if (!this.#startTime) throw new Error('The start() method must be executed first');
    if (this.#stopTime) console.warn('Timer.stop() method called multiple times');
    this.#stopTime = Date.now();
    return this;
  }

  public elapsedMilliseconds(): number {
    if (!this.#startTime) throw new Error('Timer was never started');
    if (!this.#stopTime) throw new Error('Timer was never stopped');
    return Math.abs(this.#stopTime - this.#startTime);
  }

  public elapsedTime(): string {
    const ms = this.elapsedMilliseconds();

    let threshold = 1000; // ms/sec
    if (ms < threshold) {return `${ms} ms`;}

    threshold *= 60; // sec/min
    if (ms < threshold) { return `${(ms / 1000).toFixed(2)} secs`; }

    return `${(ms / (60*1000)).toFixed(2)} mins`;
  }
}