import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';

/**
 * Shared mount helper for every route entry.
 *
 * Each emitted HTML document loads exactly one entry module, which calls this
 * with its page component. Keeping the mount logic in one place means the style
 * imports and the root lookup cannot drift between the 21 entries.
 */
export function mount(node: React.ReactNode): void {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('mount: #root element not found');
  }
  ReactDOM.createRoot(root).render(
    <React.StrictMode>{node}</React.StrictMode>,
  );
}
