import { readFileSync } from "fs"

import { CentralDirectory } from "./header_models/central_directory.js"
import { EndOfCentralDirectory } from "./header_models/end_of_central_directory.js"
import { LocalFile } from "./header_models/local_file.js"
import { DataDescriptor } from "./header_models/data_descriptor.js"
import * as Constants from "./constants.js"

/**
 * @param {Buffer} buffer
 */
function parse(buffer) {
  const headers = []
  for (
    let offset = buffer.length - Constants.BYTE_OFFSET;
    offset >= 0;
    offset--
  ) {
    switch (buffer.readUInt32LE(offset)) {
      case Constants.LOCAL_FILE_SIGNATURE:
        headers.push(new LocalFile())
        console.log(`Found Local File Signature at offset: ${offset}`)
        break
      case Constants.DATA_DESCRIPTOR_SIGNATURE:
        headers.push(new DataDescriptor())
        console.log(`Found Data Descriptor Signature at offset: ${offset}`)
        break
      case Constants.ARCHIVE_EXTRA_DATA_SIGNATURE:
        console.log(`Found Archive Extra Data Signature at offset: ${offset}`)
        break
      case Constants.CENTRAL_DIRECTORY_SIGNATURE:
        headers.push(new CentralDirectory())
        console.log(`Found Central Directory Signature at offset: ${offset}`)
        break
      case Constants.DIGITAL_SIGNATURE:
        console.log(`Found Digital Signature at offset: ${offset}`)
        break
      case Constants.END_OF_ZIP64_SIGNATURE:
        console.log(
          `Found End of Zip64 Central Directory Signature at offset: ${offset}`
        )
        break
      case Constants.END_OF_ZIP64_LOCATOR_SIGNATURE:
        console.log(
          `Found End of Zip64 Central Directory Locator Signature at offset: ${offset}`
        )
        break
      case Constants.END_OF_CENTRAL_DIRECTORY_SIGNATURE:
        headers.push(new EndOfCentralDirectory(buffer, offset))
        console.log(
          `Found End of Central Directory Signature at offset: ${offset}`
        )
        break
    }
  }
  return headers
}

/**
 * Extract a zip file to a path
 *
 * @param {String | Buffer} source path to zip file or zip buffer
 * @param {String} target_path
 */
export async function extract(source, target_path) {
  if (typeof source === "string") source = readFileSync(source)
  console.log(`Extracting buffer of size: ${source.length} bytes...`)

  parse(source)
  // const headers = parse(source)
  // console.log(headers)
}
