import { URL } from "url"
import { join, dirname } from "path"
import { readdir, rmdir, mkdir, rename, copyFile, stat } from "fs/promises"

// @ts-ignore
import { unzip } from "@sonicoriginalsoftware/unzipper/unzip.js"

import { find_package_root, walk_files } from "../walker.js"
import { parse_options } from "../arg_parser/arg_parser.js"
import { fetch } from "../net/http2_client.js"
import { CACHE_PATH } from "../cache.js"

/**
 * @typedef {{archive_url: String, cache: Boolean, resource_path: String, destination_directory: String, exclusion_list: String[], defaults: Boolean}} Options
 */

const sos_resources_url =
  "https://github.com/SonicOriginalSoftware/pwa-resources/archive/default.zip"
const sos_server_url =
  "https://github.com/SonicOriginalSoftware/pwa-server/archive/default.zip"
const sos_shell_url =
  "https://github.com/SonicOriginalSoftware/pwa-shell/archive/default.zip"

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
                                            (exclusive of --archive, --cache, and --exclusion-list options)
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

/** @param {String} url */
function is_remote_repository(url) {
  try {
    new URL(url)
  } catch (err) {
    return false
  }
  return true
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
async function run(
  repository_path,
  resource_path,
  destination_directory,
  exclusion_list
) {
  if (is_remote_repository(repository_path)) {
    const archive_url = repository_path
    // ????
    const cache_path = join(resource_path, CACHE_PATH)
    const archive_path = join(cache_path, new URL(repository_path).pathname)
    repository_path = dirname(archive_path)

    // FIXME Is this check needed?
    // if (!(await destination_directory_clean(options.destination_directory)))
    //   return Promise.reject("Target directory folder not empty!")

    await mkdir(repository_path, { recursive: true })
    if ((await readdir(repository_path)).length === 0) {
      const repository_response = await fetch(archive_url, {
        follow_redirects: true,
        timeout: 5000,
      })

      await unzip(repository_response.data, repository_path)

      // FIXME This logic here needs updated to reflect the new paradigm of
      // fetching any arbitrary path
      const package_root = await find_package_root(
        repository_path,
        options.resource_type
      )
      if (package_root == undefined)
        return Promise.reject("Could not find package root")

      await walk_files(package_root, repository_path, exclusion_list, rename)
      await rmdir(package_root, { recursive: true })
    }
  }

  await mkdir(destination_directory)
  return copy(
    join(repository_path, resource_path),
    join(destination_directory, resource_path)
  )
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
            options.exclusion_list
          ),
          run(
            sos_shell_url,
            "./",
            options.destination_directory,
            options.exclusion_list
          ),
        ])
      } else {
        return run(
          options.archive_url,
          options.resource_path,
          options.destination_directory,
          options.exclusion_list
        )
      }
  }
}
