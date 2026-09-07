import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");

describe("TIJCEF indexing and advertising safeguards", () => {
  it("publishes stable canonical, robots and social metadata for every route", () => {
    const pageMeta = read("../components/site/PageMeta.tsx");
    expect(pageMeta).toContain('link[rel="canonical"]');
    expect(pageMeta).toContain("max-image-preview:large");
    expect(pageMeta).toContain("noindex,follow");
    expect(pageMeta).toContain("tijcef-page-schema");
  });

  it("pre-renders fixed and WordPress-backed routes into the production sitemap", () => {
    const postbuild = read("../../scripts/postbuild.mjs");
    expect(postbuild).toContain("/wp-json/wp/v2/posts");
    expect(postbuild).toContain("/wp-json/wp/v2/tijcef_grant");
    expect(postbuild).toContain("sitemap.xml");
    expect(postbuild).toContain("404.html");
  });

  it("keeps unknown paths as real 404s while allowing dynamic content to recover", () => {
    const redirects = read("../../public/_redirects");
    expect(redirects).toContain("/post/*                   /index.html                  200");
    expect(redirects).toContain("/category/*               /index.html                  200");
    expect(redirects).toContain("/grants/opportunities/*   /index.html                  200");
    expect(redirects).toContain("/*                        /404.html                    404");
  });

  it("does not silently deploy an incomplete dynamic sitemap", () => {
    const postbuild = read("../../scripts/postbuild.mjs");
    expect(postbuild).toContain("fetchJsonWithRetry");
    expect(postbuild).toContain("Dynamic SEO generation failed");
    expect(postbuild).toContain("/verify");
  });

  it("renders ads only when a valid publisher and slot are configured", () => {
    const adSlot = read("../components/site/AdSlot.tsx");
    expect(adSlot).toContain("validClient && validSlot(slot)");
    expect(adSlot).toContain("if (!configured || failed) return null");
    expect(adSlot).toContain('data-full-width-responsive="true"');
    const postbuild = read("../../scripts/postbuild.mjs");
    expect(postbuild).toContain("f08c47fec0942fa0");
  });

  it("keeps verified public impact figures consistent", () => {
    const homepage = read("../pages/Index.tsx");
    const impact = read("../pages/Impact.tsx");
    const programmeData = read("../data/programmeAreas.ts");
    expect(programmeData).toContain("cumulativeReach: 3500");
    expect(programmeData).toContain("reach2026: 1200");
    expect(homepage).toContain("approvedImpact.cumulativeReach");
    expect(impact).toContain("approvedImpact.cumulativeReach");
    expect(homepage).not.toContain("end: 8500");
  });

  it("publishes only editor-verified grants and media mentions", () => {
    const client = read("../lib/wordpress.ts");
    const plugin = read("../../wordpress-plugin/tijcef-core/tijcef-core.php");
    expect(client).toContain("grant.verified && grant.applicationUrl");
    expect(client).toContain("/wp-json/tijcef/v1/coverage");
    expect(client).toContain("row.sourceUrl || row.source_url");
    expect(plugin).toContain("Automated exact-name news scan");
    expect(plugin).toContain("post_status' => 'draft'");
    expect(plugin).toContain("tijcef_coverage_verified");
  });
});
