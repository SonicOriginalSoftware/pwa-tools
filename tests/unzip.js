import { strict as assert } from "assert"

import { unzip } from "../lib/unzipper/unzip.js"
import { readFileSync, rmdirSync } from "fs"

export const id = "Test unzipper"

const test_zip_path = "./tests/inputs/test.zip"
const deflate_zip_path = "./tests/inputs/pwa-server-default.zip"

export function setUp() {
  rmdirSync("./tests/outputs", { recursive: true })
}

export const assertions = {
  "Unzip test zip with stored compression from stream": {
    function: () => {
      assert.doesNotReject(() =>
        unzip(readFileSync(test_zip_path), "./tests/outputs/test-zip")
      )
    },
    skip: true,
  },
  "Unzip test zip with deflate compression from stream": {
    function: async () => {
      try {
        var unzipped_files = await unzip(
          readFileSync(deflate_zip_path),
          "./tests/outputs"
        )
        console.log("Got here!")
        console.log(unzipped_files)
      } catch (err) {
        assert.fail(err)
      }
      console.log("Done!")
    },
    skip: false,
  },
}
