import { resolve } from "path"

import { fetch } from "../net/http2_client.js"
import { unzip } from "@sonicoriginalsoftware/unzipper/unzip.js"

const shell_unzip_folder = "shell"
const server_unzip_folder = "server"

/**
 * @param {String} search_path
 */
function find_package_file(search_path) {
  // Walk down the current directory until the package.json file is found
  // and then return the path to it
}

/** @param {String} target_directory */
function move_server_files(target_directory) {
  const package_root_path = find_package_file(server_unzip_folder)

  // Only want to move the security folder, the server.js, and the
  // server-config.json file to the target directory

  // Remove the containing folders
}

/** @param {String} target_directory */
function move_shell_files(target_directory) {
  const package_root_path = find_package_file(shell_unzip_folder)

  // Only move the package.json, the app folder, and the site folder of the
  // shell to the target directory

  // Remove the containing folders
}

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
  const [shell_response, server_response] = await Promise.all([
    fetch(pwa_shell_archive_url, { follow_redirects: true, timeout: 5000 }),
    fetch(pwa_server_archive_url, { follow_redirects: true, timeout: 5000 }),
  ])

  await Promise.all([
    unzip(shell_response.data, resolve(target_directory, shell_unzip_folder)),
    unzip(server_response.data, resolve(target_directory, server_unzip_folder)),
  ])

  await Promise.all([
    move_server_files(target_directory),
    move_shell_files(target_directory),
  ])
}
