import { NextApiRequest, NextApiResponse } from "next/types";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

import {
  createValidation,
  errorMap,
  formatErrorMessage,
} from "../validation/lnauth.js";
import { Config } from "../config/index.js";
import { formatRouter } from "../utils/router.js";
import { paramsToObject } from "../utils/params.js";

async function logic(
  body: Record<string, any>,
  req: NextApiRequest | NextRequest,
  config: Config
) {
  const { state } = createValidation.parse(body, { errorMap });

  // if an old k1 is provided, delete it
  if (body.k1) {
    await config.storage.delete({ k1: body.k1 }, req);
  }

  const k1 = randomBytes(32).toString("hex");

  let inputUrl = new URL(config.siteUrl + config.apis.callback);
  inputUrl.searchParams.append("k1", k1);
  inputUrl.searchParams.append("tag", "login");

  const lnurl = require("lnurl");
  const encoded = lnurl.encode(inputUrl.toString()).toUpperCase();

  await config.storage.set({ k1, data: { k1, state } }, req);

  return {
    status: "OK",
    success: true,
    k1,
    lnurl: encoded,
  };
}

async function pagesHandler(
  req: NextApiRequest,
  res: NextApiResponse,
  config: Config
) {
  try {
    if (req.cookies["next-auth.session-token"]) {
      throw new Error("You are already logged in");
    }
    const result = await logic(req.body, req, config);

    res.send(JSON.stringify(result));
  } catch (e: any) {
    res.status(500).send(formatErrorMessage(e));
  }
}

async function appHandler(req: NextRequest, config: Config) {
  if (req.cookies.get("next-auth.session-token")?.value) {
    throw new Error("You are already logged in");
  }

  const text = await req.text();
  const params = new URLSearchParams(text);
  const body = paramsToObject(params);

  const result = await logic(body, req, config);

  return Response.json(result);
}

export default async function handler(
  request: NextApiRequest | NextRequest,
  response: NextApiResponse | NextResponse,
  config: Config
) {
  const { req, res, routerType } = formatRouter(request, response);

  if (routerType === "APP") {
    return await appHandler(req, config);
  }
  return await pagesHandler(req, res, config);
}
