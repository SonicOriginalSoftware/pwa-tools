/**
 * @param {String[]} args
 * @param {Object} options
 * @param {(argument: String, value: String, options: Object, args: String[]) => [Boolean, Boolean]} callback
 */
export function parse_options(args, options, callback) {
  for (let [each_arg_index, each_arg_name] of args.entries()) {
    if (!each_arg_name.startsWith("-")) continue

    let value = args[each_arg_index + 1]

    const uses_equals_syntax = each_arg_name.includes("=")
    if (uses_equals_syntax) {
      const arg_split = each_arg_name.split("=")
      each_arg_name = arg_split[0]
      value = arg_split[1]
    }

    const [name_used, value_used] = callback(
      each_arg_name,
      value,
      options,
      args
    )
    if (name_used) {
      args.splice(args.indexOf(each_arg_name))
    }
    if (value_used && !uses_equals_syntax) {
      args.splice(args.indexOf(value))
    }
  }
}
