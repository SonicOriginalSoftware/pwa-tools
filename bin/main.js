import { init } from "../lib/commands/init.js"
import { usage } from "../lib/usage.js"
import pkg from "../package.json"

const options = {
  pwa_shell_archive_url:
    "https://github.com/sonicoriginalsoftware/pwa-shell/archive/default.zip",
  pwa_server_archive_url:
    "https://github.com/sonicoriginalsoftware/pwa-server/archive/default.zip",
  target_directory: process.cwd(),
}

/**
 * @param {String} argument
 * @param {Number} argument_index
 * @param {typeof options} options
 */
function parse_option(argument, argument_index, options) {
  let value = process.argv[argument_index + 1]

  if (argument.includes("=")) {
    const arg_split = argument.split("=")
    argument = arg_split[0]
    value = arg_split[1]
  }

  switch (argument.replace(/^\-+/g, "")) {
    case "pwa-shell-repository" || "p":
      options.pwa_shell_archive_url = value
      break
    case "pwa-server-repository" || "s":
      options.pwa_server_archive_url = value
      break
    case "target-directory" || "t":
      options.target_directory = value
      break
  }
}

/**
 * @param {IterableIterator<[Number, String]>} argv_entries
 * @param {Console} [logger=console]
 */
export async function main(argv_entries, logger = console) {
  let command = "help"

  for (const [each_arg_index, each_arg_value] of argv_entries) {
    if (each_arg_index < 2) continue

    each_arg_value.startsWith("-")
      ? parse_option(each_arg_value, each_arg_index, options)
      : (command = each_arg_value)
  }

  // It may be wiser to use the pwa-tools help [command] syntax
  // Then add a usage function into each command module and call that
  // I think it may make more sense than to call into the main functionality of
  // the module and then have that code do a bunch of argument parsing to
  // determine if the user is just trying to figure out how to use the command
  switch (command) {
    case "init":
      try {
        await init(
          options.pwa_shell_archive_url,
          options.pwa_server_archive_url,
          options.target_directory
        )
      } catch (err) {
        logger.error(err)
        process.exitCode = -2
      }
      logger.info(
        `Initializing target directory (${options.target_directory}) complete!`
      )
      break
    case "add-component":
      logger.error("This command is not implemented yet!")
      break
    case "remove-component":
      logger.error("This command is not implemented yet!")
      break
    case "version":
      logger.info(pkg.version)
      break
    case "help" || "":
      logger.info(usage)
      break
    default:
      logger.error(`Unknown command: ${command}`)
      logger.info(usage)
      process.exitCode = -1
  }
}

main(process.argv.entries())
