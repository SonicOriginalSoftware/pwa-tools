import { readFile, writeFile, mkdir } from "fs"

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
        console.log(
          `Found End of Central Directory Signature at offset: ${offset}`
        )
        break
    }
  }
  return headers
}

/**
 * @param {Buffer} buffer
 * @param {EndOfCentralDirectory} end_of_central_directory
 */
function* central_directories(buffer, end_of_central_directory) {
  let central_directory_offset =
    end_of_central_directory.central_directory_start

  for (
    let each_central_directory_index = 0;
    each_central_directory_index <
    end_of_central_directory.total_number_of_central_directories;
    each_central_directory_index++
  ) {
    const central_directory = new CentralDirectory(
      buffer,
      central_directory_offset
    )

    central_directory_offset += central_directory.size
    yield central_directory
  }
}

/**
 * @param {String} target_path
 * @param {Buffer} buffer
 * @param {Number} file_header_offset
 */
async function write_file_to_file_system(
  target_path,
  buffer,
  file_header_offset
) {
  return new Promise(async (resolve, reject) => {
    writeFile(
      target_path,
      await new LocalFile(buffer, file_header_offset).content,
      async (err) => {
        if (err?.code === "ENOENT") {
          await new Promise((resolve, reject) => {
            mkdir(dirname(target_path), { recursive: true }, (err, path) =>
              err ? reject(err) : resolve(path)
            )
          })
          write_file_to_file_system(target_path, buffer, file_header_offset)
        } else if (err !== null) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
}

/**
 * @param {Buffer} buffer
 * @param {String} target_directory
 */
function* write_central_directories_to_file_system(buffer, target_directory) {
  for (const each_central_directory of central_directories(
    buffer,
    // @ts-ignore
    find_ending_headers(buffer).end_of_central_directory
  )) {
    yield write_file_to_file_system(
      path_resolve(target_directory, each_central_directory.file_name),
      buffer,
      each_central_directory.local_file_header_relative_offset
    )
  }
}

/**
 * Extract a zip file to a path
 *
 * @param {Buffer | String} source path to zip file or zip buffer
 * @param {String} target_directory
 */
export async function unzip(source, target_directory) {
  let buffer =
    typeof source === "string"
      ? await new Promise((resolve, reject) =>
          readFile(source, (err, data) => (err ? reject(err) : resolve(data)))
        )
      : source

  return Promise.all(
    write_central_directories_to_file_system(buffer, target_directory)
  )
}
