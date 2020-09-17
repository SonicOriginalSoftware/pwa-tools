import { URL } from "url"
import { join, dirname } from "path"
import { readdir, rmdir, mkdir, rename, copyFile, stat } from "fs/promises"

// @ts-ignore
import { unzip } from "@sonicoriginalsoftware/unzipper/unzip.js"

import { find_package_root, walk_files } from "../walker.js"
import { parse_options } from "../arg_parser/arg_parser.js"
import { fetch } from "../net/http2_client.js"
import { CACHE_PATH } from "../cache.js"

// FIXME Its very likely that this and init could become one module
// Differentiated by the handling of caching for adding resources vs.
// direct extraction for initializing

// What we should do instead is add an option for whether caching is even used
// that would apply to both initialization and adding resources

// In addition, initiatlizing should initialize the server and shell as two
// separate entities. i.e. Parameterize what is getting "initialized" (shell or
// server) and write for that abstraction.

// Moreso, use this abstraction and the caching flag and to combine initializing
// with adding in resources.

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
    --defaults, -c                      Add the SOS shell and server resources
                                            (exclusive of --archive, --cache, and --exclusion-list options)
`

const options = {
  exclusion_list: [
    "package.json",
    "vscode.code-workspace",
    "tsconfig.json",
    "README.md",
    ".gitignore",
  ],
  archive_url: "",
  resource_path: "",
  destination_directory: process.cwd(),
}

/**
 * @param {String} argument
 * @param {String} value
 */
function options_switch(argument, value) {
  switch (argument) {
    case "--archive":
    case "-r":
      options.archive_url = value
      break
    case "--target-directory":
    case "-t":
      options.destination_directory = value
      break
    case "--exclusion-list":
    case "-x":
      options.exclusion_list = value.split(",")
      break
  }
}

function is_remote_repository() {
  try {
    new URL(options.archive_url)
  } catch (err) {
    return false
  }
  return true
}

async function destination_directory_clean() {
  let files = []
  try {
    files = await readdir(options.destination_directory)
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

async function run() {
  let repository_path = options.archive_url

  if (is_remote_repository()) {
    const cache_path = join(options.resource_path, CACHE_PATH)
    const archive_path = join(cache_path, new URL(options.archive_url).pathname)
    repository_path = dirname(archive_path)

    // FIXME Is this check needed?
    // if (!(await destination_directory_clean()))
    //   return Promise.reject("Target directory folder not empty!")

    await mkdir(repository_path, { recursive: true })
    if ((await readdir(repository_path)).length === 0) {
      const repository_response = await fetch(options.archive_url, {
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

      await walk_files(
        package_root,
        repository_path,
        options.exclusion_list,
        rename
      )
      await rmdir(package_root, { recursive: true })
    }
  }

  // FIXME This logic here needs updated to reflect the new paradigm of
  // fetching any arbitrary path
  const destination_directory = join(
    options.resource_path,
    options.resource_name
  )
  await mkdir(destination_directory)
  return copy(
    join(repository_path, options.resource_type, options.resource_name),
    destination_directory
  )
}

/**
 * @param {String[]} args
 * @param {Console} logger
 */
export function initialize(args, logger) {
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
