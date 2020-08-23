import { readFile } from "fs"

import { EndOfCentralDirectory } from "./header_models/end_of_central_directory.js"
import { Zip64Locator } from "./header_models/zip64_locator.js"
import { Zip64 } from "./header_models/zip64.js"
import * as Constants from "./constants.js"
import { CentralDirectory } from "./header_models/central_directory.js"
import { LocalFile } from "./header_models/local_file.js"

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
function* gather_central_directories(buffer, end_of_central_directory) {
  let central_directory_offset =
    end_of_central_directory.central_directory_start

  for (
    let each_central_directory_index = 0;
    each_central_directory_index <
    end_of_central_directory.total_number_of_central_directories;
    each_central_directory_index++
  ) {
    console.log(`Found central directory at ${central_directory_offset}`)
    const central_directory = new CentralDirectory(
      buffer,
      central_directory_offset
    )

    central_directory_offset += central_directory.size
    yield central_directory
  }
}

/**
 * @param {Buffer} buffer
 * @param {Number} local_file_offset
 */
function get_local_file_header(buffer, local_file_offset) {}

/**
 * @param {Buffer} buffer
 * @param {EndOfCentralDirectory} end_of_central_directory
 */
function generate_structure(buffer, end_of_central_directory) {
  /** @type {Object.<Number, any>} */
  const structure = {}

  console.log(
    `Iterating through ${end_of_central_directory.total_number_of_central_directories} central directories...`
  )
  const central_directories = gather_central_directories(
    buffer,
    end_of_central_directory
  )
  for (const each_central_directory of central_directories) {
    const local_file = new LocalFile(
      buffer,
      each_central_directory.local_file_header_relative_offset
    )
    structure[each_central_directory.crc] = each_central_directory
  }

  return structure
}

/**
 * Writes the hierarchy structure to the file system
 *
 * @param {Object} structure
 */
function write_structure_to_file_system(structure) {}

/**
 * Extract a zip file to a path
 *
 * @param {Buffer} source path to zip file or zip buffer
 * @param {String} target_path
 */
export async function unzip(source, target_path) {
  if (typeof source === "string")
    source = await new Promise((resolve, reject) =>
      readFile(source, (err, data) => (err ? reject(err) : resolve(data)))
    )
  console.log(`Extracting buffer of size: ${source.length} bytes...`)

  // @ts-ignore
  const headers = find_ending_headers(source)

  if (headers.end_of_central_directory === null) {
    return Promise.reject("Could not find End of Central Directory!")
  }

  var structure = generate_structure(source, headers.end_of_central_directory)
  write_structure_to_file_system(structure)

  return Promise.resolve()
}
