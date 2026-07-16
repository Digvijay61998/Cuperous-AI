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
