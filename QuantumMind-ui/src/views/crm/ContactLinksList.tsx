// ** React Imports
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

// ** Next Imports
import Link from 'next/link';

// ** MUI Imports
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

// ** Third Party
import Axios from 'src/helper/Axios';

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip';

// ** Helpers
import {
  LINK_EMPTY_TEXT,
  LINK_TITLES,
  LINKS_PAGE_SIZE,
  LinkKind,
  agentViewHref,
  channelLabel,
  formatDateTime,
  hasMoreLinks,
  mergeLinkPage,
  nextSkip,
  statusLabel,
  ticketHref,
} from './contactLinks';

interface Props {
  contactId: string;
  kind: LinkKind;
}

/**
 * One list of records linked to a CRM contact (R3.3): newest first, 50 at a
 * time with "Load more", plus empty, loading and error states.
 */
const ContactLinksList = ({ contactId, kind }: Props) => {
  const [rows, setRows] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Guards against a slow response for a previous contact landing after a newer one.
  const requestSeq = useRef(0);

  const fetchPage = useCallback(
    async (skip: number, reset: boolean) => {
      const seq = ++requestSeq.current;
      setLoading(true);
      setError('');
      try {
        const res = await Axios.get(
          `/crm/contacts/${encodeURIComponent(contactId)}/links`,
          { params: { kind, skip, limit: LINKS_PAGE_SIZE } },
        );
        if (seq !== requestSeq.current) return;
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        const total = Number(res?.data?.count ?? data.length);
        setRows((prev) => (reset ? mergeLinkPage([], data) : mergeLinkPage(prev, data)));
        setCount(Number.isFinite(total) ? total : data.length);
        setLoaded(true);
      } catch (e: any) {
        if (seq !== requestSeq.current) return;
        setError(
          (typeof e?.response?.data?.message === 'string' && e.response.data.message) ||
            `Could not load ${LINK_TITLES[kind].toLowerCase()}.`,
        );
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    },
    [contactId, kind],
  );

  useEffect(() => {
    setRows([]);
    setCount(0);
    setLoaded(false);
    if (contactId) fetchPage(0, true);
  }, [contactId, fetchPage]);

  const retry = () => fetchPage(loaded ? nextSkip(rows.length) : 0, !loaded);
  const loadMore = () => fetchPage(nextSkip(rows.length), false);

  const titleId = `crm-links-${kind}`;

  return (
    <Box component="section" aria-labelledby={titleId} sx={{ mb: 6 }}>
      <Typography id={titleId} variant="subtitle2" sx={{ mb: 2 }}>
        {LINK_TITLES[kind]}
        {loaded && count > 0 ? ` (${count})` : ''}
      </Typography>

      {rows.map((row, i) => (
        <LinkRow key={row?._id || row?.id || i} kind={kind} row={row} />
      ))}

      {loaded && !error && rows.length === 0 && (
        <Typography variant="body2" color="text.disabled">
          {LINK_EMPTY_TEXT[kind]}
        </Typography>
      )}

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }} role="status">
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      )}

      {error && !loading && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={retry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loaded && !loading && !error && hasMoreLinks(rows.length, count) && (
        <Button size="small" variant="outlined" sx={{ mt: 3 }} onClick={loadMore}>
          Load more
        </Button>
      )}
    </Box>
  );
};

const RowShell = ({
  primary,
  secondary,
  right,
  href,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  right?: ReactNode;
  href?: string | null;
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 3,
      py: 2,
      borderBottom: (t) => `1px solid ${t.palette.divider}`,
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {primary}
      </Typography>
      {secondary && (
        <Typography variant="caption" color="text.secondary">
          {secondary}
        </Typography>
      )}
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
      {right}
      {href && (
        <Link href={href} passHref>
          <Button component="a" size="small" variant="text">
            Open
          </Button>
        </Link>
      )}
    </Box>
  </Box>
);

const StatusChip = ({ status }: { status?: string }) =>
  status ? (
    <CustomChip rounded skin="light" size="small" label={statusLabel(status)} color="secondary" />
  ) : null;

const LinkRow = ({ kind, row }: { kind: LinkKind; row: any }) => {
  if (kind === 'conversations') {
    return (
      <RowShell
        primary={formatDateTime(row?.createdAt)}
        secondary={[row?.bot?.name, channelLabel(row?.platform)].filter(Boolean).join(' · ')}
        right={<StatusChip status={row?.status} />}
        href={agentViewHref(row?._id)}
      />
    );
  }

  if (kind === 'incidents') {
    const outcome = row?.outcome ? statusLabel(row.outcome) : '';
    return (
      <RowShell
        primary={formatDateTime(row?.createdAt)}
        secondary={[row?.problem, outcome && `Outcome: ${outcome}`, row?.ticketRef]
          .filter(Boolean)
          .join(' · ')}
        right={<StatusChip status={row?.status} />}
        href={agentViewHref(row?.conversationId)}
      />
    );
  }

  return (
    <RowShell
      primary={row?.ticketId || '-'}
      secondary={[row?.subject, row?.createdAt && formatDateTime(row.createdAt)]
        .filter(Boolean)
        .join(' · ')}
      right={<StatusChip status={row?.status} />}
      href={ticketHref(row)}
    />
  );
};

export default ContactLinksList;
