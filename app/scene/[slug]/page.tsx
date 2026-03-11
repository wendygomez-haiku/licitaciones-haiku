import Link from "next/link";
import { notFound } from "next/navigation";
import { haikuNodes } from "@/lib/nodes";
import SceneBadge from "@/components/SceneBadge";
import SceneBody from "@/components/SceneBody"; // ✅ aquí

type PageProps = { params: Promise<{ slug: string }> };

export default async function ScenePage({ params }: PageProps) {
  const { slug } = await params;

  const node = haikuNodes.find((n) => n.slug === slug);
  if (!node) return notFound();

  const index = haikuNodes.findIndex((n) => n.slug === slug);
  const prev = haikuNodes[(index - 1 + haikuNodes.length) % haikuNodes.length];
  const next = haikuNodes[(index + 1) % haikuNodes.length];

  return (
    <main className="min-h-screen bg-base-200">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="btn btn-ghost btn-sm">
            ← Back to system
          </Link>
          <div className="text-xs opacity-70">
            Scene {index + 1} / {haikuNodes.length}
          </div>
        </div>

        <SceneBadge slug={slug} title={node.title} />

        {/* ✅ aquí va SceneBody */}
        <SceneBody description={node.description} />

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href={`/scene/${prev.slug}`} className="btn btn-outline btn-sm">
            ← {prev.title}
          </Link>
          <Link href={`/scene/${next.slug}`} className="btn btn-primary btn-sm">
            {next.title} →
          </Link>
        </div>
      </section>
    </main>
  );
}
