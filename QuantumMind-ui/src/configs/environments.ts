
const environments = {
  api: process.env.NEXT_PUBLIC_API_URL || 'http://3.6.4.121:4000/api',
  baseurl: process.env.NEXT_PUBLIC_API_URL || 'http://3.6.4.121:4000',
  scraperUrl: process.env.NEXT_PUBLIC_SCRAPER_URL || 'http://3.6.4.121:4001',
  paymentsUrl : process.env.NEXT_PAYMENT_URL || 'http://localhost:3007'
};

export default environments;
