import { init } from "../lib/commands/init.js"
import { info, error, debug } from "../lib/logger/logger.js"
import { usage } from "../lib/usage.js"
import pkg from "../package.json"

const options = {
  pwa_shell_repository: "https://github.com/sonicoriginalsoftware/pwa-shell",
  pwa_server_repository: "https://github.com/sonicoriginalsoftware/pwa-server",
  clone_target_directory: process.cwd(),
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
    case "target-clone-directory" || "t":
      debug(`Setting target-clone-directory to: ${value}`)
      options.clone_target_directory = value
      break
  }
}

async function main() {
  let command = "help"

  for (const [each_arg_index, each_arg_value] of process.argv.entries()) {
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
