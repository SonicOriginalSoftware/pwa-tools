/**
 * @param {String[]} args
 * @param {(argument: String, value: String) => void} callback
 */
export function parse_options(args, callback) {
  for (let [each_arg_index, each_arg_value] of args.entries()) {
    if (!each_arg_value.startsWith("-")) continue

    let value = args[each_arg_index + 1]

    if (each_arg_value.includes("=")) {
      const arg_split = each_arg_value.split("=")
      each_arg_value = arg_split[0]
      value = arg_split[1]
    }

    callback(each_arg_value, value)
  }
}
