/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

/** @type {import('next').NextConfig} */

// Remove this if you're not using Fullcalendar features
const withTM = require('next-transpile-modules')([
  '@fullcalendar/common',
  '@fullcalendar/react',
  '@fullcalendar/daygrid',
  '@fullcalendar/list',
  '@fullcalendar/timegrid',
]);

module.exports = withTM({
  reactStrictMode: false,

  // Static export (SPA) for S3 hosting. `next export` emits a static `out/`
  // folder with no server. trailingSlash makes each route a folder with its
  // own index.html so S3/Cloudflare serve deep links cleanly. Image
  // optimization needs a server, so it is disabled for the static build.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },

  experimental: {
    esmExternals: false,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(
        __dirname,
        './node_modules/apexcharts-clevision',
      ),
    };

    return config;
  },
  
});

