import axios from 'axios';
import { toast } from 'react-hot-toast';
import env from 'src/configs/environments';

const instance = axios.create({
  baseURL: env.baseurl + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

//Make another instance here for payment ms 
export const paymentInstane  = axios.create(
  {
    baseURL :  env.paymentsUrl + "/paymentms/api/v1/" , 
    headers  : {
      'Content-Type' : 'application/json'
    }
  }
)

if (typeof window !== 'undefined') {
  instance.interceptors.request.use(
    (config: any) => {
      const token = window.localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = 'Bearer ' + token;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );
  instance.interceptors.response.use(
    (res) => {
      return res;
    },
    async (err) => {
      const originalConfig = err.config;

      // Only a 401 means the session is gone. 403 (role/feature/suspended) and
      // 404 must surface to the caller, not log the user out.
      if (err.response?.status !== 401) {
        return Promise.reject(err);
      }

      // An expired impersonation token has no refresh token by design: return
      // the super admin to their own console session instead of logging out.
      if (window.localStorage.getItem('impersonatingOrg')) {
        const access = window.localStorage.getItem('superAdminAccessToken');
        const refresh = window.localStorage.getItem('superAdminRefreshToken');
        ['impersonatingOrg', 'superAdminAccessToken', 'superAdminRefreshToken', 'userData'].forEach(
          (k) => window.localStorage.removeItem(k),
        );
        if (access) window.localStorage.setItem('accessToken', access);
        if (refresh) window.localStorage.setItem('refreshToken', refresh);
        toast.error('Impersonation session ended.');
        window.location.replace(access ? '/super-admin' : '/login');
        return Promise.reject(err);
      }

      if (originalConfig.url !== '/auth/login' && err.response) {
        const refreshToken: any = window.localStorage.getItem('refreshToken');
        if (!refreshToken) {
          window.localStorage.removeItem('userData');
          window.localStorage.removeItem('accessToken');

          window.location.replace('/login');
          return Promise.reject(err);
        }

        if (err.response.status === 401 && !originalConfig._retry) {
          originalConfig._retry = true;
          const token: any = window.localStorage.getItem('refreshToken');

          try {
            const rs: any = await instance.post('/auth/refresh', {
              token: token,
            });
            const { accessToken, refreshToken } = rs.data;
            window.localStorage.setItem('accessToken', accessToken);
            window.localStorage.setItem('refreshToken', refreshToken);
            return instance(originalConfig);
          } catch (_error) {
            window.localStorage.clear();
            window.location.replace('/login');
            toast.error('Your session has expired. Please login again.');
            return Promise.reject(_error);
          }
        }
      }
      return Promise.reject(err);
    },
  );
}

export default instance;
