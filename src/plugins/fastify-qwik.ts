import { createQwikCity } from "@builder.io/qwik-city/middleware/node";
import fastifyStatic from "@fastify/static";
import qwikCityPlan from "@qwik-city-plan";
import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";
import type { IncomingMessage } from "node:http";
import type { Http2ServerRequest } from "node:http2";

import render from "../entry.ssr";

export interface FastifyQwikOptions {
  distDir: string;
  buildDir: string;
  assetsDir: string;
}

const readHeaderValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value.find((entry) => String(entry || "").trim())?.trim() || null;
  }

  const trimmed = String(value || "").trim();
  return trimmed || null;
};

const normalizeOrigin = (value: string | null | undefined) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;

  const candidate = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed.replace(/^\/+/, "")}`;

  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
};

const getRequestOrigin = (request: IncomingMessage | Http2ServerRequest) => {
  const configuredOrigin = normalizeOrigin(process.env.ORIGIN);
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const configuredProtoHeader = readHeaderValue(
    process.env.PROTOCOL_HEADER
      ? request.headers[process.env.PROTOCOL_HEADER.toLowerCase()]
      : request.headers["x-forwarded-proto"],
  );
  const protocol =
    configuredProtoHeader?.split(",")[0]?.trim() ||
    ("encrypted" in request.socket && request.socket.encrypted ? "https" : "http");

  const configuredHostHeader = readHeaderValue(
    process.env.HOST_HEADER
      ? request.headers[process.env.HOST_HEADER.toLowerCase()]
      : request.headers["x-forwarded-host"] ??
          request.headers.host ??
          request.headers[":authority"],
  );
  const host = configuredHostHeader?.split(",")[0]?.trim();

  return normalizeOrigin(host ? `${protocol}://${host}` : null) || "http://localhost";
};

const { router, notFound } = createQwikCity({
  render,
  qwikCityPlan,
  getOrigin: getRequestOrigin,
});

const qwikPlugin: FastifyPluginAsync<FastifyQwikOptions> = async (
  fastify,
  options,
) => {
  const { buildDir, distDir, assetsDir } = options;

  fastify.register(fastifyStatic, {
    root: buildDir,
    prefix: "/build",
    immutable: true,
    maxAge: "1y",
    decorateReply: false,
  });

  fastify.register(fastifyStatic, {
    root: assetsDir,
    prefix: "/assets",
    immutable: true,
    maxAge: "1y",
  });

  fastify.register(fastifyStatic, {
    root: distDir,
    redirect: false,
    decorateReply: false,
  });

  fastify.removeAllContentTypeParsers();

  fastify.setNotFoundHandler(async (request, response) => {
    await router(request.raw, response.raw, (err) => fastify.log.error(err));
    await notFound(request.raw, response.raw, (err) => fastify.log.error(err));
  });
};

export default fastifyPlugin(qwikPlugin, { fastify: ">=5.0.0 <6.0.0" });
