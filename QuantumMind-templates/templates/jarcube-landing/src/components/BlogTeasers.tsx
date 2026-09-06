import React from 'react';
import { blogPosts } from '../content/blog';
import { flags } from '../content/flags';

/** Human-readable date, degrading to the raw string if parsing fails. */
const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Landing-page blog teasers.
 *
 * Caps at three so the section stays a teaser rather than a second index.
 * Omits itself entirely when the content module is empty.
 */
const BlogTeasers: React.FC = () => {
  if (!flags.blogTeasers) return null;
  if (blogPosts.length === 0) return null;

  const shown = blogPosts.slice(0, 3);

  return (
    <section
      className="jc-section jc-section--sunken"
      aria-labelledby="jc-blog-heading"
    >
      <div className="jc-container">
        <div className="jc-section-head">
          <span className="jc-eyebrow">From the blog</span>
          <h2 id="jc-blog-heading">Notes on making WhatsApp work harder</h2>
        </div>

        <div className="jc-grid jc-grid--3">
          {shown.map((post) => (
            <a
              key={post.slug}
              className="jc-card jc-card--interactive jc-post"
              href="/blog"
            >
              <p className="jc-post__meta">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span aria-hidden="true"> · </span>
                <span>{post.readMinutes} min read</span>
              </p>
              <h3 className="jc-post__title">{post.title}</h3>
              <p className="jc-post__excerpt">{post.excerpt}</p>
              <span className="jc-post__more" aria-hidden="true">
                Read more →
              </span>
            </a>
          ))}
        </div>

        <div className="jc-blog-foot">
          <a className="jc-btn jc-btn--secondary" href="/blog">
            All posts
          </a>
        </div>
      </div>
    </section>
  );
};

export default BlogTeasers;
