import { URL } from "url"
import { join, dirname } from "path"
import {
  readdir,
  rmdir,
  mkdir,
  rename,
  copyFile,
  stat,
  writeFile,
} from "fs/promises"

// @ts-ignore
import { unzip } from "@sonicoriginalsoftware/unzipper/unzip.js"

import { find_archive_root, walk_files } from "../walker.js"
import { parse_options } from "../arg_parser/arg_parser.js"
import { fetch } from "../net/http2_client.js"

/**
 * @typedef {{archive_url: String, cache: Boolean, resource_path: String, destination_directory: String, exclusion_list: String[], defaults: Boolean}} Options
 */

export const sos_resources_url =
  "https://github.com/SonicOriginalSoftware/pwa-resources/archive/default.zip"
export const sos_server_url =
  "https://github.com/SonicOriginalSoftware/pwa-server/archive/default.zip"
export const sos_shell_url =
  "https://github.com/SonicOriginalSoftware/pwa-shell/archive/default.zip"
const CACHE_PATH = "./.cache"

export const usage = `
  Arguments:
    help                                Show this menu

  Options:
    --archive=, -r                      URL of zip archive where the resources can be found
                                            (can be path to local repository)
    --cache, -c                         Add the unzipped resource repository to the local cache
                                            (best if fetching multiple resources from same repo)
    --resource-path=, -p                The path of the resource in the archive to add
    --destination-directory=, -t        The directory to extract resource files into
                                            (defaults to current working directory)
    --exclusion-list=, -x               Comma-separated list (no spaces) of files to not extract
    --defaults, -d                      Add the SOS shell and server resources
                                            (exclusive of --archive and --resource-path options)
`

/**
 * @param {String} argument
 * @param {String} value
 * @param {Options} options
 * @param {String[]} args
 */
function options_switch(argument, value, options, args) {
  switch (argument) {
    case "--archive":
    case "-r":
      options.archive_url = value
      break
    case "--cache":
    case "-c":
      options.cache = true
      break
    case "--resource-path":
    case "-p":
      options.resource_path = value
      break
    case "--destination-directory":
    case "-t":
      options.destination_directory = value
      break
    case "--exclusion-list":
    case "-x":
      options.exclusion_list = value.split(",")
      break
    case "--defaults":
    case "-d":
      options.defaults = true
      break
  }
}

/**
 * @param {String} source_path
 * @param {String} destination_path
 */
async function copy(source_path, destination_path) {
  for (const each_file of await readdir(source_path)) {
    const new_source_path = join(source_path, each_file)
    const new_destination_path = join(destination_path, each_file)
    if ((await stat(new_source_path)).isDirectory()) {
      await copy(new_source_path, new_destination_path)
      continue
    }
    await copyFile(new_source_path, new_destination_path)
  }
}

/**
 * @param {String} repository_path
 * @param {String} resource_path
 * @param {String} destination_directory
 * @param {String[]} exclusion_list
 */
async function handle_remote(
  repository_path,
  resource_path,
  destination_directory,
  exclusion_list
) {
  // FIXME This sequence appears to result in some stupid race condition
  // So I need to log some of these cached variables to see what the program
  // THINKS it should be doing
  // And then fix why it is wrong
  const archive_url = repository_path
  const cache_path = join(destination_directory, CACHE_PATH)
  const archive_path = join(cache_path, new URL(repository_path).pathname)
  repository_path = dirname(archive_path)

  await mkdir(repository_path, { recursive: true })
  if ((await readdir(repository_path)).length !== 0) return

  const repository_response = await fetch(archive_url, {
    follow_redirects: true,
    timeout: 5000,
  })

  await unzip(repository_response.data, repository_path)

  const package_root = await find_archive_root(
    join(repository_path, resource_path)
  )
  if (package_root == undefined)
    return Promise.reject("Could not find package root")

  try {
    await walk_files(package_root, repository_path, exclusion_list, rename)
  } catch (err) {
    console.error(err)
  }
  return rmdir(package_root, { recursive: true })
}

/**
 * @param {String} repository_path
 * @param {String} resource_path
 * @param {String} destination_directory
 * @param {String[]} exclusion_list
 * @param {Boolean} cache
 */
async function run(
  repository_path,
  resource_path,
  destination_directory,
  exclusion_list,
  cache
) {
  const is_remote = repository_path.substr(0, 4) === "http"
  if (is_remote)
    await handle_remote(
      repository_path,
      resource_path,
      destination_directory,
      exclusion_list
    )

  await mkdir(destination_directory, { recursive: true })
  await copy(
    join(repository_path, resource_path),
    join(destination_directory, resource_path)
  )
  if (!cache && is_remote) await rmdir(repository_path)
  return Promise.resolve()
}

/**
 * @param {String[]} args
 * @param {Console} logger
 */
export function initialize(args, logger) {
  const options = {
    archive_url: "",
    cache: false,
    defaults: false,
    resource_path: "",
    destination_directory: process.cwd(),
    exclusion_list: [
      "package.json",
      "vscode.code-workspace",
      "tsconfig.json",
      "README.md",
      ".gitignore",
    ],
  }

  // FIXME Do a better job at parsing arguments out from options!!
  // We should remove used options and values from the args list
  // to ensure the command is accurate
  parse_options(args, options, options_switch)

  const command = args.length >= 1 ? args[0] : ""
  switch (command) {
    case "help":
      logger.log(usage)
      return Promise.resolve()
    default:
      if (options.defaults) {
        return Promise.all([
          run(
            sos_server_url,
            "./",
            options.destination_directory,
            options.exclusion_list,
            options.cache
          ),
          run(
            sos_shell_url,
            "./",
            options.destination_directory,
            options.exclusion_list,
            options.cache
          ),
        ])
      } else {
        return run(
          options.archive_url,
          options.resource_path,
          options.destination_directory,
          options.exclusion_list,
          options.cache
        )
      }
  }
}
