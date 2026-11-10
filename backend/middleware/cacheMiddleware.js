/**
 * FolkBoard Cache Control & Invalidation Middleware
 * Implements Section 7 Hybrid Caching Architecture:
 * - Stale-While-Revalidate for public games, rules, tutorials, and FAQs
 * - Strict No-Store / No-Cache for authentication, user profiles, matches, and bookmarks
 * - Version tracking for admin-driven public cache invalidation
 */

let publicContentVersion = Date.now();

/**
 * Bump the content version to invalidate browser Cache Storage after admin updates
 */
const bumpContentVersion = () => {
  publicContentVersion = Date.now();
  return publicContentVersion;
};

/**
 * Retrieve current public content version
 */
const getContentVersion = () => publicContentVersion;

/**
 * Middleware: Strictly prevent caching of private, authenticated, or mutating data
 */
const privateNoCache = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  });
  next();
};

/**
 * Middleware: Enable public HTTP Stale-While-Revalidate caching with content versioning
 */
const publicStaleWhileRevalidate = (maxAge = 600, staleWhileRevalidate = 1200) => {
  return (req, res, next) => {
    res.set({
      'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
      'x-content-version': publicContentVersion.toString(),
    });
    next();
  };
};

module.exports = {
  privateNoCache,
  publicStaleWhileRevalidate,
  bumpContentVersion,
  getContentVersion,
};

