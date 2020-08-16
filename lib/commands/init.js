// Initializes a repository with the pwa-shell and pwa-server

import { fetch } from "../net/http2_client.js"
import { writeFile } from "fs"

const archive_encoding = "binary"

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

  try {
    await Promise.all([
      new Promise((resolve) =>
        writeFile(
          target_directory + "/pwa-shell.zip",
          pwa_shell_response.data,
          { encoding: archive_encoding },
          () => resolve()
        )
      ),
      new Promise((resolve) =>
        writeFile(
          target_directory + "/pwa-server.zip",
          pwa_server_response.data,
          { encoding: archive_encoding },
          () => resolve()
        )
      ),
    ])
  } catch (err) {
    return Promise.reject(err)
  }

  // TODO Extract the pwa_shell_data and pwa_server_data
  // And write them to the target_directory

  return Promise.resolve()
}
