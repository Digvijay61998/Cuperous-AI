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
import { createContact, updateContact } from 'src/store/apps/crm';

interface Props {
  open: boolean;
  toggle: () => void;
  contact?: any;
}

const Header = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default,
}));

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
}

const emptyValues: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  title: '',
};

const ContactDrawer = ({ open, toggle, contact }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const isEdit = Boolean(contact?.id);

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: emptyValues, mode: 'onChange' });

  useEffect(() => {
    if (open) {
      reset({
        firstName: contact?.firstName || '',
        lastName: contact?.lastName || '',
        email: contact?.email || '',
        phone: contact?.phone || '',
        title: contact?.title || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contact]);

  const handleClose = () => {
    reset(emptyValues);
    toggle();
  };

  const onSubmit = async (data: FormValues) => {
    const payload: Record<string, any> = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim() || undefined,
      email: data.email.trim() || undefined,
      phone: data.phone.trim() || undefined,
      title: data.title.trim() || undefined,
    };
    try {
      if (isEdit) {
        await dispatch(updateContact({ id: contact.id, data: payload })).unwrap();
      } else {
        await dispatch(createContact(payload)).unwrap();
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
        <Typography variant="h6">{isEdit ? 'Edit Contact' : 'Add Contact'}</Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: 'text.primary' }}>
          <Icon icon="bx:x" fontSize={20} />
        </IconButton>
      </Header>
      <Box sx={{ p: 5 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl fullWidth sx={{ mb: 5 }}>
            <Controller
              name="firstName"
              control={control}
              rules={{ required: 'First name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  label="First Name"
                  error={Boolean(errors.firstName)}
                />
              )}
            />
            {errors.firstName && (
              <FormHelperText sx={{ color: 'error.main' }}>
                {errors.firstName.message}
              </FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth sx={{ mb: 5 }}>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField {...field} size="small" label="Last Name" />
              )}
            />
          </FormControl>

          <FormControl fullWidth sx={{ mb: 5 }}>
            <Controller
              name="email"
              control={control}
              rules={{
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  label="Email"
                  error={Boolean(errors.email)}
                />
              )}
            />
            {errors.email && (
              <FormHelperText sx={{ color: 'error.main' }}>
                {errors.email.message}
              </FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth sx={{ mb: 5 }}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField {...field} size="small" label="Phone" />
              )}
            />
          </FormControl>

          <FormControl fullWidth sx={{ mb: 5 }}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField {...field} size="small" label="Job Title" />
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

export default ContactDrawer;
