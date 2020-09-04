import { resolve, join } from "path"

import { fetch } from "../net/http2_client.js"
// @ts-ignore
import { unzip } from "@sonicoriginalsoftware/unzipper/unzip.js"
import { readdir, stat } from "fs"
import { parse_options } from "../arg_parser/arg_parser.js"

const shell_unzip_folder = "shell"
const server_unzip_folder = "server"

const usage = `
  Commands:
    help                                Show this menu

  Options:
    --pwa-shell-repository=, -p         Specify the pwa-shell repository to fetch
    --pwa-server-repository=, -s        Specify the pwa-server repository to fetch
    --target-directory=, -t             Specify the directory to extract into
`

const options = {
  pwa_shell_archive_url:
    "https://github.com/sonicoriginalsoftware/pwa-shell/archive/default.zip",
  pwa_server_archive_url:
    "https://github.com/sonicoriginalsoftware/pwa-server/archive/default.zip",
  target_directory: process.cwd(),
}

/**
 * @param {String} argument
 * @param {String} value
 */
function options_switch(argument, value) {
  switch (argument) {
    case "pwa-shell-repository" || "p":
      options.pwa_shell_archive_url = value
      break
    case "pwa-server-repository" || "s":
      options.pwa_server_archive_url = value
      break
    case "target-directory" || "t":
      options.target_directory = value
      break
  }
}

/**
 * @param {String} search_path
 * @param {String} [root_indicator="package.json"]
 *
 * @returns {Promise<String>} the path to the package root
 */
async function find_package_root(search_path, root_indicator = "package.json") {
  /** @type {String[] | Error} */
  for (const each_file of await new Promise((resolve, reject) =>
    readdir(search_path, (err, files) => (err ? reject(err) : resolve(files)))
  )) {
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
 * @param {Console} logger
 */
async function run(logger) {
  logger.info(`Initializing target directory (${options.target_directory})...`)

  const [shell_response, server_response] = await Promise.all([
    fetch(options.pwa_shell_archive_url, {
      follow_redirects: true,
      timeout: 5000,
    }),
    fetch(options.pwa_server_archive_url, {
      follow_redirects: true,
      timeout: 5000,
    }),
  ])

  await Promise.all([
    unzip(
      shell_response.data,
      resolve(options.target_directory, shell_unzip_folder)
    ),
    unzip(
      server_response.data,
      resolve(options.target_directory, server_unzip_folder)
    ),
  ])

  await Promise.all([
    move_server_files(options.target_directory),
    move_shell_files(options.target_directory),
  ])

  logger.info(
    `Initialization of target directory (${options.target_directory}) complete!`
  )
}

/**
 * @param {String[]} args
 * @param {Console} logger
 */
export async function init(args, logger) {
  parse_options(args, options_switch, options)

  const command = args.length >= 1 ? args[0] : ""
  switch (command) {
    case "help":
      logger.log(usage)
      break
    default:
      run(logger)
  }
}
