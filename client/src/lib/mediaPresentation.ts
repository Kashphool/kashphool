const videoMimeTypes: Record<string, string> = {
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export function getVideoMimeType(source: string): string | undefined {
  const path = source.split(/[?#]/, 1)[0].toLowerCase();
  const extension = path.match(/\.[^.\/]+$/)?.[0];
  return extension ? videoMimeTypes[extension] : undefined;
}
