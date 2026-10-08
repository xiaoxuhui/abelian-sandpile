// Independent single-topple implementation: intentionally no production helpers.
module.exports = function reference(width, height, input, reverse = false) {
  const cells = input.slice();
  const odometer = cells.map(() => 0);
  let lost = 0, steps = 0;
  while (true) {
    let i = reverse ? cells.length - 1 : 0;
    for (; i >= 0 && i < cells.length; i += reverse ? -1 : 1) if (cells[i] >= 4) break;
    if (i < 0 || i >= cells.length) break;
    if (++steps > 1000000) throw new Error('Reference budget exceeded');
    cells[i] -= 4; odometer[i]++;
    const x = i % width, y = Math.floor(i / width);
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) lost++;
      else cells[ny * width + nx]++;
    }
  }
  return { cells, odometer, lost, topplings: steps };
};
