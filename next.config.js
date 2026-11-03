/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /*
   * 开发模式使用独立的构建目录。
   * 之前 `next dev` 与 `next start` 共用 .next，开发服务会在后台不断重写它，
   * 导致运行中的生产服务 chunk 失效（Cannot find module './xxx.js' → 全站 500），
   * 同时让「生产构建」的启动速度失去意义。分开后互不干扰。
   */
  distDir: isDev ? '.next-dev' : '.next',
  experimental: {
    /*
     * 客户端路由缓存：默认对动态页面（本项目所有页面都依赖 cookie，属于动态渲染）
     * 缓存时间为 0，来回切换时每次都要重新请求服务端。给到 60s 后，
     * 短时间内的前进/后退与重复切换直接命中缓存，不再触发服务端渲染。
     * 数据变更后统一走 router.refresh()，不会读到过期数据。
     */
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

module.exports = nextConfig;
