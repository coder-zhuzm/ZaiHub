/*
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-22 17:05:14
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-22 21:55:47
 */
/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiPort = process.env.API_PORT ?? '8000';
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '..', '..'),
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:${apiPort}/:path*`,
      },
    ];
  },
};

export default nextConfig;
