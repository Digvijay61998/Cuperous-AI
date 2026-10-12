// ** MUI Imports
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip';

// ** Utils
import { identifierRows } from './contactIdentifiers';

/**
 * Every email / phone / platform id a contact has given, Current ones marked
 * (crm-plugins-service-desk R21.6). Earlier values are kept so the person
 * stays one contact when they change their email or number.
 */
const ContactIdentifiersList = ({ record }: { record: any }) => {
  const rows = identifierRows(record || {});
  if (!rows.length) return null;

  return (
    <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }} aria-label="Contact details">
      {rows.map((r) => (
        <Box
          component="li"
          key={r.key}
          sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, opacity: r.isCurrent ? 1 : 0.7 }}
        >
          <Icon icon={r.icon} fontSize={18} aria-hidden />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
              {r.kindLabel}
              {r.sourceLabel ? ` · ${r.sourceLabel}` : ''}
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-word', fontWeight: r.isCurrent ? 600 : 400 }}>
              {r.value}
            </Typography>
          </Box>
          {r.isCurrent && (r.kind === 'EMAIL' || r.kind === 'PHONE') ? (
            <CustomChip rounded skin="light" size="small" color="success" label="Current" />
          ) : !r.isCurrent && r.lastSeenAt ? (
            <Tooltip title={`Last given ${new Date(r.lastSeenAt).toLocaleDateString()}`}>
              <Typography variant="caption" color="text.disabled">
                Earlier
              </Typography>
            </Tooltip>
          ) : null}
        </Box>
      ))}
    </Box>
  );
};

export default ContactIdentifiersList;
