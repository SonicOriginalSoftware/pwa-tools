import { strict as assert } from "assert"

import { unzip } from "../lib/unzipper/unzip.js"
import { readFileSync, rmdirSync } from "fs"

export const id = "Test unzipper"

const test_zip_path = "./test-data/inputs/test-store.zip"
const deflate_zip_path = "./test-data/inputs/test-deflate.zip"

export function setUp() {
  rmdirSync("./test-data/outputs", { recursive: true })
}

export const assertions = {
  "Unzip test zip with stored compression from stream": {
    function: () => {
      assert.doesNotReject(() =>
        unzip(readFileSync(test_zip_path), "./test-data/outputs/test-store")
      )
    },
    skip: false,
  },
  "Unzip test zip with deflate compression from stream": {
    function: async () => {
      try {
        await unzip(readFileSync(deflate_zip_path), "./test-data/outputs")
      } catch (err) {
        assert.fail(err)
      }
    },
    skip: false,
  },
}
