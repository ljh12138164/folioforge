import { expect, it } from 'vitest';
import { inkCoverage, stampPlacement } from './analysis';

it('separates blank scans, ink, colored marks and dark sheets without discarding margins', () => {
  const pixels = new Uint8ClampedArray(10_000 * 4).fill(255);
  expect(inkCoverage(pixels)).toBe(0);
  for (let i = 0; i < 100; i++) pixels.set([0, 0, 0, 255], i * 4);
  expect(inkCoverage(pixels)).toBe(1);
  pixels.fill(235); expect(inkCoverage(pixels)).toBe(0);
  pixels.set([235, 180, 180, 255], 0); expect(inkCoverage(pixels)).toBe(.01);
  pixels.fill(20); expect(inkCoverage(pixels)).toBe(100);
  expect(inkCoverage(new Uint8ClampedArray())).toBe(100);
});

it('fits images to the visible sheet at all positions and supported rotations', () => {
  for (const angle of [-45, 0, 45]) for (const x of [0, 50, 100]) for (const y of [0, 50, 100]) {
    const p = stampPlacement(300, 200, 100, 400, 90, x, y, angle), r = angle * Math.PI / 180;
    const corners = [[0, 0], [p.width, 0], [0, p.height], [p.width, p.height]].map(([a, b]) => [p.x + Math.cos(r) * a - Math.sin(r) * b, p.y + Math.sin(r) * a + Math.cos(r) * b]);
    for (const [a, b] of corners) { expect(a).toBeGreaterThanOrEqual(-.00001); expect(a).toBeLessThanOrEqual(300.00001); expect(b).toBeGreaterThanOrEqual(-.00001); expect(b).toBeLessThanOrEqual(200.00001); }
    expect(p.width / p.height).toBeCloseTo(.25);
  }
});
