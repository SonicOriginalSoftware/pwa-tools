import { strict as assert } from "assert"

import { extract } from "../lib/extractor/extract.js"

export const id = "Test extractor"

const test_zip_path = "./inputs/dummy"

export const assertions = {
  "Extract test zip": {
    function: async () =>
      assert.doesNotReject(
        async () => await extract(test_zip_path, "./tests/outputs/")
      ),
    skip: true,
  },
}
