/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { 
    ignoreDuringBuilds: false,
    // Allow img tags for external images that Next.js Image can't handle
    dirs: ['src'],
  },
  typescript: { ignoreBuildErrors: false },
  
  // Deployment configuration
  output: 'standalone', // Kwa server-side rendering (Vercel/Netlify)
  // output: 'export', // Kwa static export (GitHub Pages) - uncomment kama unahitaji
  
  // Kwa GitHub Pages, uncomment hizi:
  // basePath: '/WATS',
  // assetPrefix: '/WATS/',
  
  reactStrictMode: true,
  swcMinify: true,
  
  // Images
  images: {
    domains: ['placeholder.supabase.co'],
    unoptimized: false, // Set true kwa static export
  },
};

export default nextConfig;
