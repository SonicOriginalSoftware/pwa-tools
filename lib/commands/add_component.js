// How do we handle shared libraries between components?
// Like libraries for events?

// Shared libraries would live in the shell lib folder
// When are libraries used by components fetched?

// Could make some kind of post-install hook for each component...
// Or a scheme that lists the libraries (repository and path) that the component
// depends on
// And use that to grab each library after the component is installed

import { URL } from "url"
import { join, dirname } from "path"
import { readdir, mkdir, rename, copyFile, rmdir } from "fs/promises"

// @ts-ignore
import { unzip } from "@sonicoriginalsoftware/unzipper/unzip.js"

import { find_package_root, walk_files } from "../walker.js"
import { parse_options } from "../arg_parser/arg_parser.js"
import { fetch } from "../net/http2_client.js"
import { CACHE_PATH } from "../cache.js"

export const usage = `
  Usage:
  npx @sonicoriginalsoftware/pwa-tools add-component help
  npx @sonicoriginalsoftware/pwa-tools add-component <component-name> <component-path> [command-options]

  Arguments:
    help                                Show this menu

    --component-name=, -n               Name of the component to fetch
    --component-path=, -p               Path to drop component once fetched

  Options:
    --archive=, -r                      URL of zip archive where the component can be found
                                            (can be path to local repository)
    --exclusion-list=, -x               Comma-separated list (no spaces) of files in component archive to not extract
`

const options = {
  component_name: "",
  component_path: "",
  exclusion_list: [
    "package.json",
    "vscode.code-workspace",
    "tsconfig.json",
    "README.md",
    ".gitignore",
  ],
  archive_url:
    "https://github.com/SonicOriginalSoftware/pwa-components/archive/default.zip",
}

/**
 * @param {String} argument
 * @param {any} value
 */
function options_switch(argument, value) {
  switch (argument) {
    case "component-name":
    case "n":
      options.component_name = value
      break
    case "component-path":
    case "p":
      options.component_path = value
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

async function run() {
  let repository_path = options.archive_url

  if (is_remote_repository()) {
    const cache_path = join(options.component_path, CACHE_PATH)
    const archive_path = join(cache_path, new URL(options.archive_url).pathname)
    repository_path = dirname(archive_path)

    await mkdir(repository_path, { recursive: true })
    if ((await readdir(repository_path)).length === 0) {
      const repository_response = await fetch(options.archive_url, {
        follow_redirects: true,
        timeout: 5000,
      })

      await unzip(repository_response.data, repository_path)

      const package_root = await find_package_root(repository_path, "components")
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

  return copyFile(
    join(repository_path, "components", options.component_name),
    join(options.component_path, options.component_name)
  )
}

/**
 * @param {String[]} args
 * @param {Console} logger
 */
export async function add_component(args, logger) {
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
