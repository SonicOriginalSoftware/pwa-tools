import { resolve, join } from "path"

import { fetch } from "../net/http2_client.js"
// @ts-ignore
import { unzip } from "@sonicoriginalsoftware/unzipper/unzip.js"
import { readdir, stat } from "fs"

const shell_unzip_folder = "shell"
const server_unzip_folder = "server"

/**
 * @param {String} search_path
 * @param {String} [root_indicator="package.json"]
 *
 * @returns {Promise<String>} the path to the package root
 */
async function find_package_root(search_path, root_indicator = "package.json") {
  /** @type {String[] | Error} */
  const files = await new Promise((resolve, reject) =>
    readdir(search_path, (err, files) => (err ? reject(err) : resolve(files)))
  )
  for (const each_file of files) {
    if (each_file === root_indicator) {
      return join(search_path, each_file)
    } else {
      const new_path = join(search_path, each_file)
      /** @type {import('fs').Stats} */
      const file_stats = await new Promise((resolve, reject) =>
        stat(new_path, (err, stats) => (err ? reject(err) : resolve(stats)))
      )
      if (file_stats.isDirectory()) {
        // FIXME Does this work?
        return find_package_root(new_path, root_indicator)
      }
    }
  }
}

/** @param {String} target_directory */
async function move_server_files(target_directory) {
  const package_root_path = await find_package_root(server_unzip_folder)

  // Only want to move the security folder, the server.js, and the
  // server-config.json file to the target directory

  // Remove the containing folders
}

/** @param {String} target_directory */
async function move_shell_files(target_directory) {
  const package_root_path = await find_package_root(shell_unzip_folder)

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
