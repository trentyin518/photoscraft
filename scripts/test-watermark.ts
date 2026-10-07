import 'dotenv/config';
import { runFalEdit } from '../src/lib/fal';

async function main() {
  const t0 = Date.now();
  try {
    const url = await runFalEdit({
      tool: 'watermark',
      imageUrl: 'https://picsum.photos/id/1011/800/600',
      params: {},
    });
    console.log(`OK watermark secs=${((Date.now() - t0) / 1000).toFixed(0)} url=${url}`);
  } catch (e) {
    console.log(`FAIL watermark error=${String(e instanceof Error ? e.message : e).slice(0, 400)}`);
  }
}

main();
