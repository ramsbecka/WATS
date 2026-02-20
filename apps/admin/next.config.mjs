/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { 
    ignoreDuringBuilds: false,
    // Allow img tags for external images that Next.js Image can't handle
    dirs: ['src'],
  },
  typescript: { ignoreBuildErrors: false },
  
  // Deployment configuration
  output: 'standalone', // For server-side rendering (Vercel/Netlify)
  // output: 'export', // For static export (GitHub Pages) - uncomment if needed
  
  // For GitHub Pages, uncomment these:
  // basePath: '/WATS',
  // assetPrefix: '/WATS/',
  
  reactStrictMode: true,
  swcMinify: true,
  
  // Images
  images: {
    domains: ['placeholder.supabase.co'],
    unoptimized: false, // Set true for static export
  },
};

export default nextConfig;
