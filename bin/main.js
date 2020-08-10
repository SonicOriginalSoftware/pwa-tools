import { init } from "../lib/commands/init.js"
import { info, error } from "../lib/logger/logger.js"
import { usage } from "../lib/usage.js"
import pkg from "../package.json"

const options = {
  pwa_shell_repository: "https://github.com/sonicoriginalsoftware/pwa-shell/archive/default.zip",
  pwa_server_repository: "https://github.com/sonicoriginalsoftware/pwa-server/archive/default.zip",
  target_directory: process.cwd(),
}

/**
 * @param {String} argument
 * @param {Number} argument_index
 * @param {typeof options} options
 */
function parse_option(argument, argument_index, options) {
  const option_regex = /^\-+/g
  let value = process.argv[argument_index + 1]

  if (argument.includes("=")) {
    const arg_split = argument.split("=")
    argument = arg_split[0]
    value = arg_split[1]
  }

  switch (argument.replace(option_regex, "")) {
    case "pwa-shell-repository" || "p":
      options.pwa_shell_repository = value
      break
    case "pwa-server-repository" || "s":
      options.pwa_server_repository = value
      break
    case "target-directory" || "t":
      options.target_directory = value
      break
  }
}

/** @param {IterableIterator<[Number, String]>} argv_entries */
export async function main(argv_entries) {
  let command = "help"

  for (const [each_arg_index, each_arg_value] of argv_entries) {
    if (each_arg_index < 2) continue

    each_arg_value.startsWith("-")
      ? parse_option(each_arg_value, each_arg_index, options)
      : (command = each_arg_value)
  }

  switch (command) {
    case "init":
      try {
        await init(options)
      } catch (err) {
        error(err)
        process.exit(1)
      }
      info(
        `Initializing target directory (${options.target_directory}) complete!`
      )
      break
    case "add-component":
      error("This command is not implemented yet!")
      break
    case "remove-component":
      error("This command is not implemented yet!")
      break
    case "version":
      info(pkg.version)
      break
    case "help" || "":
      info(usage)
      break
    default:
      error(`Unknown command: ${command}`)
      info(usage)
  }
}

main(process.argv.entries())
