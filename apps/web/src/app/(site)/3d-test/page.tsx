"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createManifestFromId } from "../../../components/browser-editor/browser-state";

const manifestPath = "/test-data/3d-manifest.json";

export default function ThreeDTestPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const manifestUrl = useMemo(() => {
    if (!origin) return manifestPath;
    return `${origin}${manifestPath}`;
  }, [origin]);

  async function copyManifestUrl() {
    try {
      await navigator.clipboard.writeText(manifestUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  async function openInEditorNow() {
    try {
      setOpening(true);
      const project = await createManifestFromId(manifestUrl);
      router.push(`/editor/${project.id}`);
    } catch (error) {
      console.error(error);
      alert("Could not open manifest automatically. Use Copy URL and Open manifest URL from home.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <h1 className="text-3xl font-semibold">3D JSON Test (Not Really!)</h1>
      <p className="text-slate-700">
        Use either option below: download the JSON file, or use a URL to import the manifest.
      </p>

      <div className="rounded border border-slate-200 bg-slate-50 p-4 space-y-4">
        <h2 className="text-xl font-medium">Manifest URL Option</h2>
        <p className="text-sm text-slate-700">
          Paste this URL into the editor home screen using <strong>Open manifest URL</strong>.
        </p>
        <div className="flex flex-col gap-2">
          <input
            readOnly
            value={manifestUrl}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openInEditorNow}
              disabled={opening}
              className="inline-flex items-center rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60"
            >
              {opening ? "Opening..." : "Open in Editor Now"}
            </button>
            <button
              type="button"
              onClick={copyManifestUrl}
              className="inline-flex items-center rounded border border-slate-300 px-3 py-2 text-sm"
            >
              {copied ? "Copied" : "Copy URL"}
            </button>
            <Link className="inline-flex items-center rounded border border-slate-300 px-3 py-2 text-sm" href="/">
              Go to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded border border-slate-200 bg-slate-50 p-4 space-y-3">
        <h2 className="text-xl font-medium">Download Option</h2>
        <p className="text-sm text-slate-700">
          Download and open directly in the local editor.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            className="inline-flex items-center rounded bg-slate-900 px-3 py-2 text-sm text-white"
            href={manifestPath}
            download
          >
            Download 3D JSON
          </a>
          <Link className="inline-flex items-center rounded border border-slate-300 px-3 py-2 text-sm" href="/local">
            Open Local Editor
          </Link>
          <a className="inline-flex items-center rounded border border-slate-300 px-3 py-2 text-sm" href={manifestPath}>
            View Raw JSON
          </a>
        </div>
      </div>
    </main>
  );
}
