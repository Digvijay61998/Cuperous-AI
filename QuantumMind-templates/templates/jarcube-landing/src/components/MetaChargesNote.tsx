import React from 'react';
import { pricing } from '../content/pricing';

/**
 * Meta charges disclaimer.
 *
 * Shared by /pricing and the landing teaser so the wording cannot drift between
 * them. This matters commercially, not just legally: without it customers
 * reasonably assume the subscription covers their WhatsApp message fees.
 */
interface MetaChargesNoteProps {
  /** Also show the allowance framing line. Used on /pricing. */
  withAllowanceNote?: boolean;
}

const MetaChargesNote: React.FC<MetaChargesNoteProps> = ({
  withAllowanceNote = false,
}) => (
  <aside className="jc-meta-note">
    <p>{pricing.metaChargesDisclaimer}</p>
    {withAllowanceNote ? (
      <p className="jc-meta-note__sub">{pricing.allowanceNote}</p>
    ) : null}
  </aside>
);

export default MetaChargesNote;
