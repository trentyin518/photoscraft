import 'dotenv/config';
import { uploadFile } from '../src/storage';

// 1x1 transparent png
const buf = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

async function main() {
  try {
    const r = await uploadFile(buf, 'smoke-test.png', 'image/png', 'photocraft');
    console.log('R2 OK:', JSON.stringify(r));
  } catch (e) {
    console.log('R2 FAIL:', e instanceof Error ? e.message : e);
  }
}

main();
