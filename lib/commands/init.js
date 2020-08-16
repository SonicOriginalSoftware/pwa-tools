// Initializes a repository with the pwa-shell and pwa-server

import { fetch } from "../net/http2_client.js"

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
  try {
    var [
      [pwa_shell_headers, pwa_shell_data],
      [pwa_server_headers, pwa_server_data],
    ] = await Promise.all([
      fetch(pwa_shell_archive_url, {follow_redirects: true, timeout: 5000}),
      fetch(pwa_server_archive_url, {follow_redirects: true, timeout: 5000}),
    ])
  } catch (err) {
    return Promise.reject(err)
  }

  // TODO Extract the pwa_shell_data and pwa_server_data
  // And write them to the target_directory

  return Promise.resolve()
}
