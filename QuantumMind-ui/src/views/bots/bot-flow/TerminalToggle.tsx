import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Switch from '@mui/material/Switch';
import { TERMINAL_HELP } from './terminal';

type Props = {
  checked: boolean;
  onChange: (on: boolean) => void;
  /** Unique per editor so the help text is announced with the switch. */
  idPrefix: string;
};

/** "End of conversation" switch for SUCCESS, FAILURE, TIMEOUT and BOT_RESPONSE nodes. */
export default function TerminalToggle({ checked, onChange, idPrefix }: Props) {
  const helpId = `${idPrefix}-terminal-help`;
  return (
    <FormControl sx={{ mt: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            inputProps={{ 'aria-describedby': helpId }}
          />
        }
        label="End of conversation (terminal)"
      />
      <FormHelperText id={helpId} sx={{ mx: 0 }}>
        {TERMINAL_HELP}
      </FormHelperText>
    </FormControl>
  );
}
