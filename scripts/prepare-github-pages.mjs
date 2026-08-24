import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve("dist/public");
const indexFile = path.join(outputDirectory, "index.html");
const appRoutes = ["sponsors", "constitution"];

for (const route of appRoutes) {
  const routeDirectory = path.join(outputDirectory, route);
  await mkdir(routeDirectory, { recursive: true });
  await copyFile(indexFile, path.join(routeDirectory, "index.html"));
}

await copyFile(indexFile, path.join(outputDirectory, "404.html"));

