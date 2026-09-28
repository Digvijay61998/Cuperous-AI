// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Custom Components
import CustomAvatar from 'src/@core/components/mui/avatar';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import {
  createActivity,
  deleteActivity,
  fetchActivities,
} from 'src/store/apps/crm';

// ** Utils
import { humanize } from 'src/views/crm/utils';

type Scope = { contactId?: string; companyId?: string; dealId?: string };

interface Props {
  scope: Scope;
}

const ACTIVITY_TYPES = ['NOTE', 'CALL', 'EMAIL', 'MEETING', 'TASK'];

const TYPE_ICON: Record<string, string> = {
  NOTE: 'bx:note',
  CALL: 'bx:phone',
  EMAIL: 'bx:envelope',
  MEETING: 'bx:calendar',
  TASK: 'bx:check-square',
  STAGE_CHANGE: 'bx:transfer',
  ENRICHMENT: 'bx:bot',
};

const TYPE_COLOR: Record<string, any> = {
  NOTE: 'secondary',
  CALL: 'info',
  EMAIL: 'primary',
  MEETING: 'warning',
  TASK: 'success',
  STAGE_CHANGE: 'info',
  ENRICHMENT: 'primary',
};

const ActivityTimeline = ({ scope }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading } = useSelector((state: RootState) => state.crm.activities);

  const [type, setType] = useState<string>('NOTE');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [dueAt, setDueAt] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const scopeKey = scope.contactId || scope.companyId || scope.dealId;

  const refetch = () => {
    if (scopeKey) dispatch(fetchActivities(scope));
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey]);

  const handleAdd = async () => {
    if (!body.trim() && !subject.trim()) return;
    setSubmitting(true);
    try {
      await dispatch(
        createActivity({
          ...scope,
          type,
          subject: subject.trim() || undefined,
          body: body.trim() || undefined,
          dueAt: type === 'TASK' && dueAt ? dueAt : undefined,
        }),
      ).unwrap();
      setSubject('');
      setBody('');
      setDueAt('');
      setType('NOTE');
      refetch();
    } catch {
      // toast in thunk
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteActivity(id)).unwrap();
      refetch();
    } catch {
      // toast in thunk
    }
  };

  const formatWhen = (a: any) => {
    const d = a?.occurredAt || a?.createdAt;
    return d
      ? new Date(d).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })
      : '';
  };

  return (
    <Box>
      {/* Composer */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="activity-type">Type</InputLabel>
            <Select
              labelId="activity-type"
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {ACTIVITY_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {humanize(t)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
          />
          {type === 'TASK' && (
            <TextField
              size="small"
              type="date"
              label="Due"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          )}
        </Box>
        <TextField
          fullWidth
          size="small"
          label="Details"
          multiline
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleAdd}
          disabled={submitting}
          startIcon={<Icon icon="bx:plus" />}
        >
          Add Activity
        </Button>
      </Box>

      <Divider sx={{ mb: 5 }} />

      {/* Timeline */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : data.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 6 }}>
          No activity yet.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.map((a: any) => (
            <Box key={a.id} sx={{ display: 'flex', gap: 3 }}>
              <CustomAvatar
                skin="light"
                color={TYPE_COLOR[a.type] || 'secondary'}
                sx={{ width: 36, height: 36 }}
              >
                <Icon icon={TYPE_ICON[a.type] || 'bx:note'} fontSize={18} />
              </CustomAvatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 500 }}>
                    {a.subject || humanize(a.type)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.disabled">
                      {formatWhen(a)}
                    </Typography>
                    <Tooltip title="Delete" arrow placement="top">
                      <IconButton size="small" color="error" onClick={() => handleDelete(a.id)}>
                        <Icon icon="bx:trash" fontSize={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                {a.body && (
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {a.body}
                  </Typography>
                )}
                {a.dueAt && (
                  <Typography variant="caption" color={a.completedAt ? 'success.main' : 'warning.main'}>
                    {a.completedAt ? 'Completed' : `Due ${new Date(a.dueAt).toLocaleDateString()}`}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ActivityTimeline;
