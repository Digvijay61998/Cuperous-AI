// ** React Imports
import { ReactNode, useState } from 'react';

// ** Next Imports

// ** MUI Components
import Box, { BoxProps } from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import { styled, useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Third Party Imports
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import Logo from 'src/@core/components/logo';
import * as yup from 'yup';
// ** Hooks
import useBgColor, { UseBgColorType } from 'src/@core/hooks/useBgColor';
import { useSettings } from 'src/@core/hooks/useSettings';
import { useAuth } from 'src/hooks/useAuth';

// ** Configs
import themeConfig from 'src/configs/themeConfig';

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout';
import { Link } from '@mui/material';

// ** Styled Components
const LoginIllustration = styled('img')({
  height: 'auto',
  maxWidth: '100%',
});
const ServicesIllustration = styled('img')({
  height: 'auto',
  maxWidth: '100%',
});

const RightWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6),

  [theme.breakpoints.up('lg')]: {
    maxWidth: 480,
  },
  [theme.breakpoints.up('xl')]: {
    maxWidth: 635,
  },
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(12),
  },
}));

const LinkStyled = styled('a')(({ theme }) => ({
  fontSize: '0.875rem',
  textDecoration: 'none',
  color: theme.palette.primary.main,
}));

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(4).required(),
});

const defaultValues = {
  password: process.env.NEXT_PUBLIC_PASSWORD || '',
  email: process.env.NEXT_PUBLIC_EMAIL || '',
};

interface FormData {
  email: string;
  password: string;
}

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // ** Hooks
  const auth = useAuth();
  const theme = useTheme();
  const { settings } = useSettings();
  const bgColors: UseBgColorType = useBgColor();
  const hidden = useMediaQuery(theme.breakpoints.down('lg'));

  // ** Var
  const { skin } = settings;

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    const { email, password } = data;
    auth.login({ email, password }, () => {
      setError('email', {
        type: 'manual',
        message: 'Email or Password is invalid',
      });
    });
  };

  return (
    <Box
      sx={{
        backgroundImage: 'url(/image-files/pages/login.svg)',
        backgroundSize: 'cover',
        display:'flex',
        justifyContent:'space-around'
      }}
    >
      <RightWrapper
        sx={{
          ...(skin === 'bordered' &&
            !hidden && { borderLeft: `1px solid ${theme.palette.divider}` }),
        }}
      >
        <Box sx={{ mx: 'auto', maxWidth: 700,padding:'1rem' }}>
          <Box sx={{ mb: 8, display: 'flex', alignItems: 'center'}}>
            <Logo width={60} height={60} />
            <Typography
              variant="h5"
              sx={{
                ml: 2,
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: '-0.45px',
                textTransform: 'capitalize',
                fontSize: '1.45rem !important',
              }}
            >
              {themeConfig.templateName}
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{ mb: 1.5, }}
          >
            Welcome to {themeConfig.templateName}
          </Typography>
          <Typography
            sx={{ mb: 6, color: 'text.secondary', }}
          >
            Please sign-in to your account and start the adventure
          </Typography>
          <form noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <FormControl fullWidth sx={{ mb: 4 }}>
              <Controller
                name="email"
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextField
                    autoFocus
                    label="Email"
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    error={Boolean(errors.email)}
                    placeholder="abc@example.com"
                  />
                )}
              />
              {errors.email && (
                <FormHelperText sx={{ color: 'error.main' }}>
                  {errors.email.message}
                </FormHelperText>
              )}
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel
                htmlFor="auth-login-v2-password"
                error={Boolean(errors.password)}
              >
                Password
              </InputLabel>
              <Controller
                name="password"
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <OutlinedInput
                    value={value}
                    onBlur={onBlur}
                    label="Password"
                    onChange={onChange}
                    id="auth-login-v2-password"
                    error={Boolean(errors.password)}
                    type={showPassword ? 'text' : 'password'}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <Icon
                            fontSize={20}
                            icon={showPassword ? 'bx:show' : 'bx:hide'}
                          />
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                )}
              />
              {errors.password && (
                <FormHelperText sx={{ color: 'error.main' }} id="">
                  {errors.password.message}
                </FormHelperText>
              )}
            </FormControl>
            <Box
              sx={{
                mb: 4,
              
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              <FormControlLabel
                label="Remember Me"
                control={<Checkbox />}
                sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.875rem',
                  },
                }}
              /> 
              <Button
              color="secondary"
              size="small"
              style={{fontSize:'inherit'}}> 
               <Link href="#" style={{fontSize:'.8rem', color:'gray'}}>
                Forgot Password?
                </Link>
              </Button>
            </Box>
     
            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              sx={{
                mb: 4,
                // Brand gradient from the JarCube logo, replacing the hardcoded blue #2241FF.
                background: theme => theme.palette.customColors.logoGradient,
                '&:hover': {
                  background: theme => theme.palette.customColors.logoGradient,
                  filter: 'brightness(1.08)'
                }
              }}
            >
              Log in
            </Button>
          </form>
          {/* <div>
            Don't have an account?<Button >Sign up</Button>
          </div> */}
        </Box>
  
      </RightWrapper>
      <Box className="content-right">
        {!hidden ? (
          <Box
            sx={{
              p: 12,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              flexDirection: 'column',
              margin:'auto'
            }}
       >
            <LoginIllustration
              width={800}
              sx={{ mt: 10 }}
              alt="login-illustration"
              // src={`/image-files/pages/chatbotLogin-${theme.palette.mode}.png`}
              src={`/image-files/pages/loginWoman.svg`}
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

LoginPage.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>;

LoginPage.guestGuard = true;

export default LoginPage;
