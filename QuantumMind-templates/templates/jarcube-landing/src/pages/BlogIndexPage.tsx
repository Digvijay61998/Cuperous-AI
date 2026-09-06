import React from 'react';
import PageShell from '../components/PageShell';
import BookACallSection from '../components/BookACallSection';
import { blogPosts } from '../content/blog';

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Blog index.
 *
 * Individual post pages are out of scope for this build, so cards are presented
 * as excerpts without a dead link to a detail route that does not exist yet.
 * When post pages land, the card becomes an anchor and nothing else changes.
 */
const BlogIndexPage: React.FC = () => (
  <PageShell currentPath="/blog">
    <section className="jc-section jc-page-head" aria-labelledby="jc-blog-heading">
      <div className="jc-container">
        <div className="jc-section-head">
          <span className="jc-eyebrow">Blog</span>
          <h1 id="jc-blog-heading">Notes on making WhatsApp work harder</h1>
          <p className="jc-lead">
            Practical writing on WhatsApp Business — what works, what breaks, and
            what to do about it.
          </p>
        </div>

        {blogPosts.length === 0 ? (
          <p className="jc-empty">
            Nothing published yet. Check back shortly.
          </p>
        ) : (
          <ul className="jc-postlist">
            {blogPosts.map((post) => (
              <li className="jc-card jc-postlist__item" key={post.slug}>
                <p className="jc-post__meta">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span aria-hidden="true"> · </span>
                  <span>{post.readMinutes} min read</span>
                  <span aria-hidden="true"> · </span>
                  <span>{post.author}</span>
                </p>
                <h2 className="jc-postlist__title">{post.title}</h2>
                <p className="jc-postlist__excerpt">{post.excerpt}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>

    <BookACallSection />
  </PageShell>
);

export default BlogIndexPage;
