const FAL_HOST = 'https://queue.fal.run';
const EDIT_MODEL = process.env.FAL_IMAGE_MODEL || 'fal-ai/nano-banana/edit';

function headers() {
  const key = process.env.FAL_KEY;
  if (!key) {
    throw new Error('Missing FAL_KEY');
  }
  return { Authorization: `Key ${key}`, 'Content-Type': 'application/json' };
}

type ToolParams = Record<string, unknown>;

interface ToolSpec {
  /** fal endpoint id (without host) */
  model: string;
  /** build submit payload for this model */
  input: (imageUrl: string, params: ToolParams) => Record<string, unknown>;
}

/**
 * Per-tool model routing, verified against the live fal OpenAPI schemas.
 *
 * - enhance: clarity-upscaler (true upscaler, image_url + prompt + creativity)
 * - bg: birefnet (best edges) with rembg fallback
 * - everything generative/editorial: nano-banana/edit (prompt + image_url)
 */
function specForTool(
  tool: string,
  params: ToolParams = {}
): ToolSpec & { fallback?: ToolSpec } {
  const strength = Number(params.strength ?? 70) / 100;

  switch (tool) {
    case 'enhance':
      return {
        model: process.env.FAL_UPSCALE_MODEL || 'fal-ai/clarity-upscaler',
        input: (imageUrl) => ({
          image_url: imageUrl,
          prompt: `Ultra-detailed professional photo enhancement: deblur, denoise, sharpen fine details, natural vivid colors, photorealistic, preserve identity and composition exactly`,
          upscale_factor: 2,
          // low creativity = faithful, high strength pushes detail reconstruction
          creativity: 0.15 + strength * 0.4,
          resemblance: 0.6 + strength * 0.3,
          num_inference_steps: 30,
        }),
      };
    case 'bg':
      return {
        model: process.env.FAL_BG_MODEL || 'fal-ai/birefnet',
        input: (imageUrl) => ({
          image_url: imageUrl,
          output_format: 'png',
          refine_foreground: true,
          output_mask: false,
        }),
        fallback: {
          model: 'fal-ai/rembg',
          input: (imageUrl) => ({ image_url: imageUrl }),
        },
      };
    default:
      return { model: EDIT_MODEL, input: editInput(tool, params) };
  }
}

const EDIT_PROMPTS: Record<string, (params: ToolParams) => string> = {
  restore: () =>
    'Restore this old damaged photo: remove scratches, creases, dust spots, stains and tears, reconstruct missing areas and damaged faces with realistic detail. Keep original composition, identity and style.',
  colorize: (p) =>
    `Colorize this black-and-white photo in ${String(p.style ?? 'natural')} style: realistic skin tones, natural accurate colors for clothing and scenery, clean professional result.`,
  watermark: () =>
    'Remove all watermarks, logos, text overlays, stamps and unwanted marks from this photo, seamlessly inpaint the background texture so no trace remains.',
  eraser: () =>
    'Magic erase: detect and remove unwanted objects, photobombers, text and defects, seamlessly reconstruct the background with matching light and texture.',
  expression: () =>
    'Change the facial expression to a natural warm happy smile with realistic teeth and eyes, keep face identity, lighting, hairstyle and everything else identical.',
  hairstyle: () =>
    'Change the hairstyle to a trendy modern stylish look with natural realistic hair texture and shine, keep face identity, clothing and background identical.',
  'bg-change': () =>
    'Keep the subject exactly identical (face, clothes, pose), replace the background with an elegant soft studio gradient backdrop, blend edges and lighting realistically.',
  sky: () =>
    'Replace the sky with a breathtaking dramatic sunset sky with vivid clouds, then color-grade the whole photo so light and tones match realistically.',
  avatar: () =>
    'Turn this photo into a polished professional avatar portrait: clean neutral background, flattering studio lighting, sharp details, keep face identity exactly.',
  scene: () =>
    'Place the person into a stunning cinematic scene with dramatic lighting, realistic shadows and reflections on the subject, keep face identity exactly.',
  anime: () =>
    'Redraw this photo as a high-quality anime-style illustration: clean line art, cel shading, vibrant colors, keep pose, composition and likeness.',
  cartoon: () =>
    'Turn this photo into a fun cartoon-style portrait: smooth shapes, cheerful colors, clean shading, keep likeness, pose and composition.',
  transform: () =>
    'Transform the outfit and setting into a stylish high-fashion photoshoot look, full body, realistic fabric texture and professional lighting.',
  room: () =>
    'Redesign this room interior with modern elegant decor and furniture, keep the same layout, perspective and lighting direction, photorealistic result.',
};

function editInput(tool: string, params: ToolParams) {
  const promptFn =
    EDIT_PROMPTS[tool] ??
    (() => 'Enhance this photo with professional quality.');
  return (imageUrl: string) => ({
    prompt: promptFn(params),
    image_urls: [imageUrl],
    num_images: 1,
    output_format: 'png',
  });
}

function extractImageUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const d = data as Record<string, unknown>;
  // nano-banana/edit style
  const images = d.images as { url?: string }[] | undefined;
  if (Array.isArray(images) && images[0]?.url) {
    return images[0].url;
  }
  // clarity-upscaler / birefnet / rembg / codeformer style
  const image = d.image as { url?: string } | undefined;
  if (image?.url) {
    return image.url;
  }
  // wrapped payloads
  const nested = d.data as Record<string, unknown> | undefined;
  if (nested) {
    return extractImageUrl(nested);
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function submitAndWait(
  model: string,
  payload: Record<string, unknown>
): Promise<string> {
  const sub = await fetch(`${FAL_HOST}/${model}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!sub.ok) {
    throw new Error(`FAL submit failed (${model}): ${await sub.text()}`);
  }
  // NOTE: fal may canonicalize the endpoint in the submit response
  // (e.g. nano-banana/edit answers on fal-ai/nano-banana), so always
  // prefer the URLs from the submit response over the constructed ones.
  const subData = (await sub.json()) as {
    request_id: string;
    response_url?: string;
    status_url?: string;
  };
  const request_id = subData.request_id;
  const statusUrl =
    subData.status_url ?? `${FAL_HOST}/${model}/requests/${request_id}/status`;
  const resultUrl =
    subData.response_url ?? `${FAL_HOST}/${model}/requests/${request_id}`;

  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    const st = await fetch(statusUrl, {
      headers: headers(),
    });
    if (!st.ok) {
      continue;
    }
    const s = (await st.json()) as {
      status: string;
      error?: string;
      error_type?: string;
    };
    if (s.status === 'COMPLETED') {
      if (s.error) {
        throw new Error(
          `FAL job failed (${model}): ${s.error} [${s.error_type ?? 'unknown'}]`
        );
      }
      break;
    }
    if (s.status === 'FAILED') {
      throw new Error(`FAL job failed (${model})`);
    }
  }
  const res = await fetch(resultUrl, {
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`FAL result failed (${model}): ${await res.text()}`);
  }
  const url = extractImageUrl(await res.json());
  if (!url) {
    throw new Error(`FAL returned no image (${model})`);
  }
  return url;
}

export async function runFalEdit(opts: {
  tool: string;
  imageUrl: string;
  params?: ToolParams;
}): Promise<string> {
  const params = opts.params ?? {};
  const spec = specForTool(opts.tool, params);
  try {
    return await submitAndWait(spec.model, spec.input(opts.imageUrl, params));
  } catch (e) {
    if (!spec.fallback) {
      throw e;
    }
    return await submitAndWait(
      spec.fallback.model,
      spec.fallback.input(opts.imageUrl, params)
    );
  }
}
