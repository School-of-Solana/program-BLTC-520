import { Buffer } from "buffer";

// Provide a global Buffer for browser builds (bn.js and friends require it).
const globalWithBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
if (!globalWithBuffer.Buffer) {
  globalWithBuffer.Buffer = Buffer;
}
