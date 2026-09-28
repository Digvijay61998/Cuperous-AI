// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Box, { BoxProps } from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LoadingButton } from '@mui/lab';

// ** Third Party Imports
import { Controller, useForm } from 'react-hook-form';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { createDeal, fetchCompanies, updateDeal } from 'src/store/apps/crm';

// ** Utils
import { DEAL_STAGES, humanize } from 'src/views/crm/utils';

interface Props {
  open: boolean;
  toggle: () => void;
  deal?: any;
}

const Header = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default,
}));

interface FormValues {
  name: string;
  amount: string;
  currency: string;
  expectedCloseDate: string;
}

const emptyValues: FormValues = {
  name: '',
  amount: '',
  currency: 'USD',
  expectedCloseDate: '',
};

const DealDrawer = ({ open, toggle, deal }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const isEdit = Boolean(deal?.id);
  const companies = useSelector((state: RootState) => state.crm.companies.data);

  const [companyId, setCompanyId] = useState<string>('');
  const [stage, setStage] = useState<string>('DEMO_BOOKED');
  const [companyError, setCompanyError] = useState<boolean>(false);

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: emptyValues, mode: 'onChange' });

  useEffect(() => {
    if (open) {
      if (!isEdit) dispatch(fetchCompanies({ pageSize: 100 }));
      reset({
        name: deal?.name || '',
        amount: deal?.amount != null ? String(deal.amount) : '',
        currency: deal?.currency || 'USD',
        expectedCloseDate: deal?.expectedCloseDate
          ? String(deal.expectedCloseDate).slice(0, 10)
          : '',
      });
      setCompanyId(deal?.company?.id || '');
      setStage(deal?.stage || 'DEMO_BOOKED');
      setCompanyError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deal]);

  const handleClose = () => {
    reset(emptyValues);
    toggle();
  };

  const onSubmit = async (data: FormValues) => {
    if (!isEdit && !companyId) {
      setCompanyError(true);
      return;
    }
    const amount = data.amount.trim() === '' ? undefined : Number(data.amount);
    const common = {
      name: data.name.trim(),
      amount,
      currency: data.currency.trim() || 'USD',
      expectedCloseDate: data.expectedCloseDate || undefined,
    };
    try {
      if (isEdit) {
        await dispatch(updateDeal({ id: deal.id, data: common })).unwrap();
      } else {
        await dispatch(
          createDeal({ ...common, companyId, stage }),
        ).unwrap();
      }
      handleClose();
    } catch {
      // toast handled in thunk
    }
  };

  return (
    <Drawer
      open={open}
      anchor="right"
      variant="temporary"
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 450 } } }}
    >
      <Header>
        <Typography variant="h6">{isEdit ? 'Edit Deal' : 'Add Deal'}</Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: 'text.primary' }}>
          <Icon icon="bx:x" fontSize={20} />
        </IconButton>
      </Header>
      <Box sx={{ p: 5 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl fullWidth sx={{ mb: 5 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Deal name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  label="Deal Name"
                  error={Boolean(errors.name)}
                />
              )}
            />
            {errors.name && (
              <FormHelperText sx={{ color: 'error.main' }}>
                {errors.name.message}
              </FormHelperText>
            )}
          </FormControl>

          {!isEdit && (
            <FormControl fullWidth size="small" sx={{ mb: 5 }} error={companyError}>
              <InputLabel id="deal-company">Company</InputLabel>
              <Select
                labelId="deal-company"
                label="Company"
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setCompanyError(false);
                }}
              >
                {(companies || []).map((c: any) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
              {companyError && <FormHelperText>Company is required</FormHelperText>}
            </FormControl>
          )}

          {!isEdit && (
            <FormControl fullWidth size="small" sx={{ mb: 5 }}>
              <InputLabel id="deal-stage">Stage</InputLabel>
              <Select
                labelId="deal-stage"
                label="Stage"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                {DEAL_STAGES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {humanize(s)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth sx={{ mb: 5 }}>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <TextField {...field} size="small" type="number" label="Amount" />
              )}
            />
          </FormControl>

          <FormControl fullWidth sx={{ mb: 5 }}>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <TextField {...field} size="small" label="Currency" inputProps={{ maxLength: 3 }} />
              )}
            />
          </FormControl>

          <FormControl fullWidth sx={{ mb: 5 }}>
            <Controller
              name="expectedCloseDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  type="date"
                  label="Expected Close Date"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <LoadingButton
              size="large"
              type="submit"
              variant="contained"
              loading={isSubmitting}
              sx={{ mr: 3 }}
            >
              {isEdit ? 'Save' : 'Create'}
            </LoadingButton>
            <Button size="large" variant="outlined" color="secondary" onClick={handleClose}>
              Cancel
            </Button>
          </Box>
        </form>
      </Box>
    </Drawer>
  );
};

export default DealDrawer;
