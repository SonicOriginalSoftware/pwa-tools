/**
 * @callback callback
 * @param {String} options_switch
 * @param {String} options
 */

/**
 * @param {String[]} args
 * @param {callback} options_callback
 */
export function parse_options(args, options_callback) {
  for (let [each_arg_index, each_arg_value] of args.entries()) {
    if (!each_arg_value.startsWith("-")) continue

    let value = arguments[each_arg_index + 1]

    if (each_arg_value.includes("=")) {
      const arg_split = each_arg_value.split("=")
      each_arg_value = arg_split[0]
      value = arg_split[1]
    }

    options_callback(each_arg_value.replace(/^\-+/g, ""), value)
  }
}

