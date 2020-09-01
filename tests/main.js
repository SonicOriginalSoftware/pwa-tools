import { strict as assert } from "assert"

import { usage } from "../lib/usage.js"
import { main } from "../bin/main.js"
import pkg from "../package.json"

export const id = "Test main function"

export const assertions = {
  "No argument given": {
    function: async () => {
      let stderr = ""
      let stdout = ""
      process.stderr.on("data", data => {
        stderr += data
      })
      process.stdout.on("data", data => {
        stdout += data
      })
      await main([""].entries())
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Bogus argument given": {
    function: async () => {
      let stderr = ""
      let stdout = ""
      process.stderr.on("data", data => {
        stderr += data
      })
      process.stdout.on("data", data => {
        stdout += data
      })
      await main(["bogus"].entries())
      assert.match(stderr.trim(), /Unknown command: bogus/)
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Help command given": {
    function: async () => {
      let stderr = ""
      let stdout = ""
      process.stderr.on("data", data => {
        stderr += data
      })
      process.stdout.on("data", data => {
        stdout += data
      })
      await main(["help"].entries())
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Version command given": {
    function: async () => {
      let stderr = ""
      let stdout = ""
      process.stderr.on("data", data => {
        stderr += data
      })
      process.stdout.on("data", data => {
        stdout += data
      })
      await main(["version"].entries())
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), pkg.version)
    },
    skip: false,
  },
}
