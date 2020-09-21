import { initialize } from "../lib/commands/initialize.js"
import { de_initialize } from "./commands/de_initialize.js"
import pkg from "../package.json"

export const usage = `
  pwa-tools
  Author: ${pkg.author}
  Version: ${pkg.version}

  Usage:
  npx <node-options> @sonicoriginalsoftware/pwa-tools [command] [command-arguments] [command-options]

  Commands:
    help                                Show this menu
    version                             Show version

    init                                Add a resource to a directory
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
        await initialize(command_args, logger)
      } catch (err) {
        logger.error(err)
        process.exitCode = -2
      }
      break
    case "de-init":
      try {
        await de_initialize(command_args, logger)
      } catch (err) {
        logger.error(err)
        process.exitCode = -3
      }
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
