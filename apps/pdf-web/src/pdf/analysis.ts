// Conservative pixel coverage: a dark sheet is never considered blank.
export function inkCoverage(data: Uint8ClampedArray): number {
  const histogram = new Uint32Array(256), pixels = data.length / 4;
  if (!pixels) return 100;
  for (let i = 0; i < data.length; i += 4) histogram[Math.round((data[i] + data[i + 1] + data[i + 2]) / 3)]++;
  let background = 255, count = 0;
  for (; background > 0; background--) { count += histogram[background]; if (count >= pixels * .05) break; }
  if (background < 220) return 100;
  let ink = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (background - Math.min(data[i], data[i + 1], data[i + 2]) > 16) ink++;
  }
  return ink / pixels * 100;
}

export function stampPlacement(pageWidth: number, pageHeight: number, imageWidth: number, imageHeight: number, widthPercent: number, xPercent: number, yPercent: number, angle: number) {
  let width = pageWidth * widthPercent / 100, height = width * imageHeight / imageWidth;
  const radians = angle * Math.PI / 180, c = Math.cos(radians), s = Math.sin(radians);
  const factor = Math.min(1, pageWidth / (Math.abs(c) * width + Math.abs(s) * height), pageHeight / (Math.abs(s) * width + Math.abs(c) * height));
  width *= factor; height *= factor;
  const halfW = (Math.abs(c) * width + Math.abs(s) * height) / 2, halfH = (Math.abs(s) * width + Math.abs(c) * height) / 2;
  const cx = Math.min(pageWidth - halfW, Math.max(halfW, pageWidth * xPercent / 100));
  const cy = Math.min(pageHeight - halfH, Math.max(halfH, pageHeight * (1 - yPercent / 100)));
  return { width, height, cx, cy, x: cx - c * width / 2 + s * height / 2, y: cy - s * width / 2 - c * height / 2 };
}
