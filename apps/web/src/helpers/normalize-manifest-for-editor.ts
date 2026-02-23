import { upgrade } from "@iiif/parser/upgrader";

const PRESENTATION_3_CONTEXT = "http://iiif.io/api/presentation/3/context.json";

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function contextIncludesPresentation4(context: unknown): boolean {
  if (typeof context === "string") {
    return context.includes("/presentation/4/");
  }
  if (Array.isArray(context)) {
    return context.some((entry) => typeof entry === "string" && entry.includes("/presentation/4/"));
  }
  return false;
}

function hasScene(manifest: Record<string, any>): boolean {
  return Array.isArray(manifest.items) && manifest.items.some((item) => isObject(item) && item.type === "Scene");
}

function withDefaultCanvasTarget(target: any, canvasId: string): any {
  if (!target) return canvasId;

  if (typeof target === "string") {
    return canvasId;
  }

  if (Array.isArray(target)) {
    return target.map((entry) => withDefaultCanvasTarget(entry, canvasId));
  }

  if (!isObject(target)) {
    return canvasId;
  }

  const next = cloneJson(target);

  if (typeof next.id === "string") {
    next.id = canvasId;
    next.type = "Canvas";
  }

  if (typeof next.source === "string") {
    next.source = canvasId;
  } else if (isObject(next.source)) {
    next.source = {
      ...next.source,
      id: canvasId,
      type: "Canvas",
    };
  }

  return next;
}

function normalizeAnnotation(annotation: Record<string, any>, canvasId: string): any {
  const next = cloneJson(annotation);

  if (Array.isArray(next.motivation)) {
    next.motivation = next.motivation[0] || "painting";
  }

  if (!next.motivation) {
    next.motivation = "painting";
  }

  next.target = withDefaultCanvasTarget(next.target, canvasId);

  return next;
}

function normalizeAnnotationPage(page: Record<string, any>, canvasId: string): any {
  const next = cloneJson(page);
  const items = Array.isArray(next.items) ? next.items : [];
  next.items = items.map((item) => {
    if (isObject(item) && item.type === "Annotation") {
      return normalizeAnnotation(item, canvasId);
    }
    return item;
  });
  return next;
}

function convertSceneToCanvas(scene: Record<string, any>): any {
  const next = cloneJson(scene);
  const canvasId = typeof next.id === "string" ? next.id : `https://example.org/canvas/${Date.now()}`;

  next.type = "Canvas";
  next.id = canvasId;
  next.width = Number(next.width) > 0 ? Number(next.width) : 1000;
  next.height = Number(next.height) > 0 ? Number(next.height) : 1000;

  const pages = Array.isArray(next.items) ? next.items : [];
  next.items = pages.map((page) => {
    if (isObject(page) && page.type === "AnnotationPage") {
      return normalizeAnnotationPage(page, canvasId);
    }
    return page;
  });

  return next;
}

export function normalizeManifestForEditor(input: any): any {
  // Supports older IIIF inputs first, then applies local P4 scene compatibility.
  const upgraded = upgrade(input) ?? input;

  if (!isObject(upgraded) || upgraded.type !== "Manifest") {
    return upgraded;
  }

  const manifest: any = cloneJson(upgraded as any);
  const usesP4 = contextIncludesPresentation4(manifest["@context"]);
  const includesScene = hasScene(manifest);

  if (!usesP4 && !includesScene) {
    return manifest;
  }

  manifest["@context"] = PRESENTATION_3_CONTEXT;

  if (Array.isArray(manifest.items)) {
    manifest.items = manifest.items.map((item: any) => {
      if (isObject(item) && item.type === "Scene") {
        return convertSceneToCanvas(item);
      }
      return item;
    });
  }

  return manifest;
}
