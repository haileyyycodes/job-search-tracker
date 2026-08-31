import { describe, expect, it } from "vitest";
import { htmlToMarkdown, markdownToSafeHtml, MAX_RICH_TEXT_CHARS } from "./richText";

describe("htmlToMarkdown", () => {
  it("converts headings, bold, and lists", () => {
    const md = htmlToMarkdown(
      "<h2>About the role</h2><p>We want a <strong>senior</strong> engineer.</p><ul><li>Ship features</li><li>Mentor</li></ul>"
    );
    expect(md).toContain("## About the role");
    expect(md).toContain("**senior**");
    expect(md).toMatch(/^- +Ship features$/m);
    expect(md).toMatch(/^- +Mentor$/m);
  });

  it("keeps http links, drops the markup around unknown junk", () => {
    const md = htmlToMarkdown('<p>Apply <a href="https://example.com/jobs/1">here</a></p>');
    expect(md).toContain("[here](https://example.com/jobs/1)");
  });

  it("drops <script>/<style> entirely, not just their tags", () => {
    const md = htmlToMarkdown(
      "<p>Real text</p><script>alert('x')</script><style>body{display:none}</style>"
    );
    expect(md).toContain("Real text");
    expect(md).not.toContain("alert");
    expect(md).not.toContain("display:none");
  });

  it("collapses Word/Docs blank-line soup", () => {
    const md = htmlToMarkdown("<p>a</p><p></p><p></p><p></p><p>b</p>");
    expect(md).not.toMatch(/\n{3,}/);
  });

  it("handles Google Docs style-driven markup", () => {
    // GDocs wraps the whole selection in <b style="font-weight:normal"> and uses
    // <span style="font-weight:700"> / <span style="font-style:italic"> for runs.
    const gdocs =
      '<b style="font-weight:normal" id="docs-internal-guid-x">' +
      "<h2>About the role</h2>" +
      '<p><span style="font-weight:700">Senior</span> engineer with real ' +
      '<span style="font-style:italic">impact</span>.</p>' +
      "<ul><li>Own delivery</li><li>Mentor</li></ul></b>";
    const md = htmlToMarkdown(gdocs);
    expect(md).toContain("## About the role");
    expect(md).toContain("**Senior**");
    expect(md).toContain("_impact_");
    expect(md).toMatch(/^- +Own delivery$/m);
    // the outer <b style="font-weight:normal"> must NOT bold the whole thing
    expect(md.startsWith("**")).toBe(false);
    expect(md).not.toContain("**## About the role");
  });

  it("still converts a genuine <b>/<i>", () => {
    expect(htmlToMarkdown("<p><b>bold</b> and <i>italic</i></p>")).toMatch(/\*\*bold\*\* and _italic_/);
  });

  it("promotes strikethrough style to ~~", () => {
    const md = htmlToMarkdown('<p><span style="text-decoration:line-through">gone</span> stays</p>');
    expect(md).toContain("~~gone~~");
  });
});

describe("markdownToSafeHtml", () => {
  it("renders basic Markdown structure", () => {
    const html = markdownToSafeHtml("# Title\n\n**bold** and _italic_\n\n- one\n- two");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<li>one</li>");
  });

  it("neutralizes a javascript: link", () => {
    const html = markdownToSafeHtml("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });

  it("strips raw <script> and event handlers", () => {
    const html = markdownToSafeHtml('Hello <script>alert(1)</script> <img src=x onerror="alert(1)">');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<img");
  });

  it("strips <style> and style attributes", () => {
    const html = markdownToSafeHtml('<style>*{color:red}</style><p style="color:red">x</p>');
    expect(html).not.toContain("<style");
    expect(html).not.toContain("style=");
  });

  it("adds rel/target to links", () => {
    const html = markdownToSafeHtml("[site](https://example.com)");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('target="_blank"');
  });

  it("passes plain text through unchanged in substance", () => {
    const html = markdownToSafeHtml("Just a normal sentence with no markup.");
    expect(html).toContain("Just a normal sentence with no markup.");
  });
});

describe("MAX_RICH_TEXT_CHARS", () => {
  it("is a sane positive cap", () => {
    expect(MAX_RICH_TEXT_CHARS).toBeGreaterThan(1000);
  });
});
