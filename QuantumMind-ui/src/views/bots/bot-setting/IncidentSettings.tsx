// ** MUI Imports
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {
  CLOSURE_IDLE_DEFAULT,
  CLOSURE_IDLE_MAX,
  CLOSURE_IDLE_MIN,
  CONTACT_DEFAULTS,
  DEFAULT_CLOSING_MESSAGE,
  DEFAULT_CLOSURE_PROMPT,
  DEFAULT_HANDOVER_TEXT,
  DEFAULT_PROBLEM_QUESTION,
  FEATURE_LABELS,
  IncidentFeatureKey,
  aliasError,
  handoverPreview,
  idleMinutesError,
} from './incidentSettings';

interface Props {
  /** The bot settings object being edited (same object the form saves). */
  value: any;
  onChange: (next: any) => void;
}

/**
 * Settings for incident handover and CRM capture (crm-incident-handover 3.5).
 * Every field is optional: empty means "use the product default", shown as the
 * placeholder. Changes are saved with the rest of the bot settings.
 */
const IncidentSettings = ({ value, onChange }: Props) => {
  const features = value?.features || {};
  const mapping = value?.contactMapping || {};

  const setFeature = (key: IncidentFeatureKey, on: boolean) =>
    onChange({ ...value, features: { ...features, [key]: on } });
  const setField = (key: string, v: string) => onChange({ ...value, [key]: v });
  const setMapping = (key: 'name' | 'email' | 'phone', v: string) =>
    onChange({ ...value, contactMapping: { ...mapping, [key]: v } });

  const aliasHelp = (v: string | undefined, fallback: string) =>
    aliasError(v) || `Attribute that holds it. Default: ${fallback}`;

  return (
    <>
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        Agent requests and CRM
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        When these are on, every request for a person is recorded as an incident with a service request, and
        details visitors share are saved to the CRM.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(Object.entries(FEATURE_LABELS) as [IncidentFeatureKey, { label: string; help: string }][]).map(
          ([key, meta]) => (
            <Grid item xs={12} sm={6} key={key}>
              <FormControlLabel
                control={
                  <Switch
                    checked={features[key] === true}
                    onChange={(e) => setFeature(key, e.target.checked)}
                    inputProps={{ 'aria-describedby': `feature-${key}-help` }}
                  />
                }
                label={meta.label}
              />
              <Typography
                id={`feature-${key}-help`}
                variant="caption"
                sx={{ display: 'block', color: 'text.secondary', ml: 6 }}
              >
                {meta.help}
              </Typography>
            </Grid>
          ),
        )}
      </Grid>

      <Grid container spacing={5}>
        <Grid item xs={12}>
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            label="Message when a request is recorded"
            placeholder={DEFAULT_HANDOVER_TEXT}
            value={value?.handoverMessage ?? ''}
            onChange={(e) => setField('handoverMessage', e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`Use {{ticketId}} for the reference. Preview: ${handoverPreview(value?.handoverMessage)}`}
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField
            size="small"
            fullWidth
            label="Question when the problem is not known yet"
            placeholder={DEFAULT_PROBLEM_QUESTION}
            value={value?.problemQuestion ?? ''}
            onChange={(e) => setField('problemQuestion', e.target.value)}
            inputProps={{ maxLength: 500 }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            label="Problem attribute"
            placeholder={CONTACT_DEFAULTS.problem}
            value={value?.problemAlias ?? ''}
            onChange={(e) => setField('problemAlias', e.target.value)}
            error={!!aliasError(value?.problemAlias)}
            helperText={aliasHelp(value?.problemAlias, CONTACT_DEFAULTS.problem)}
          />
        </Grid>
        {(['name', 'email', 'phone'] as const).map((k) => (
          <Grid item xs={12} sm={4} key={k}>
            <TextField
              size="small"
              fullWidth
              label={`Contact ${k} attribute`}
              placeholder={CONTACT_DEFAULTS[k]}
              value={mapping[k] ?? ''}
              onChange={(e) => setMapping(k, e.target.value)}
              error={!!aliasError(mapping[k])}
              helperText={aliasHelp(mapping[k], CONTACT_DEFAULTS[k])}
            />
          </Grid>
        ))}
      </Grid>

      {/* Closure prompt (crm-incident-handover 6.6, R14). */}
      <Typography variant="subtitle1" sx={{ mt: 4, mb: 1 }}>
        Ending the conversation
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Used when "Ask if the query is resolved" is on. The visitor sees the question with the buttons "Yes,
        resolved", "I need something else" and "Start again".
      </Typography>
      <Grid container spacing={5}>
        <Grid item xs={12} sm={8}>
          <TextField
            size="small"
            fullWidth
            label="Question at the end of the flow"
            placeholder={DEFAULT_CLOSURE_PROMPT}
            value={value?.closurePromptText ?? ''}
            onChange={(e) => setField('closurePromptText', e.target.value)}
            inputProps={{ maxLength: 500 }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            label="Close after no reply (minutes)"
            placeholder={String(CLOSURE_IDLE_DEFAULT)}
            value={value?.closureIdleMinutes ?? ''}
            onChange={(e) => setField('closureIdleMinutes', e.target.value)}
            inputProps={{ inputMode: 'numeric', 'aria-describedby': 'closure-idle-help' }}
            error={!!idleMinutesError(value?.closureIdleMinutes)}
            helperText={
              <span id="closure-idle-help">
                {idleMinutesError(value?.closureIdleMinutes) ||
                  `${CLOSURE_IDLE_MIN} to ${CLOSURE_IDLE_MAX}. Default: ${CLOSURE_IDLE_DEFAULT}`}
              </span>
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            label="Closing message"
            placeholder={DEFAULT_CLOSING_MESSAGE}
            value={value?.closingMessage ?? ''}
            onChange={(e) => setField('closingMessage', e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText="Sent once when the chat closes, before the visitor sees the Start new chat option."
          />
        </Grid>
      </Grid>
    </>
  );
};

export default IncidentSettings;
