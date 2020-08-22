import { fetch } from "../net/http2_client.js"
import { unzip } from "../unzipper/unzip.js"

/**
 * @param {String} pwa_shell_archive_url
 * @param {String} pwa_server_archive_url
 * @param {String} target_directory
 */
export async function init(
  pwa_shell_archive_url,
  pwa_server_archive_url,
  target_directory
) {
  const [pwa_shell_response, pwa_server_response] = await Promise.all([
    fetch(pwa_shell_archive_url, { follow_redirects: true, timeout: 5000 }),
    fetch(pwa_server_archive_url, { follow_redirects: true, timeout: 5000 }),
  ])

  await Promise.all([
    // @ts-ignore
    unzip(pwa_shell_response.data, target_directory + "/pwa-shell/"),
    // @ts-ignore
    unzip(pwa_server_response.data, target_directory + "/pwa-server/"),
  ])
  return Promise.resolve()
}
