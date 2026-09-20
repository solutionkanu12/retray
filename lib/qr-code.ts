const SIZE = 21
const DATA_CODEWORDS = 19
const ECC_CODEWORDS = 7
const QUIET_ZONE = 4

type Cell = boolean | null

export function createQrSvg(value: string): string {
  const bytes = new TextEncoder().encode(value)
  if (bytes.length > 17) {
    throw new Error("ReTray QR payloads must be 17 bytes or fewer.")
  }

  const codewords = [...createDataCodewords(bytes)]
  codewords.push(...createErrorCorrection(codewords, ECC_CODEWORDS))
  const modules = createMatrix(codewords)
  const path = modules
    .flatMap((row, y) =>
      row.flatMap((filled, x) =>
        filled ? [`M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`] : [],
      ),
    )
    .join("")
  const totalSize = SIZE + QUIET_ZONE * 2

  return `<svg viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${totalSize}" height="${totalSize}" fill="#f8f4f4"/><path d="${path}" fill="#14141c"/></svg>`
}

function createDataCodewords(bytes: Uint8Array): number[] {
  const bits: number[] = []
  appendBits(bits, 0b0100, 4)
  appendBits(bits, bytes.length, 8)
  for (const byte of bytes) appendBits(bits, byte, 8)

  const capacity = DATA_CODEWORDS * 8
  appendBits(bits, 0, Math.min(4, capacity - bits.length))
  while (bits.length % 8 !== 0) bits.push(0)

  const result: number[] = []
  for (let offset = 0; offset < bits.length; offset += 8) {
    result.push(bits.slice(offset, offset + 8).reduce((sum, bit) => sum * 2 + bit, 0))
  }
  for (let pad = 0; result.length < DATA_CODEWORDS; pad += 1) {
    result.push(pad % 2 === 0 ? 0xec : 0x11)
  }
  return result
}

function appendBits(target: number[], value: number, length: number): void {
  for (let bit = length - 1; bit >= 0; bit -= 1) {
    target.push((value >>> bit) & 1)
  }
}

function createErrorCorrection(data: number[], degree: number): number[] {
  const divisor = createReedSolomonDivisor(degree)
  const remainder = Array<number>(degree).fill(0)
  for (const byte of data) {
    const factor = byte ^ remainder.shift()!
    remainder.push(0)
    for (let index = 0; index < remainder.length; index += 1) {
      remainder[index] ^= multiplyGalois(divisor[index], factor)
    }
  }
  return remainder
}

function createReedSolomonDivisor(degree: number): number[] {
  const result = Array<number>(degree).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let index = 0; index < degree; index += 1) {
    for (let coefficient = 0; coefficient < result.length; coefficient += 1) {
      result[coefficient] = multiplyGalois(result[coefficient], root)
      if (coefficient + 1 < result.length) {
        result[coefficient] ^= result[coefficient + 1]
      }
    }
    root = multiplyGalois(root, 0x02)
  }
  return result
}

function multiplyGalois(left: number, right: number): number {
  let product = 0
  let multiplicand = left
  let multiplier = right
  while (multiplier !== 0) {
    if ((multiplier & 1) !== 0) product ^= multiplicand
    multiplier >>>= 1
    multiplicand <<= 1
    if ((multiplicand & 0x100) !== 0) multiplicand ^= 0x11d
  }
  return product
}

function createMatrix(codewords: number[]): boolean[][] {
  const cells: Cell[][] = Array.from({ length: SIZE }, () =>
    Array<Cell>(SIZE).fill(null),
  )
  const functional = Array.from({ length: SIZE }, () =>
    Array<boolean>(SIZE).fill(false),
  )
  const setFunction = (x: number, y: number, filled: boolean) => {
    cells[y][x] = filled
    functional[y][x] = true
  }

  drawFinder(setFunction, 3, 3)
  drawFinder(setFunction, SIZE - 4, 3)
  drawFinder(setFunction, 3, SIZE - 4)
  for (let index = 8; index < SIZE - 8; index += 1) {
    setFunction(6, index, index % 2 === 0)
    setFunction(index, 6, index % 2 === 0)
  }
  drawFormat(setFunction, 0)

  const dataBits = codewords.flatMap((codeword) =>
    Array.from({ length: 8 }, (_, index) => (codeword >>> (7 - index)) & 1),
  )
  let bitIndex = 0
  let upward = true
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1
    for (let vertical = 0; vertical < SIZE; vertical += 1) {
      const y = upward ? SIZE - 1 - vertical : vertical
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset
        if (functional[y][x]) continue
        const bit = dataBits[bitIndex] === 1
        cells[y][x] = (x + y) % 2 === 0 ? !bit : bit
        bitIndex += 1
      }
    }
    upward = !upward
  }

  if (bitIndex !== dataBits.length) {
    throw new Error("QR matrix did not consume the complete payload.")
  }
  return cells.map((row) => row.map((cell) => cell === true))
}

function drawFinder(
  setFunction: (x: number, y: number, filled: boolean) => void,
  centerX: number,
  centerY: number,
): void {
  for (let offsetY = -4; offsetY <= 4; offsetY += 1) {
    for (let offsetX = -4; offsetX <= 4; offsetX += 1) {
      const x = centerX + offsetX
      const y = centerY + offsetY
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) continue
      const distance = Math.max(Math.abs(offsetX), Math.abs(offsetY))
      setFunction(x, y, distance !== 2 && distance !== 4)
    }
  }
}

function drawFormat(
  setFunction: (x: number, y: number, filled: boolean) => void,
  mask: number,
): void {
  const data = (0b01 << 3) | mask
  let remainder = data
  for (let index = 0; index < 10; index += 1) {
    remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537)
  }
  const bits = ((data << 10) | remainder) ^ 0x5412
  const getBit = (index: number) => ((bits >>> index) & 1) !== 0

  for (let index = 0; index <= 5; index += 1) setFunction(8, index, getBit(index))
  setFunction(8, 7, getBit(6))
  setFunction(8, 8, getBit(7))
  setFunction(7, 8, getBit(8))
  for (let index = 9; index < 15; index += 1) {
    setFunction(14 - index, 8, getBit(index))
  }

  for (let index = 0; index < 8; index += 1) {
    setFunction(SIZE - 1 - index, 8, getBit(index))
  }
  for (let index = 8; index < 15; index += 1) {
    setFunction(8, SIZE - 15 + index, getBit(index))
  }
  setFunction(8, SIZE - 8, true)
}
