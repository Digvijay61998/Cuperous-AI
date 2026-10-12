import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Axios from 'src/helper/Axios';
import { agentShareView, monthLabel, percent } from './agentShare';

/**
 * Share of conversations that needed an agent, per month (crm-incident-handover
 * R21.5), with the 1% target line. Every bar has a text value, so the chart is
 * readable without colour.
 */
const AgentShareCard = ({ botId }: { botId?: string | null }) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!botId || !/^[a-f0-9]{24}$/i.test(botId)) return;
    setLoading(true);
    setError('');
    try {
      const res = await Axios.get('reports/agent-share', { params: { bot: botId, months: 6 }, timeout: 10_000 });
      setData(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Could not load the report.');
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    load();
  }, [load]);

  const view = agentShareView(data);
  const pct = (v: number) => `${Math.min(100, (v / (view.scale || 1)) * 100)}%`;

  return (
    <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px' }}>
      <CardHeader
        title="Chats that needed an agent"
        subheader={`Target: ${view.targetLabel} or less of conversations`}
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }} role="status" aria-label="Loading the report">
            <CircularProgress size={24} />
          </Box>
        )}
        {!loading && error && (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>
            {error}
          </Alert>
        )}
        {!loading && !error && view.latest && (
          <>
            <Typography variant="h4" sx={{ mb: 0.5 }}>
              {percent(view.latest.share)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {monthLabel(view.latest.month)}: {view.latest.withAgent} of {view.latest.conversations} conversations
              {view.onTarget === true ? ' · on target' : view.onTarget === false ? ' · above target' : ''}
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }} aria-label="Share per month">
              {view.rows.map((r) => (
                <Box component="li" key={r.month} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">{monthLabel(r.month)}</Typography>
                    <Typography variant="caption">
                      {percent(r.share)}
                      {r.conversations ? ` (${r.withAgent}/${r.conversations})` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ position: 'relative', height: 8, borderRadius: 1, bgcolor: 'action.hover' }}>
                    <Box
                      sx={{
                        height: '100%',
                        borderRadius: 1,
                        width: pct(r.share ?? 0),
                        bgcolor: r.share != null && r.share > view.target ? 'warning.main' : 'success.main',
                      }}
                    />
                    {/* Target line */}
                    <Box
                      aria-hidden
                      sx={{ position: 'absolute', top: -2, bottom: -2, width: 2, left: pct(view.target), bgcolor: 'text.primary' }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}
        {!loading && !error && !view.latest && data && (
          <Typography variant="body2" color="text.secondary">
            No conversations yet.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentShareCard;
