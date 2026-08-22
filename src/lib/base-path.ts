const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string) {
  if (!path || /^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!configuredBasePath || normalizedPath === configuredBasePath || normalizedPath.startsWith(`${configuredBasePath}/`)) {
    return normalizedPath;
  }

  return `${configuredBasePath}${normalizedPath}`;
}

export function appPath(path: string) {
  return withBasePath(path);
}
