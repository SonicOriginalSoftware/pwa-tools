import { join } from "path"
import { readdir, stat, mkdir } from "fs/promises"

/**
 * @param {String} search_path
 *
 * @returns {Promise<String | undefined>} the path to the package root
 */
export async function find_archive_root(search_path) {
  const files = await readdir(search_path)

  const new_path = join(search_path, files[0])
  return files.length === 1 && (await stat(new_path)).isDirectory()
    ? find_archive_root(new_path)
    : search_path
}

/**
 * @param {String} source_path
 * @param {String} destination_path
 * @param {String[]} exclusion_list list of glob-pattern formats of files to not move
 * @param {(old_path: String, new_path: String) => Promise<void>} operation an operation to perform on each file found
 */
export async function walk_files(
  source_path,
  destination_path,
  exclusion_list,
  operation
) {
  const source_files = await readdir(source_path)
  for (const each_file of source_files) {
    // FIXME Replace this with a glob pattern check
    if (exclusion_list.indexOf(each_file) >= 0) continue

    const old_path = join(source_path, each_file)
    const new_path = join(destination_path, each_file)
    if (old_path === new_path) continue
    if ((await stat(old_path)).isDirectory()) {
      await walk_files(old_path, new_path, exclusion_list, operation)
      continue
    }

    await mkdir(destination_path, { recursive: true })
    await operation(old_path, new_path)
  }
}
