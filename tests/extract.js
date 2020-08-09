import { strict as assert } from "assert"

import { extract } from "../lib/extractor/extract.js"
import { readFileSync } from "fs"

export const id = "Test Extractor"

const test_zip = readFileSync("./test/inputs/test.zip")

export const assertions = {
  "Extract test zip": {
    function: async () =>
      assert.doesNotReject(
        async () => await extract(test_zip, "./tests/outputs/")
      ),
    skip: true,
  },
}
