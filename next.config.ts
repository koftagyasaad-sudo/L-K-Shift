import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextCodeConfig} */
const nextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
