import { URL } from "url"
import { join, dirname, parse } from "path"
import { readdir, rmdir, mkdir, copyFile, stat, readFile } from "fs/promises"

// @ts-ignore
import { unzip } from "@sonicoriginalsoftware/unzipper/unzip.js"

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
  Usage:
  npx @sonicoriginalsoftware/pwa-tools init help
  npx @sonicoriginalsoftware/pwa-tools init * --cache -t ./new-site
  npx @sonicoriginalsoftware/pwa-tools init lib/indexedDb --cache -t ./new-site
  npx @sonicoriginalsoftware/pwa-tools init https://your-domain.com/path/to/your/archive.zip components/your-component -t ./new-site

  Arguments:
    help                                Show this menu
                                            (exclusive of all other arguments)
    *                                   Add the SOS shell and server resources
                                            (exclusive of <Archive URL> and <Resource Path> arguments)
    .                                   Use the default pwa-resources repository
                                            (exclusive of <Archive URL> argument)
    <Archive URL>                       URL of zip archive where the resources can be found
                                            (can be path to local repository)
    <Resource Path>                     The path of the resource in the archive to add
                                            (used with <Archive URL> or pwa-resources repository)

  Options:
    --destination-directory=, -t        The directory to extract resource files into
                                            (defaults to current working directory)
    --exclusion-list=, -x               Comma-separated list (no spaces) of files to not extract
                                            (in the future this will accept glob patterns)
    --cache, -c                         Add the unzipped resource repository to the local cache
                                            (default: false; best if fetching multiple resources from same repo)
`

/**
 * @param {String} argument
 * @param {String} value
 * @param {Options} options
 * @param {String[]} args
 *
 * @returns {[Boolean, Boolean]}
 */
function options_switch(argument, value, options, args) {
  switch (argument) {
    case "--archive":
    case "-r":
      options.archive_url = value
      return [true, true]
    case "--resource-path":
    case "-p":
      options.resource_path = value
      return [true, true]
    case "--destination-directory":
    case "-t":
      options.destination_directory = value
      return [true, true]
    case "--exclusion-list":
    case "-x":
      options.exclusion_list = value.split(",")
      return [true, true]
    case "--cache":
    case "-c":
      options.cache = true
      return [true, false]
    case "--defaults":
    case "-d":
      options.defaults = true
      return [true, false]
  }

  return [false, false]
}

/**
 * @param {String} search_path
 * @param {String} resource_path
 *
 * @returns {Promise<String>} the path to the package root
 */
async function resolve_resource_root(search_path, resource_path) {
  const files = await readdir(search_path)

  const new_path = join(search_path, files[0])
  if (files.length === 1 && (await stat(new_path)).isDirectory()) {
    return resolve_resource_root(new_path, resource_path)
  } else if (
    resource_path === "./" ||
    files.indexOf(dirname(resource_path)) >= 0
  ) {
    return search_path
  }
}

/**
 * @param {String} source_path
 * @param {String} destination_path
 * @param {String[]} exclusion_list
 *
 * @returns {Promise<void>}
 */
async function copy(source_path, destination_path, exclusion_list) {
  const files = await readdir(source_path)
  for (const each_file of files) {
    if (exclusion_list.indexOf(each_file) >= 0) continue

    const new_source_path = join(source_path, each_file)
    const new_destination_path = join(destination_path, each_file)
    if ((await stat(new_source_path)).isDirectory()) {
      await copy(new_source_path, new_destination_path, exclusion_list)
      continue
    }
    await mkdir(dirname(new_destination_path), { recursive: true })
    await copyFile(new_source_path, new_destination_path)
  }
}

/** @param {String} directory */
async function is_directory_empty(directory) {
  try {
    return (await readdir(directory)).length === 0
  } catch (err) {
    if (err.code === "ENOENT") return true
    throw err
  }
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
  /** @type {String?} */
  let cache_path = null
  const is_remote = repository_path.startsWith("http")
  const is_zip = repository_path.endsWith(".zip")

  if (is_remote || is_zip) {
    cache_path = join(destination_directory, CACHE_PATH)
    let repository_data
    let extraction_target_directory

    if (is_remote) {
      extraction_target_directory = dirname(
        join(cache_path, new URL(repository_path).pathname)
      )
      if (await is_directory_empty(extraction_target_directory)) {
        repository_data = (
          await fetch(repository_path, {
            follow_redirects: true,
            timeout: 5000,
          })
        ).data
      }
    } else {
      extraction_target_directory = join(
        cache_path,
        parse(repository_path).name
      )
      repository_data = await readFile(repository_path)
    }
    await mkdir(extraction_target_directory, { recursive: true })
    await unzip(repository_data, extraction_target_directory)

    repository_path = await resolve_resource_root(
      extraction_target_directory,
      resource_path
    )
  }

  await copy(
    join(repository_path, resource_path),
    join(destination_directory, resource_path),
    exclusion_list
  )
  return !cache && is_remote && cache_path !== null
    ? rmdir(cache_path, { recursive: true })
    : Promise.resolve()
}

/**
 * @param {String[]} args
 * @param {Console} logger
 */
export function initialize(args, logger) {
  /** @type {Options} */
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

  parse_options(args, options, options_switch)

  const subcommand = args.length >= 1 ? args[0] : ""
  if (subcommand === "help" || subcommand === undefined || subcommand === "") {
    logger.log(usage)
    return Promise.resolve()
  }

  if (subcommand === "*") {
    return Promise.all([
      run(
        sos_server_url,
        "./",
        join(options.destination_directory, "server"),
        options.exclusion_list,
        options.cache
      ),
      run(
        sos_shell_url,
        "./",
        options.destination_directory,
        ["vscode.code-workspace", "tsconfig.json", "README.md"],
        options.cache
      ),
    ])
  } else {
    if (subcommand === ".") options.archive_url = sos_resources_url
    return run(
      options.archive_url,
      options.resource_path,
      options.destination_directory,
      options.exclusion_list,
      options.cache
    )
  }
}
