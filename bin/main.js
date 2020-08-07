import { init } from "../lib/commands/init.js"
import { log, info, error } from "../lib/logger/logger.js"
import { usage } from "../lib/usage.js"
import pkg from "../package.json"

function parse_options(option, value, options) {
  // TODO
  switch (option) {

  }
}

async function main() {
  let command = "help"
  const options = {

  }

  for (const [each_arg_index, each_arg_value] of process.argv.entries()) {
    if (each_arg_index < 2) continue
    const next_arg_value = process.argv[each_arg_index + 1]
    if (each_arg_value.startsWith("-")) {
      parse_options(each_arg_value, next_arg_value, options)
      continue
    }

    command = each_arg_value
  }

  switch (command) {
    case "init":
      await init()
      break
    case "version":
      info(pkg.version)
      break
    case "help" || "":
      info(usage)
      break
    default:
      error(`Command '${command}' not found!`)
      info(usage)
  }
}

main()
