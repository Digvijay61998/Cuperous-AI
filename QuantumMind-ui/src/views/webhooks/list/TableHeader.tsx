// ** MUI Imports
import { Ref, useState, forwardRef, ReactElement } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// ** Next Import
import Link from 'next/link';
// ** Icon Imports
import Icon from 'src/@core/components/icon';

import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import { styled } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CardContent from '@mui/material/CardContent';
import Fade, { FadeProps } from '@mui/material/Fade';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { addNewWebhook } from 'src/store/apps/webhook';
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'src/store';
import { LoadingButton } from '@mui/lab';
import ViewInJson from './ViewInJSON';
interface TableHeaderProps {
  value: string;
  handleFilter: (val: string) => void;
}

const StyledLink = styled('a')(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  cursor: 'pointer',
  textDecoration: 'none',
  color: theme.palette.text.secondary,
  '&:hover': {
    color: theme.palette.primary.main,
  },
}));

const TableHeader = (props: TableHeaderProps) => {
  // ** Props
  const { handleFilter, value } = props;

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();

  const [show, setShow] = useState<boolean>(false);
  const [languages, setLanguages] = useState<string[]>([]);

  const handleChange = (event: SelectChangeEvent<typeof languages>) => {
    const {
      target: { value },
    } = event;
    setLanguages(typeof value === 'string' ? value.split(',') : value);
  };

  const Transition = forwardRef(function Transition(
    props: FadeProps & { children?: ReactElement<any, any> },
    ref: Ref<unknown>,
  ) {
    return <Fade ref={ref} {...props} />;
  });

  const initialWebhookDetail = {
    name: '',
    url: '',
    verifyToken: '',
    headersKey: '',
    headersValue: '',
    basicAuthUsername: '',
    basicAuthPassword: '',
    // events:"",
    // isActive:true,
  };
  const [webhookDetails, setWebhookDetails] =
    useState<any>(initialWebhookDetail);

  // Handle add webhook dialog
  const handleSubmitWebhook = (event: any) => {
    event.preventDefault();
    setIsLoading(true);
    dispatch(addNewWebhook(webhookDetails));
    setIsLoading(false);
    setShow(false);
    setWebhookDetails(initialWebhookDetail);
  };
  const handleCancelWebhook = () => {
    setShow(false);
    setWebhookDetails(initialWebhookDetail);
  };

  return (
    <Box
      sx={{
        p: 6,
        gap: 4,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ fontSize: '1.25rem', fontWeight: 500 }}>
        Webhooks List
      </span>
      <Box
        sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <TextField
          size="small"
          value={value}
          placeholder="Search Webhook"
          onChange={(e) => handleFilter(e.target.value)}
        />

        <Button variant="contained" onClick={() => setShow(true)}>
          Add Webhook
        </Button>
      </Box>

      <Dialog
        open={show}
        scroll="body"
        onClose={() => setShow(false)}
        onBackdropClick={() => setShow(false)}
      >
        <form onSubmit={handleSubmitWebhook}>
          <DialogContent
            sx={{
              pb: 8,
              px: { xs: 12, sm: 15 },
              pt: { xs: 8, sm: 12.5 },
              position: 'relative',
            }}
          >
            <IconButton
              size="small"
              onClick={() => handleCancelWebhook()}
              sx={{ position: 'absolute', right: '1rem', top: '1rem' }}
            >
              <Icon icon="bx:x" />
            </IconButton>
            <Box sx={{ mb: 8, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 3 }}>
                Add Webhook Information
              </Typography>
         
              <Typography>
                If you want respsone looks like a bot response you can refer this json link (refer link <ViewInJson/>)
                and send webhook response in this format. or you can only send sigle object in response. 
              </Typography>
              <Typography variant="body2">
                <Link href={`/documentation/webhook`} passHref>
                  <StyledLink>You can refer our documentation.</StyledLink>
                </Link>
              </Typography>
            </Box>
            <Grid container spacing={6}>
              <Grid item sm={6} xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  required
                  value={webhookDetails.name}
                  label="Webhook Name"
                  placeholder="John Doe"
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      name: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item sm={6} xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  required
                  value={webhookDetails?.url}
                  label="Webhook URL"
                  placeholder="URL"
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      url: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item sm={12} xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  required
                  value={webhookDetails?.verifyToken}
                  label="Verification Token"
                  placeholder="token"
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      verifyToken: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  type="password"
                />
              </Grid>

              <Grid item sm={12} xs={12}>
                <span>
                  <b>Basic Auth</b>
                </span>
              </Grid>

              <Grid item sm={6} xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  label="User Name"
                  placeholder="johnDoe"
                  value={webhookDetails?.basicAuthUsername}
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      basicAuthUsername: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item sm={6} xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  type="password"
                  label="Password"
                  placeholder="*****"
                  value={webhookDetails?.basicAuthPassword}
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      basicAuthPassword: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item sm={12} xs={12}>
                <span>
                  <b>Headers</b>
                </span>
              </Grid>

              <Grid item sm={6} xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  label="Enter Key"
                  placeholder="header key"
                  value={webhookDetails?.headersKey}
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      headersKey: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item sm={6} xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  label="Enter Value"
                  placeholder="header value"
                  value={webhookDetails?.headersValue}
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      headersValue: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions
            sx={{ pb: { xs: 8, sm: 12.5 }, justifyContent: 'center' }}
          >
            <LoadingButton
              loading={isLoading}
              variant="contained"
              sx={{ mr: 1 }}
              // onClick={() => handleSubmitWebhook()}
              type="submit"
            >
              Submit
            </LoadingButton>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => handleCancelWebhook()}
            >
              Cancel
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default TableHeader;
