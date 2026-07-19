/**
 * Upload home/* static images only. For all assets use upload-static-assets.cjs.
 *
 *   node scripts/upload-home-assets.cjs
 */
if (!process.argv.some((a) => a.startsWith("--only="))) {
  process.argv.push("--only=home");
}
require("./upload-static-assets.cjs");
