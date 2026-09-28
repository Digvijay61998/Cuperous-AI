// ** React Imports
import { useEffect } from 'react';

// ** MUI Imports
import Box, { BoxProps } from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LoadingButton } from '@mui/lab';

// ** Third Party Imports
import { Controller, useForm } from 'react-hook-form';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'src/store';
import { createCompany, updateCompany } from 'src/store/apps/crm';

interface Props {
  open: boolean;
  toggle: () => void;
  company?: any;
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
  domain: string;
  website: string;
  industry: string;
  city: string;
  country: string;
  phone: string;
  email: string;
}

const emptyValues: FormValues = {
  name: '',
  domain: '',
  website: '',
  industry: '',
  city: '',
  country: '',
  phone: '',
  email: '',
};

const CompanyDrawer = ({ open, toggle, company }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const isEdit = Boolean(company?.id);

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: emptyValues, mode: 'onChange' });

  useEffect(() => {
    if (open) {
      reset({
        name: company?.name || '',
        domain: company?.domain || '',
        website: company?.website || '',
        industry: company?.industry || '',
        city: company?.city || '',
        country: company?.country || '',
        phone: company?.phone || '',
        email: company?.email || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, company]);

  const handleClose = () => {
    reset(emptyValues);
    toggle();
  };

  const onSubmit = async (data: FormValues) => {
    const payload: Record<string, any> = {
      name: data.name.trim(),
      domain: data.domain.trim() || undefined,
      website: data.website.trim() || undefined,
      industry: data.industry.trim() || undefined,
      city: data.city.trim() || undefined,
      country: data.country.trim() || undefined,
      phone: data.phone.trim() || undefined,
      email: data.email.trim() || undefined,
    };
    try {
      if (isEdit) {
        await dispatch(updateCompany({ id: company.id, data: payload })).unwrap();
      } else {
        await dispatch(createCompany(payload)).unwrap();
      }
      handleClose();
    } catch {
      // toast handled in thunk
    }
  };

  const textField = (name: keyof FormValues, label: string, required = false) => (
    <FormControl fullWidth sx={{ mb: 5 }}>
      <Controller
        name={name}
        control={control}
        rules={required ? { required: `${label} is required` } : undefined}
        render={({ field }) => (
          <TextField {...field} size="small" label={label} error={Boolean(errors[name])} />
        )}
      />
      {errors[name] && (
        <FormHelperText sx={{ color: 'error.main' }}>
          {errors[name]?.message as string}
        </FormHelperText>
      )}
    </FormControl>
  );

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
        <Typography variant="h6">{isEdit ? 'Edit Company' : 'Add Company'}</Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: 'text.primary' }}>
          <Icon icon="bx:x" fontSize={20} />
        </IconButton>
      </Header>
      <Box sx={{ p: 5 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {textField('name', 'Company Name', true)}
          {textField('domain', 'Domain')}
          {textField('website', 'Website')}
          {textField('industry', 'Industry')}
          {textField('city', 'City')}
          {textField('country', 'Country')}
          {textField('phone', 'Phone')}
          {textField('email', 'Email')}

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

export default CompanyDrawer;
