// ** Drawer sections: summary, conversation, history, notes (crm-plugins-service-desk R14–R16)
import { useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import Icon from 'src/@core/components/icon';
import type { SrComment, SrDetail, SrTranscript } from 'src/store/apps/crm-service-requests';
import { describeEvent, SrEvent } from './srHistory';

const when = (d?: string | null) => (d ? new Date(d).toLocaleString() : '');

export const Section = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <Box component="section" sx={{ mb: 6 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
        {title}
      </Typography>
      {action}
    </Box>
    {children}
  </Box>
);

// ------------------------------------------------------------------ summary

export const SrSummaryCard = ({
  sr,
  loading,
  onRegenerate,
}: {
  sr: SrDetail;
  loading: boolean;
  onRegenerate: () => void;
}) => {
  const s = sr.summary;
  const hasSummary = !!(s && (s.overview || s.customerAsk || s.actionsTaken || s.nextStep));
  const action = (
    <Button size="small" onClick={onRegenerate} disabled={loading} startIcon={loading ? <CircularProgress size={14} /> : <Icon icon="bx:refresh" />}>
      {hasSummary ? 'Regenerate' : 'Generate'}
    </Button>
  );
  return (
    <Section title="AI summary" action={action}>
      {!hasSummary && (
        <Alert severity={sr.summaryError ? 'warning' : 'info'} variant="outlined">
          {sr.summaryError || !sr.conversationId ? 'Summary not available.' : 'No summary yet.'}
          {sr.summaryError && ' Use Regenerate to try again.'}
        </Alert>
      )}
      {hasSummary && (
        <Box sx={{ p: 3, borderRadius: 1, bgcolor: 'action.hover' }}>
          {s!.overview && <Typography variant="body2" sx={{ mb: 2 }}>{s!.overview}</Typography>}
          {[
            ['Customer wants', s!.customerAsk],
            ['Done so far', s!.actionsTaken],
            ['Next step', s!.nextStep],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <Typography key={k} variant="body2" sx={{ mb: 1 }}>
                <strong>{k}:</strong> {v}
              </Typography>
            ))}
          <Typography variant="caption" color="text.disabled">
            {s!.generatedAt ? `Generated ${when(s!.generatedAt)}` : ''}
            {sr.summaryError ? ' · The last refresh failed; showing the previous summary.' : ''}
          </Typography>
        </Box>
      )}
    </Section>
  );
};

// ------------------------------------------------------------------ transcript

const ROLE_LABEL: Record<string, string> = { visitor: 'Customer', bot: 'Bot', agent: 'Agent', system: 'System', unknown: '' };

export const SrTranscriptView = ({ transcript, loading }: { transcript: SrTranscript | null; loading: boolean }) => {
  const [all, setAll] = useState(false);
  const lines = transcript?.lines || [];
  const shown = all ? lines : lines.slice(-30);
  const caption =
    transcript?.source === 'snapshot'
      ? `Saved copy from ${when(transcript.at)} (the chat itself has been cleaned up).`
      : transcript?.source === 'live'
      ? 'Live conversation.'
      : '';
  return (
    <Section title="Conversation">
      {loading && !transcript && <CircularProgress size={20} />}
      {transcript && !lines.length && (
        <Typography variant="body2" color="text.disabled">
          No conversation is linked to this request.
        </Typography>
      )}
      {!!lines.length && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {caption}
          </Typography>
          {lines.length > shown.length && (
            <Button size="small" onClick={() => setAll(true)} sx={{ mb: 2 }}>
              Show all {lines.length} messages
            </Button>
          )}
          <Box
            role="log"
            aria-label="Conversation"
            sx={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, pr: 1 }}
          >
            {shown.map((l, i) => {
              const mine = l.from === 'visitor';
              return (
                <Box key={i} sx={{ alignSelf: mine ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: mine ? 'left' : 'right' }}>
                    {l.name || ROLE_LABEL[l.from] || l.from}
                    {l.at ? ` · ${new Date(l.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </Typography>
                  <Box
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: 1,
                      bgcolor: mine ? 'action.selected' : 'primary.light',
                      color: mine ? 'text.primary' : 'primary.contrastText',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    <Typography variant="body2" color="inherit">
                      {l.text || `[${l.type}]`}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Section>
  );
};

// ------------------------------------------------------------------ history

export const SrHistoryList = ({
  events,
  onMore,
}: {
  events: { data: SrEvent[]; count: number } | null;
  onMore: () => void;
}) => (
  <Section title="History">
    {!events && <CircularProgress size={20} />}
    {events && !events.data.length && (
      <Typography variant="body2" color="text.disabled">
        Nothing yet.
      </Typography>
    )}
    {events?.data.map((e) => {
      const d = describeEvent(e);
      return (
        <Box key={e.id} sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ color: 'text.secondary', pt: 0.25 }}>
            <Icon icon={d.icon} fontSize={18} />
          </Box>
          <Box>
            <Typography variant="body2">{d.text}</Typography>
            <Typography variant="caption" color="text.disabled">
              {when(e.createdAt)}
            </Typography>
          </Box>
        </Box>
      );
    })}
    {events && events.data.length < events.count && (
      <Button size="small" onClick={onMore}>
        Show older
      </Button>
    )}
  </Section>
);

// ------------------------------------------------------------------ notes

export const COMMENT_MAX = 5000;

export const SrComments = ({
  comments,
  me,
  staff,
  onAdd,
  onEdit,
  onDelete,
}: {
  comments: SrComment[] | null;
  me: string | null;
  staff: boolean;
  onAdd: (body: string) => Promise<boolean>;
  onEdit: (commentId: string, body: string) => Promise<boolean>;
  onDelete: (commentId: string) => void;
}) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);

  const add = async () => {
    const body = text.trim();
    if (!body || body.length > COMMENT_MAX) return;
    setBusy(true);
    if (await onAdd(body)) setText('');
    setBusy(false);
  };

  return (
    <Section title={`Notes${comments?.length ? ` (${comments.length})` : ''}`}>
      {!comments && <CircularProgress size={20} />}
      {comments?.map((c) => {
        const mine = !!me && c.authorId === me;
        if (editing?.id === c.id) {
          return (
            <Box key={c.id} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                size="small"
                value={editing.body}
                onChange={(e) => setEditing({ id: c.id, body: e.target.value })}
                error={editing.body.length > COMMENT_MAX}
                helperText={editing.body.length > COMMENT_MAX ? `At most ${COMMENT_MAX} characters` : ' '}
                inputProps={{ 'aria-label': 'Edit note' }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!editing.body.trim() || editing.body.length > COMMENT_MAX}
                  onClick={async () => {
                    if (await onEdit(c.id, editing.body.trim())) setEditing(null);
                  }}
                >
                  Save
                </Button>
                <Button size="small" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </Box>
            </Box>
          );
        }
        return (
          <Box key={c.id} sx={{ mb: 3, p: 3, borderRadius: 1, border: (t) => `1px solid ${t.palette.divider}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, flex: 1 }}>
                {c.authorName || 'Someone'}
                <Typography component="span" variant="caption" color="text.disabled">
                  {' '}
                  · {when(c.createdAt)}
                  {c.editedAt ? ' · edited' : ''}
                </Typography>
              </Typography>
              {mine && (
                <Tooltip title="Edit" arrow>
                  <IconButton size="small" aria-label="Edit note" onClick={() => setEditing({ id: c.id, body: c.body })}>
                    <Icon icon="bx:pencil" fontSize={16} />
                  </IconButton>
                </Tooltip>
              )}
              {(mine || staff) && (
                <Tooltip title="Delete" arrow>
                  <IconButton
                    size="small"
                    aria-label="Delete note"
                    onClick={() => {
                      if (window.confirm('Delete this note?')) onDelete(c.id);
                    }}
                  >
                    <Icon icon="bx:trash" fontSize={16} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {c.body}
            </Typography>
          </Box>
        );
      })}
      <TextField
        fullWidth
        multiline
        minRows={2}
        size="small"
        placeholder="Add a note for the team"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void add();
        }}
        error={text.length > COMMENT_MAX}
        helperText={text.length > COMMENT_MAX ? `At most ${COMMENT_MAX} characters` : 'Ctrl+Enter to send'}
        inputProps={{ 'aria-label': 'New note' }}
      />
      <Button
        size="small"
        variant="contained"
        sx={{ mt: 1 }}
        disabled={busy || !text.trim() || text.length > COMMENT_MAX}
        onClick={() => void add()}
      >
        Add note
      </Button>
    </Section>
  );
};
