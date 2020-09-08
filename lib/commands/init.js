import { join } from "path"
import { readdir, stat, rename, rmdir, mkdir } from "fs/promises"

import { fetch } from "../net/http2_client.js"
// @ts-ignore
import { unzip } from "@sonicoriginalsoftware/unzipper/unzip.js"
import { parse_options } from "../arg_parser/arg_parser.js"

const shell_unzip_folder = "shell"
const server_unzip_folder = "server"

export const usage = `
  Commands:
    help                                Show this menu

  Options:
    --pwa-shell-repository=, -p         Specify the pwa-shell repository to fetch
    --pwa-server-repository=, -s        Specify the pwa-server repository to fetch
    --target-directory=, -t             Specify the directory to extract into
    --shell-exclusion-list=, -x         Comma-separated list (no spaces) of files to not extract
    --server-exclusion-list=, -y        Comma-separated list (no spaces) of files to not extract
`

const options = {
  shell_exclusion_list: ["vscode.code-workspace"],
  server_exclusion_list: ["package.json", "vscode.code-workspace"],
  pwa_shell_archive_url:
    "https://github.com/sonicoriginalsoftware/pwa-shell/archive/default.zip",
  pwa_server_archive_url:
    "https://github.com/sonicoriginalsoftware/pwa-server/archive/default.zip",
  target_directory: process.cwd(),
}

/**
 * @param {String} argument
 * @param {any} value
 */
function options_switch(argument, value) {
  switch (argument) {
    case "pwa-shell-repository":
    case "p":
      options.pwa_shell_archive_url = value
      break
    case "pwa-server-repository":
    case "s":
      options.pwa_server_archive_url = value
      break
    case "target-directory":
    case "t":
      options.target_directory = value
      break
    case "shell-exclusion-list":
    case "x":
      options.shell_exclusion_list = value.split(",")
      break
    case "server-exclusion-list":
    case "y":
      options.server_exclusion_list = value.split(",")
      break
  }
}

/**
 * @param {String} search_path
 * @param {String} [root_indicator="package.json"]
 *
 * @returns {Promise<String | undefined>} the path to the package root
 */
async function find_package_root(search_path, root_indicator = "package.json") {
  const files = await readdir(search_path)

  if (files.indexOf(root_indicator) >= 0) return search_path

  for (const each_file of files) {
    const new_path = join(search_path, each_file)
    if ((await stat(new_path)).isDirectory()) {
      return find_package_root(new_path, root_indicator)
    }
  }
}

/**
 * @param {String} source_path
 * @param {String} destination_path
 * @param {String[]} exclusion_list list of glob-pattern formats of files to not move
 */
async function walk_move_files(source_path, destination_path, exclusion_list) {
  for (const each_file of await readdir(source_path)) {
    // FIXME Replace this with a glob pattern check
    if (exclusion_list.indexOf(each_file) >= 0) continue

    const old_path = join(source_path, each_file)
    const new_path = join(destination_path, each_file)
    if ((await stat(old_path)).isDirectory()) {
      await walk_move_files(old_path, new_path, exclusion_list)
      continue
    }

    await mkdir(destination_path, { recursive: true })
    await rename(old_path, new_path)
  }
}

/**
 * @param {String} root_start_directory
 * @param {String[]} [exclusion_list=[]]
 */
async function move_files(root_start_directory, exclusion_list = []) {
  const package_root_path = await find_package_root(root_start_directory)
  await walk_move_files(package_root_path, root_start_directory, exclusion_list)
  return rmdir(package_root_path, { recursive: true })
}

async function run() {
  const shell_destination = join(options.target_directory, shell_unzip_folder)
  const server_destination = join(options.target_directory, server_unzip_folder)

  const [shell_files, server_files] = await Promise.all([
    readdir(shell_destination),
    readdir(server_destination),
  ])
  if (shell_files.length !== 0)
    return Promise.reject("Shell extraction folder not empty!")
  if (server_files.length !== 0)
    return Promise.reject("Server extraction folder not empty!")

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
    unzip(shell_response.data, shell_destination),
    unzip(server_response.data, server_destination),
  ])

  return Promise.all([
    move_files(shell_destination, options.shell_exclusion_list),
    move_files(server_destination, options.server_exclusion_list),
  ])
}

/**
 * @param {String[]} args
 * @param {Console} logger
 */
export function init(args, logger) {
  parse_options(args, options_switch)

  const command = args.length >= 1 ? args[0] : ""
  switch (command) {
    case "help":
      logger.log(usage)
      return Promise.resolve()
    default:
      return run()
  }
}
