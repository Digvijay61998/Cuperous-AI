
const environments = {
  api: process.env.NEXT_PUBLIC_API_URL || 'http://3.6.4.121:4000/api',
  baseurl: process.env.NEXT_PUBLIC_API_URL || 'http://3.6.4.121:4000',
  scraperUrl: process.env.NEXT_PUBLIC_SCRAPER_URL || 'http://3.6.4.121:4001',
  paymentsUrl : process.env.NEXT_PAYMENT_URL || 'http://localhost:3007',
  // Hosted widget bundle (plugin.js) served statically from S3 via Cloudflare.
  // The embed snippet imports the script from here; the widget's own API/socket
  // calls still go to `baseurl` (the backend) at runtime.
  widgetUrl: process.env.NEXT_PUBLIC_WIDGET_URL || 'https://templates.jarcube.com/widget/plugin.js'
};

export default environments;
