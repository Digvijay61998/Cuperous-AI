// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';

import Axios from 'src/helper/Axios';
import Icon from 'src/@core/components/icon';
import VisitorProfileCard from './VisitorProfileCard';
import { isConversationId } from './contactLinks';
import { profileView } from './visitorProfile';

interface Props {
  /** Profile already loaded with the conversation context (active chat). */
  profile?: any;
  /** Or: look up the conversation's contact and load its profile (inbox). */
  conversationId?: string | null;
}

/**
 * What we know about this visitor, in the agent views (R18.8): the profile
 * replaces earlier transcripts. Read-only here; admins edit on the CRM page.
 * Renders nothing when there is no contact or nothing known yet.
 */
const VisitorProfilePanel = ({ profile, conversationId }: Props) => {
  const [contactId, setContactId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<any>(undefined);

  useEffect(() => {
    let cancelled = false;
    setContactId(null);
    setLoaded(undefined);
    if (profile !== undefined || !isConversationId(conversationId)) return;
    (async () => {
      try {
        const link = await Axios.get(`crm/conversations/${conversationId}/contact`, { timeout: 10_000 });
        const id = link.data?.contact?.id;
        if (!id || cancelled) return;
        const res = await Axios.get(`crm/contacts/${id}/profile`, { timeout: 10_000 });
        if (!cancelled) {
          setContactId(id);
          setLoaded(res.data?.profile ?? null);
        }
      } catch {
        // No contact, no access or CRM down: the agent view works without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, profile]);

  const data = profile !== undefined ? profile : loaded;
  if (data === undefined || profileView(data).empty) return null;

  return (
    <Accordion disableGutters elevation={0} sx={{ mb: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
      <AccordionSummary expandIcon={<Icon icon="bx:chevron-down" />} aria-controls="visitor-profile" id="visitor-profile-header">
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          What we know about this visitor
        </Typography>
      </AccordionSummary>
      <AccordionDetails id="visitor-profile">
        <VisitorProfileCard profile={data} contactId={contactId} compact />
      </AccordionDetails>
    </Accordion>
  );
};

export default VisitorProfilePanel;
