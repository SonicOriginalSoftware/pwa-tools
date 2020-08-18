import { readFileSync } from "fs"

import { CentralDirectory } from "./central_directory.js"
import { EndOfCentralDirectory } from "./end_of_central_directory.js"
import * as Constants from "./constants.js"

/**
 * @param {Buffer} buffer
 */
function parse(buffer) {
  const headers = []
  for (let offset = buffer.length - 4; offset >= 0; offset--) {
    switch (buffer.readUInt32LE(offset)) {
      case Constants.CENTRAL_DIRECTORY_SIGNATURE:
        headers.push(new CentralDirectory())
        console.log(`Found Central Directory Signature at offset: ${offset}`)
        break
      case Constants.END_OF_CENTRAL_DIRECTORY_SIGNATURE:
        headers.push(new EndOfCentralDirectory())
        console.log(
          `Found End of Central Directory Signature at offset: ${offset}`
        )
        break
      case Constants.ZIP64_SIGNATURE:
        console.log(
          `Found Zip64 Central Directory Signature at offset: ${offset}`
        )
        break
      case Constants.END_OF_ZIP64_SIGNATURE:
        console.log(
          `Found End of Zip64 Central Directory Signature at offset: ${offset}`
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

  const headers = parse(source)
  console.log(headers)
}
