import { strict as assert } from "assert"

import { extract } from "../lib/extractor/extract.js"
import { readFileSync } from "fs"

export const id = "Test extractor"

const test_zip_path = "./tests/inputs/test.zip"

export const assertions = {
  "Extract test zip from path": {
    function: async () =>
      assert.doesNotReject(
        async () => await extract(test_zip_path, "./tests/outputs/")
      ),
    skip: false,
  },
  "Extract test zip from stream": {
    function: async () => {
      const zip_stream = readFileSync(test_zip_path)
      assert.doesNotReject(
        async () => await extract(zip_stream, "./tests/outputs/")
      )
    },
    skip: true,
  },
}
