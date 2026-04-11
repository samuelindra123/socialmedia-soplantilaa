"use client";

import NextImage, { type ImageProps } from "next/image";

/**
 * Hostnames that serve files directly (no Next.js optimizer needed).
 * Appwrite Cloud: files are public and served via CDN — optimizer would just add latency.
 * DO CDN: kept for backward compat with old URLs already stored in DB.
 */
const UNOPTIMIZED_HOSTNAMES = [
  "sgp.cloud.appwrite.io",
  "cloud.appwrite.io",
  "renunganku.sgp1.cdn.digitaloceanspaces.com",
  "renunganku.sgp1.digitaloceanspaces.com",
];

function isUnoptimized(src: string): boolean {
  try {
    return UNOPTIMIZED_HOSTNAMES.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}

/**
 * Drop-in replacement for next/image.
 * Appwrite / DO CDN URLs bypass Next.js optimizer (already CDN-served, avoids 403).
 * All other URLs use Next.js optimizer as normal.
 */
export default function SmartImage({ src, ...props }: ImageProps) {
  if (typeof src === "string" && isUnoptimized(src)) {
    return <NextImage {...props} src={src} unoptimized />;
  }
  return <NextImage {...props} src={src} />;
}
