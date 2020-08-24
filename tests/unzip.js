import { strict as assert } from "assert"

import { unzip } from "../lib/unzipper/unzip.js"
import { readFileSync } from "fs"

export const id = "Test unzipper"

const test_zip_path = "./tests/inputs/test.zip"
// const test_zip_path = "./tests/inputs/pwa-server-default.zip"

export const assertions = {
  "Unzip test zip from path": {
    function: () => {
      assert.doesNotReject(() =>
        unzip(test_zip_path, "./tests/outputs/test-zip")
      )
    },
    skip: false,
  },
  "Unzip test zip from stream": {
    function: async () => {
      const zip_stream = readFileSync(test_zip_path)
      assert.doesNotReject(() => unzip(zip_stream, "./tests/outputs/test-zip"))
    },
    skip: true,
  },
}
