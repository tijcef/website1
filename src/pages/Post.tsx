import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import PageMeta from "@/components/site/PageMeta";
import { Button } from "@/components/ui/button";
import { getPostBySlug, sanitizeWordPressHtml, type WordPressPost } from "@/lib/wordpress";
import AdSlot from "@/components/site/AdSlot";
import SocialShare from "@/components/site/SocialShare";

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
};

export default function Post() {
  const { slug = "" } = useParams();
  const [post, setPost] = useState<WordPressPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getPostBySlug(slug)
      .then((result) => {
        if (!active) return;
        if (!result) {
          setError("This update may have been moved or removed.");
          return;
        }
        setPost(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "This update is unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="container min-h-[70vh] pt-36">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-16 max-w-3xl animate-pulse rounded bg-muted" />
          <div className="mt-10 h-96 animate-pulse rounded-2xl bg-muted" />
        </div>
      </SiteLayout>
    );
  }

  if (error || !post) {
    return (
      <SiteLayout>
        <PageMeta title="Update Unavailable" description="The requested TIJCEF update is unavailable." noIndex />
        <section className="container min-h-[70vh] py-36">
          <h1 className="text-5xl">Update unavailable</h1>
          <p className="mt-4 text-lg text-muted-foreground">{error}</p>
          <Button asChild className="mt-8"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Return home</Link></Button>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageMeta
        title={post.title}
        description={post.excerpt || "A TIJCEF programme and community impact update."}
        image={post.featuredImage || undefined}
        type="article"
        publishedTime={post.date}
        modifiedTime={post.modified}
      />
      <article className="pb-20 pt-32">
        <header className="container max-w-4xl">
          {post.date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {formatDate(post.date)}
            </div>
          )}
          <h1 className="mt-5 text-5xl leading-tight md:text-7xl">{post.title}</h1>
          {post.excerpt && <p className="mt-6 text-xl leading-relaxed text-muted-foreground">{post.excerpt}</p>}
          <SocialShare title={post.title} className="mt-7 border-t border-border pt-5" />
        </header>

        {post.featuredImage && (
          <div className="container my-10 max-w-6xl">
            <img src={post.featuredImage} alt={post.featuredImageAlt} className="max-h-[680px] w-full rounded-2xl object-cover shadow-elegant" />
          </div>
        )}

        <div
          className="prose prose-lg mx-auto max-w-3xl px-6 prose-headings:font-display prose-a:text-primary prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: sanitizeWordPressHtml(post.content) }}
        />
        <div className="mx-auto mt-10 max-w-3xl border-t border-border px-6 pt-6">
          <SocialShare title={post.title} />
        </div>
        <AdSlot placement="content" />
      </article>
    </SiteLayout>
  );
}
