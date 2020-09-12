import { URL } from "url"
import { join, dirname } from "path"
import { readdir, mkdir, rename, rmdir, stat, copyFile } from "fs/promises"

// @ts-ignore
import { unzip } from "@sonicoriginalsoftware/unzipper/unzip.js"

import { find_package_root, walk_files } from "../walker.js"
import { parse_options } from "../arg_parser/arg_parser.js"
import { fetch } from "../net/http2_client.js"
import { CACHE_PATH } from "../cache.js"

export const usage = `
  Add resources to your pwa-shell

  Usage:
  npx @sonicoriginalsoftware/pwa-tools add-resource help
  npx @sonicoriginalsoftware/pwa-tools add-resource \
    --resource-type=<resource-type> --resource-name=<resource-name> \
    --resource-path=<resource-path> [resource-options]

  Arguments:
    help                                Show this menu

    --resource-type=, -t                Type of resource ('component' or 'lib')
    --resource-name=, -n                Name of the resource to fetch
    --resource-path=, -p                Path to drop resource once fetched

  Options:
    --archive=, -r                      URL of zip archive where the resources can be found
                                            (can be path to local repository)
    --exclusion-list=, -x               Comma-separated list (no spaces) of files in resource archive to not extract
`

const options = {
  resource_type: "",
  resource_name: "",
  resource_path: "",
  exclusion_list: [
    "package.json",
    "vscode.code-workspace",
    "tsconfig.json",
    "README.md",
    ".gitignore",
  ],
  archive_url:
    "https://github.com/SonicOriginalSoftware/pwa-resources/archive/default.zip",
}

/**
 * @param {String} argument
 * @param {any} value
 */
function options_switch(argument, value) {
  switch (argument) {
    case "resource-type":
    case "t":
      options.resource_type = value
      break
    case "resource-name":
    case "n":
      options.resource_name = value
      break
    case "resource-path":
    case "p":
      options.resource_path = value
      break
    case "exclusion-list":
    case "x":
      options.exclusion_list = value.split(",")
      break
    case "archive":
    case "r":
      options.archive_url = value
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

/**
 * @param {String} source_path
 * @param {String} destination_path
 */
async function copy(source_path, destination_path) {
  for (const each_file of await readdir(source_path)) {
    const new_source_path = join(source_path, each_file)
    const new_destination_path = join(destination_path, each_file)
    const file_stats = await stat(new_source_path)
    if (file_stats.isDirectory()) {
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

    await mkdir(repository_path, { recursive: true })
    if ((await readdir(repository_path)).length === 0) {
      const repository_response = await fetch(options.archive_url, {
        follow_redirects: true,
        timeout: 5000,
      })

      await unzip(repository_response.data, repository_path)

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
export async function add_resource(args, logger) {
  // FIXME Options could potentially include args
  // Do a better job at parsing arguments out from options!!
  parse_options(args, options_switch)

  const command = args.length == 1 ? args[0] : ""
  switch (command) {
    case "help":
      logger.log(usage)
      return Promise.resolve()
    default:
      return run()
  }
}
