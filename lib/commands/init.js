import { readdir, rmdir, writeFile, rename } from "fs/promises"
import { join } from "path"

// @ts-ignore
import { unzip } from "@sonicoriginalsoftware/unzipper/unzip.js"

import { find_package_root, walk_files } from "../walker.js"
import { parse_options } from "../arg_parser/arg_parser.js"
import { fetch } from "../net/http2_client.js"
import { CACHE_PATH } from "../cache.js"

export const usage = `
  Arguments:
    help                                Show this menu

  Options:
    --pwa-shell-repository=, -p         Specify the pwa-shell repository to fetch
    --pwa-server-repository=, -s        Specify the pwa-server repository to fetch
    --shell-target-directory=, -t       Specify the directory to extract shell files into
    --server-target-directory=, -u      Specify the directory to extract server files into
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
  shell_target_directory: process.cwd(),
  server_target_directory: process.cwd(),
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
    case "shell-target-directory":
    case "t":
      options.shell_target_directory = value
      break
    case "server-target-directory":
    case "u":
      options.server_target_directory = value
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

/** @param {String} destination_directory */
async function destination_directory_clean(destination_directory) {
  let files = []
  try {
    files = await readdir(destination_directory)
  } catch (err) {
    return err.code === "ENOENT"
  }
  return Promise.resolve(files.length === 0)
}

/**
 * @param {String} extraction_path
 * @param {String} destination_path
 * @param {String[]} [exclusion_list=[]]
 */
async function move_files(
  extraction_path,
  destination_path,
  exclusion_list = []
) {
  await walk_files(
    // @ts-ignore
    await find_package_root(extraction_path),
    destination_path,
    exclusion_list,
    rename
  )
  return rmdir(extraction_path, { recursive: true })
}

async function run() {
  if (!(await destination_directory_clean(options.shell_target_directory)))
    return Promise.reject("Shell extraction folder not empty!")
  if (!(await destination_directory_clean(options.server_target_directory)))
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

  const shell_extract_path = join(options.shell_target_directory, "shell")
  const server_extract_path = join(options.server_target_directory, "server")

  await Promise.all([
    unzip(shell_response.data, shell_extract_path),
    unzip(server_response.data, server_extract_path),
  ])

  await Promise.all([
    move_files(
      shell_extract_path,
      options.shell_target_directory,
      options.shell_exclusion_list
    ),
    move_files(
      server_extract_path,
      options.server_target_directory,
      options.server_exclusion_list
    ),
  ])

  return writeFile(
    join(options.shell_target_directory, ".gitignore"),
    CACHE_PATH.replace(/^\.\//, "")
  )
}

/**
 * @param {String[]} args
 * @param {Console} logger
 */
export function init(args, logger) {
  // FIXME Options could potentially include args
  // Do a better job at parsing arguments out from options!!
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
