import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { toast } from 'react-hot-toast';
import { useAuth } from 'src/hooks/useAuth';
import Axios from 'src/helper/Axios';
import { RoleEnum } from 'src/utils/role.enum';
import {
  listCountries,
  listTimeZones,
  OrgSettingsView,
  previewNow,
  zoneToSave,
} from 'src/views/organization/orgSettings';

/**
 * Organization settings: country and time zone (R22). Dates shown to
 * visitors and written into summaries and emails use the effective zone:
 * explicit zone, else the country's default, else UTC.
 */
const OrganizationSettingsPage = () => {
  const { user } = useAuth();
  const canEdit = user?.role === RoleEnum.ORG_ADMIN;

  const countries = useMemo(() => listCountries(), []);
  const zones = useMemo(() => listTimeZones(), []);

  const [loaded, setLoaded] = useState<OrgSettingsView | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [country, setCountry] = useState<string | null>(null);
  const [zone, setZone] = useState<string>('');
  const [useCountryDefault, setUseCountryDefault] = useState(true);

  const apply = (s: OrgSettingsView) => {
    setLoaded(s);
    setCountry(s.country);
    setUseCountryDefault(!s.timeZone);
    setZone(s.timeZone || s.effectiveTimeZone);
  };

  const load = async () => {
    setLoadError(false);
    try {
      const res = await Axios.get('/me/organization/settings');
      apply(res.data);
    } catch {
      setLoadError(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Preview of the zone after saving. A country default for a NEW country is
  // derived on the server, so it is only previewed once saved (no guessing).
  const effectiveZone = useCountryDefault
    ? country === loaded?.country
      ? loaded?.countryDefaultTimeZone || (country ? '' : 'UTC')
      : country
      ? ''
      : 'UTC'
    : zone;

  const save = async () => {
    setSaving(true);
    try {
      const res = await Axios.patch('/me/organization/settings', {
        country: country || null,
        timeZone: zoneToSave(zone, useCountryDefault),
      });
      apply(res.data);
      toast.success('Organization settings saved');
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  // Never render editable defaults when the current values failed to load:
  // a save would silently overwrite the real settings.
  if (loadError) {
    return (
      <Card>
        <CardContent>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={load}>
                Retry
              </Button>
            }
          >
            Organization settings could not be loaded.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!loaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedCountry = countries.find((c) => c.code === country) || null;

  return (
    <Card>
      <CardHeader
        title="Organization settings"
        subheader="Dates shown to visitors, in summaries and in emails use this time zone."
      />
      <CardContent>
        {!canEdit && (
          <Alert severity="info" sx={{ mb: 4 }}>
            Only an organization admin can change these settings.
          </Alert>
        )}
        <Grid container spacing={5}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={countries}
              value={selectedCountry}
              disabled={!canEdit}
              getOptionLabel={(o) => `${o.name} (${o.code})`}
              isOptionEqualToValue={(a, b) => a.code === b.code}
              onChange={(_e, v) => setCountry(v?.code ?? null)}
              renderInput={(params) => (
                <TextField {...params} label="Country" helperText="Sets the default time zone." />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={useCountryDefault}
                  disabled={!canEdit}
                  onChange={(e) => setUseCountryDefault(e.target.checked)}
                />
              }
              label="Use the country's default time zone"
            />
            <Autocomplete
              sx={{ mt: 2 }}
              options={zones}
              value={useCountryDefault ? null : zone || null}
              disabled={!canEdit || useCountryDefault}
              onChange={(_e, v) => setZone(v || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Time zone"
                  helperText={useCountryDefault ? 'Following the country default.' : 'IANA time zone'}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Currently in effect: <strong>{loaded.effectiveTimeZone}</strong>
              {loaded.effectiveTimeZone && ` — ${previewNow(loaded.effectiveTimeZone)}`}
            </Typography>
            {effectiveZone && effectiveZone !== loaded.effectiveTimeZone && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                After saving: <strong>{effectiveZone}</strong> — {previewNow(effectiveZone)}
              </Typography>
            )}
            {useCountryDefault && country && country !== loaded.country && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                The default time zone for the new country is applied when you save.
              </Typography>
            )}
          </Grid>
          {canEdit && (
            <Grid item xs={12}>
              {/* A custom zone must be picked; saving an empty one would
                  silently fall back to the country default. */}
              <Button
                variant="contained"
                onClick={save}
                disabled={saving || (!useCountryDefault && !zone)}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default OrganizationSettingsPage;
