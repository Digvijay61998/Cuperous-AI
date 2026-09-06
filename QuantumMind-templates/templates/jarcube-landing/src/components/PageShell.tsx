import React from 'react';
import AnnouncementBar from './AnnouncementBar';
import NavHeader from './NavHeader';
import Footer from './Footer';
import WhatsAppFab from './WhatsAppFab';

/**
 * Shared layout wrapper for every route.
 *
 * Order matters: the skip link is the first focusable element in the document
 * so a keyboard user can jump past the announcement and nav on any page.
 */
interface PageShellProps {
  currentPath: string;
  children: React.ReactNode;
}

const PageShell: React.FC<PageShellProps> = ({ currentPath, children }) => (
  <div className="jc-page">
    <a className="jc-skip-link" href="#main">
      Skip to content
    </a>

    <AnnouncementBar />
    <NavHeader currentPath={currentPath} />

    <main className="jc-main" id="main">
      {children}
    </main>

    <Footer />
    <WhatsAppFab />
  </div>
);

export default PageShell;
