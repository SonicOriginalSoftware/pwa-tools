/**
 * @param {String[]} args
 * @param {Object} options
 * @param {(argument: String, value: String, options: Object, args: String[]) => [Boolean, Boolean]} callback
 */
export function parse_options(args, options, callback) {
  for (let arg_index = 0; arg_index < args.length; arg_index++) {
    let arg_name = args[arg_index]
    if (!arg_name.startsWith("-")) continue

    let value = args[arg_index + 1]

    const uses_equals_syntax = arg_name.includes("=")
    if (uses_equals_syntax) [arg_name, value] = arg_name.split("=")

    const [name_used, value_used] = callback(arg_name, value, options, args)
    if (name_used) {
      args.splice(arg_index, 1)
      if (value_used && !uses_equals_syntax) {
        args.splice(arg_index, 1)
      }
      arg_index--
    }
  }
}
