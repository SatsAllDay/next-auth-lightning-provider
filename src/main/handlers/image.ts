import { NextApiRequest, NextApiResponse } from "next/types";
import { NextRequest, NextResponse } from "next/server";

import { Config } from "../config/index.js";
import { formatRouter } from "../utils/router.js";

const cacheDuration = 24 * 60 * 60; // 1 day cache duration

async function logic(path: string, config: Config) {
  if (!config.generateAvatar) throw new Error("Avatars are not enabled");

  if (!path) throw new Error("Invalid url");

  const [name, ext] = path.split("/").slice(-1)[0].split(".");
  if (!name) throw new Error("Invalid file name");
  if (ext !== "svg") throw new Error("Invalid file type");

  const { image } = await config.generateAvatar(name, config);
  return image;
}

async function pagesHandler(
  req: NextApiRequest,
  res: NextApiResponse,
  path: string,
  config: Config
) {
  const image = await logic(path, config);

  res.setHeader("content-type", "image/svg+xml");
  res.setHeader("cache-control", `public, max-age=${cacheDuration}`);
  res.end(image);
}

async function appHandler(req: NextRequest, path: string, config: Config) {
  const image = await logic(path, config);

  return new Response(image, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": `public, max-age=${cacheDuration}`,
    },
  });
}

export default async function handler(
  request: NextApiRequest | NextRequest,
  response: NextApiResponse | NextResponse,
  config: Config
) {
  const { req, res, path, routerType } = formatRouter(request, response);

  if (routerType === "APP") {
    return await appHandler(req, path, config);
  }
  return await pagesHandler(req, res, path, config);
}
