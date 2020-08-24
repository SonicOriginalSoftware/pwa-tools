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
        console.log(
          `Found End of Central Directory Signature at offset: ${offset}`
        )
        break
    }
  }
  return headers
}

/** @param {String} target_path */
function recursively_make_directory(target_path) {
  return new Promise((resolve, reject) => {
    const target_directory = dirname(target_path)
    mkdir(target_directory, { recursive: true }, (err, path) =>
      err === null || err?.code === "EEXIST" ? resolve(path) : reject(err)
    )
  })
}

/**
 * @param {String} root_directory
 * @param {Buffer} buffer
 * @param {Number} file_header_offset
 */
function write_file_to_file_system(root_directory, buffer, file_header_offset) {
  return new Promise(async (resolve, reject) => {
    const local_file = new LocalFile(buffer, file_header_offset)
    const target_path = path_resolve(root_directory, local_file.file_name)
    if (local_file.file_name.endsWith('/')) {
      return await recursively_make_directory(target_path)
    }
    writeFile(target_path, await local_file.content, async (err) => {
      if (err?.code === "ENOENT") {
        await recursively_make_directory(target_path)
        write_file_to_file_system(root_directory, buffer, file_header_offset)
      } else if (err !== null) {
        reject(err)
      } else {
        console.log(`Extracted ${target_path}`)
        resolve()
      }
    })
  })
}

/**
 * Extract a zip to a path
 *
 * @param {Buffer} buffer buffer of zip
 * @param {String} target_directory
 */
export function unzip(buffer, target_directory) {
  const write_promises = []

  const end_of_central_directory = find_ending_headers(buffer)
    .end_of_central_directory

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
    write_promises.push(
      write_file_to_file_system(
        target_directory,
        buffer,
        central_directory.local_file_header_relative_offset
      )
    )
  }

  return Promise.all(write_promises)
}
