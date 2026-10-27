/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // The Next.js image optimizer endpoint (/_next/image) carried critical
    // unauthenticated-RCE advisories on the old Next 14 line (SVG/AVIF handling).
    // Next 16 patches them, but images here are already served optimised by
    // Cloudinary, so the optimizer stays off (less attack surface) and
    // switched off and proxy.ts also refuses the endpoint outright.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Browser security headers for every response. This is an admin console, so
  // it must never be embeddable in another site (clickjacking).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            // Deliberately only the directives that cannot break the app: no
            // framing, no <base> hijack, no plugins, forms post to ourselves.
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  // Proxy API requests to backend (optional — can also use direct CORS)
  async rewrites() {
    return [
      // Uncomment below to proxy API calls through Next.js:
      // {
      //   source: "/api/v1/:path*",
      //   destination: "http://localhost:4500/api/v1/:path*",
      // },
    ];
  },
};

export default nextConfig;
