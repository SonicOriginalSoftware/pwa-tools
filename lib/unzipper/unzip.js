import { writeFile, mkdir } from "fs"

import { EndOfCentralDirectory } from "./header_models/end_of_central_directory.js"
import { Zip64Locator } from "./header_models/zip64_locator.js"
import { Zip64 } from "./header_models/zip64.js"
import * as Constants from "./constants.js"
import { CentralDirectory } from "./header_models/central_directory.js"
import { LocalFile } from "./header_models/local_file.js"
import { resolve as path_resolve, dirname } from "path"

/**
 * @param {Buffer} buffer
 */
function find_ending_headers(buffer) {
  /** @type {{zip64_locator: Zip64Locator?, zip64: Zip64?, end_of_central_directory: EndOfCentralDirectory?}} */
  const headers = {
    zip64_locator: null,
    zip64: null,
    end_of_central_directory: null,
  }
  let found_headers = false
  for (
    let offset = buffer.length - Constants.BYTE_OFFSET;
    offset >= 0;
    offset--
  ) {
    if (found_headers) break
    switch (buffer.readUInt32LE(offset)) {
      case Constants.CENTRAL_DIRECTORY_SIGNATURE ||
        Constants.ARCHIVE_EXTRA_DATA_SIGNATURE ||
        Constants.DATA_DESCRIPTOR_SIGNATURE ||
        Constants.DIGITAL_SIGNATURE ||
        Constants.LOCAL_FILE_SIGNATURE:
        found_headers = true
        break
      case Constants.END_OF_ZIP64_SIGNATURE:
        headers.zip64 = new Zip64()
        console.log(
          `Found End of Zip64 Central Directory Signature at offset: ${offset}`
        )
        break
      case Constants.END_OF_ZIP64_LOCATOR_SIGNATURE:
        headers.zip64_locator = new Zip64Locator()
        console.log(
          `Found End of Zip64 Central Directory Locator Signature at offset: ${offset}`
        )
        break
      case Constants.END_OF_CENTRAL_DIRECTORY_SIGNATURE:
        headers.end_of_central_directory = new EndOfCentralDirectory(
          buffer,
          offset
        )
        break
    }
  }
  return headers
}

/**
 * Extract a zip to a path
 *
 * @param {Buffer} buffer zip buffer
 * @param {String} target_directory root directory where files will be extracted relative to
 *
 * @returns {Promise<String[]>} A promise that resolves to an array of paths that
 * were successfully extracted
 */
export async function unzip(buffer, target_directory) {
  const write_promises = []

  const end_of_central_directory = find_ending_headers(buffer)
    .end_of_central_directory

  let central_directory_offset =
    // @ts-ignore
    end_of_central_directory.central_directory_start

  for (
    let each_central_directory_index = 0;
    each_central_directory_index <
    // @ts-ignore
    end_of_central_directory.total_number_of_central_directories;
    each_central_directory_index++
  ) {
    const central_directory = new CentralDirectory(
      buffer,
      central_directory_offset
    )
    central_directory_offset += central_directory.size

    const local_file = new LocalFile(
      buffer,
      central_directory.local_file_header_relative_offset
    )
    const target_path = path_resolve(target_directory, local_file.file_name)

    await new Promise((resolve, reject) =>
      mkdir(dirname(target_path), { recursive: true }, (err, path) =>
        err === null || err?.code === "EEXIST" ? resolve(path) : reject(err)
      )
    )
    if (local_file.file_name.endsWith("/")) continue

    write_promises.push(
      new Promise(async (resolve, reject) =>
        writeFile(target_path, await local_file.content, (err) =>
          err ? reject(err) : resolve(target_path)
        )
      )
    )
  }

  return Promise.all(write_promises)
}
