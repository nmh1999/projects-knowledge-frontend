/** Export the complete vector scene, never a screenshot of the zoomed viewport. */
export function serializeWorkflowSvg(source: SVGSVGElement, width: number, height: number): string {
  const svg = source.cloneNode(true) as SVGSVGElement;
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  for (const node of [svg, ...Array.from(svg.querySelectorAll('*'))]) {
    for (const attribute of Array.from(node.attributes)) {
      if (attribute.name.startsWith('_ng')) node.removeAttribute(attribute.name);
    }
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg);
}

export function pngDimensions(width: number, height: number): {width: number; height: number} {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    throw new Error('Invalid image dimensions');
  // Prefer 2x quality while bounding canvas memory for large workflows.
  const scale = Math.min(2, 8192 / width, 8192 / height, Math.sqrt(16_000_000 / (width * height)));
  return {width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale))};
}

export async function workflowPng(svg: string, width: number, height: number): Promise<Blob> {
  const size = pngDimensions(width, height);
  const url = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml;charset=utf-8'}));
  try {
    const picture = new Image();
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Image rendering timed out')), 10_000);
      picture.onload = () => {
        window.clearTimeout(timer);
        resolve();
      };
      picture.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error('Image rendering failed'));
      };
      picture.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    context.drawImage(picture, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png')
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadWorkflow(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  try {
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
