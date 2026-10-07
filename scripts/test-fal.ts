import 'dotenv/config';
import { runFalEdit } from '../src/lib/fal';

async function main() {
  const cases = [
    {
      tool: 'enhance',
      imageUrl: 'https://picsum.photos/id/1005/800/600',
    },
    {
      tool: 'bg',
      imageUrl: 'https://picsum.photos/id/1011/800/600',
    },
    {
      tool: 'colorize',
      imageUrl: 'https://picsum.photos/id/1005/800/600?grayscale',
      params: { style: 'natural' },
    },
  ];

  for (const c of cases) {
    const t0 = Date.now();
    try {
      const url = await runFalEdit({
        tool: c.tool,
        imageUrl: c.imageUrl,
        params: (c as { params?: Record<string, unknown> }).params ?? {
          strength: 70,
        },
      });
      console.log(`OK tool=${c.tool} secs=${((Date.now() - t0) / 1000).toFixed(0)} url=${url}`);
    } catch (e) {
      console.log(`FAIL tool=${c.tool} error=${e instanceof Error ? e.message : e}`);
    }
  }
}

main();
