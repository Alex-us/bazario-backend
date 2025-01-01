import { delay } from '../utils';

describe('delay', () => {
  it('resolves after the specified time', async () => {
    const start = Date.now();
    await delay(100);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(100);
  });

  it('resolves immediately for 0 ms', async () => {
    const start = Date.now();
    await delay(0);
    const end = Date.now();
    expect(end - start).toBeLessThan(10);
  });
});
