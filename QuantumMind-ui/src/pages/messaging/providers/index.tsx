// ** React Imports
import { useEffect, useState } from 'react';
import Axios from 'src/helper/Axios';
import { useDispatch, useSelector } from 'react-redux';

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// ** Icon
import Icon from 'src/@core/components/icon';

// ** Store
import { AppDispatch, RootState } from 'src/store';
import {
  ChannelProviders,
  fetchMessagingProviders,
  ProviderOption,
  setActiveProvider,
} from 'src/store/apps/messaging';

const channelIcon: Record<string, string> = {
  whatsapp: 'ic:baseline-whatsapp',
  facebook: 'bi:messenger',
  telegram: 'bxl:telegram',
  instagram: 'bi:instagram',
  widget: 'material-symbols:chat',
  sms: 'material-symbols:sms',
  email: 'bx:envelope',
};

const humanize = (v: string) =>
  v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const MessagingProviders = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { channels, loading } = useSelector(
    (state: RootState) => state.messaging,
  );

  // Providers are switched per bot: an org admin can only change the provider
  // for bots of their own organization (the global default is platform-owned).
  const [bots, setBots] = useState<{ id: string; name: string }[]>([]);
  const [botId, setBotId] = useState<string>('');

  useEffect(() => {
    Axios.get('bots/list')
      .then((res) => {
        const list = (res.data || []).map((b: any) => ({
          id: String(b.id),
          name: b.name,
        }));
        setBots(list);
        if (list.length) setBotId((prev) => prev || list[0].id);
      })
      .catch(() => setBots([]));
  }, []);

  useEffect(() => {
    if (botId) dispatch(fetchMessagingProviders(botId));
  }, [dispatch, botId]);

  const handleChange = (channel: string, e: SelectChangeEvent) => {
    if (!botId) return;
    dispatch(setActiveProvider({ channel, providerId: e.target.value, botId }));
  };

  const activeProvider = (ch: ChannelProviders): ProviderOption | undefined =>
    ch.providers.find((p) => p.providerId === ch.active);

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Channel Providers"
            subheader="Choose which provider powers each messaging channel. Changes apply instantly — no redeploy."
          />
          <CardContent>
            <FormControl size="small" sx={{ minWidth: 260, mb: 5 }}>
              <InputLabel id="prov-bot">Bot</InputLabel>
              <Select
                labelId="prov-bot"
                label="Bot"
                value={botId}
                onChange={(e) => setBotId(String(e.target.value))}
              >
                {bots.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {!bots.length && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Create a bot first to choose its channel providers.
              </Typography>
            )}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && (
              <Grid container spacing={5}>
                {channels.map((ch) => {
                  const active = activeProvider(ch);
                  const unsafeActive = active && !active.productionSafe;
                  return (
                    <Grid item xs={12} md={6} key={ch.channel}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                            sx={{ mb: 3 }}
                          >
                            <Icon
                              icon={channelIcon[ch.channel] || 'carbon:connect'}
                              fontSize={26}
                            />
                            <Typography variant="h6">
                              {humanize(ch.channel)}
                            </Typography>
                            {unsafeActive && (
                              <Tooltip
                                title="This provider is not production-safe (e.g. OpenWA risks number bans). Use for dev/testing only."
                                arrow
                              >
                                <Chip
                                  size="small"
                                  color="warning"
                                  label="Dev only"
                                  icon={<Icon icon="bx:error" fontSize={14} />}
                                />
                              </Tooltip>
                            )}
                          </Stack>

                          {ch.providers.length === 0 ? (
                            <Typography variant="body2" color="text.disabled">
                              No providers registered for this channel.
                            </Typography>
                          ) : (
                            <FormControl fullWidth size="small">
                              <InputLabel id={`prov-${ch.channel}`}>
                                Active Provider
                              </InputLabel>
                              <Select
                                labelId={`prov-${ch.channel}`}
                                label="Active Provider"
                                value={ch.active || ''}
                                onChange={(e) => handleChange(ch.channel, e)}
                              >
                                {ch.providers.map((p) => (
                                  <MenuItem key={p.providerId} value={p.providerId}>
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      spacing={1}
                                    >
                                      <span>{p.displayName}</span>
                                      {!p.productionSafe && (
                                        <Chip
                                          size="small"
                                          color="warning"
                                          label="dev"
                                          sx={{ height: 18, fontSize: 10 }}
                                        />
                                      )}
                                    </Stack>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default MessagingProviders;
