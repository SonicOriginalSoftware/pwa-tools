import { strict as assert } from "assert"

import { extract } from "../lib/extractor/extract.js"
import { createReadStream } from "fs"

export const id = "Test extractor"

const test_zip_path = "./inputs/dummy"

export const assertions = {
  "Extract test zip from path": {
    function: async () =>
      assert.doesNotReject(
        async () => await extract(test_zip_path, "./tests/outputs/")
      ),
    skip: true,
  },
  "Extract test zip from stream": {
    function: async () => {
      const zip_stream = Buffer.from(createReadStream(test_zip_path), "binary")
      assert.doesNotReject(
        async () => await extract(zip_stream, "./tests/outputs/")
      )
    },
    skip: true,
  },
}
