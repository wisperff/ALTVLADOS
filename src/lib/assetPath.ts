const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '')
  .trim()
  .replace(/^\/+|\/+$/g, '');

export function assetPath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error('assetPath expects an absolute local path beginning with /');
  }

  return `${basePath ? `/${basePath}` : ''}${path}`;
}
