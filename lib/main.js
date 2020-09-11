import { init } from "../lib/commands/init.js"
import pkg from "../package.json"
import { add_component } from "./commands/add_component.js"

export const usage = `
  pwa-tools
  Author: ${pkg.author}
  Version: ${pkg.version}

  Usage:
  npx @sonicoriginalsoftware/pwa-tools [command] [command-arguments] [command-options]

  Commands:
    help                                Show this menu
    version                             Show version

    init                                Initializes the current directory for the pwa-framework
    add-component                       Add a component
    remove-component                    Remove a component
`

/**
 * @param {String[]} args
 * @param {Console} [logger=console]
 */
export async function main(args, logger = console) {
  const command = args.length >= 3 ? args[2] : "help"
  const command_args = args.length >= 4 ? args.slice(3) : []
  switch (command) {
    case "init":
      try {
        await init(command_args, logger)
      } catch (err) {
        logger.error(err)
        process.exitCode = -2
      }
      break
    case "add-component":
      try {
        await add_component(command_args, logger)
      } catch (err) {
        logger.error(err)
        process.exitCode = -2
      }
      break
    case "remove-component":
      logger.error("This command is not implemented yet!")
      break
    case "version":
      logger.info(pkg.version)
      break
    case "help":
      logger.info(usage)
      break
    default:
      logger.error(`Unknown command: ${command}`)
      logger.info(usage)
      process.exitCode = -1
  }
}

