import { init } from "../lib/commands/init.js"
import { log, info, error } from "../lib/logger/logger.js"
import { usage } from "../lib/usage.js"
import pkg from "../package.json"

const options = {
  pwa_shell_repository: "",
  pwa_server_repository: "",
  clone_target_directory: ".",
}

/**
 * @param {String} argument
 * @param {Number} argument_index
 *
 * @returns {[Boolean, String, String]}
 */
function parse_argument(argument, argument_index) {
  if (argument.startsWith("-")) {
    return [
      true,
      argument.replace(/^\-/g, ""),
      process.argv[argument_index + 1],
    ]
  } else if (argument.includes("=")) {
    const arg_split = argument.split("=")
    return [true, arg_split[0], arg_split[1]]
  }

  return [false, argument, process.argv[argument_index + 1]]
}

/**
 * @param {String} option
 * @param {String} value
 * @param {typeof options} options
 */
function parse_options(option, value, options) {
  switch (option) {
    case "pwa-shell-repository" || "p":
      options.pwa_shell_repository = value
      break
    case "pwa-server-repository" || "s":
      options.pwa_server_repository = value
      break
    case "target-clone-directory" || "t":
      options.clone_target_directory = value
      break
  }
}

async function main() {
  let command = "help"

  for (const [each_arg_index, each_arg_value] of process.argv.entries()) {
    if (each_arg_index < 2) continue

    const [is_option, argument, value] = parse_argument(
      each_arg_value,
      each_arg_index
    )
    if (is_option) {
      parse_options(argument, value, options)
      continue
    }

    command = each_arg_value
  }

  switch (command) {
    case "init":
      try {
        await init(options)
      } catch (err) {
        error(err)
        process.exit(-1)
      }
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

main()
