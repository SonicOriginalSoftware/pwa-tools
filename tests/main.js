import { strict as assert } from "assert"
import { exec } from "child_process"

import { usage } from "../lib/usage.js"
import pkg from "../package.json"

export const id = "Test main function"

export const assertions = {
  "No argument given": {
    function: async () => {
      const [stdout, stderr] = await new Promise((resolve, reject) => {
        exec(
          "node --experimental-json-modules --no-warnings bin/main.js",
          (err, stdout, stderr) =>
            err ? reject(err) : resolve([stdout, stderr])
        )
      })
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Bogus argument given": {
    function: async () => {
      const [stdout, stderr] = await new Promise((resolve, reject) => {
        exec(
          "node --experimental-json-modules bin/main.js bogus",
          (err, stdout, stderr) =>
            err ? reject(err) : resolve([stdout, stderr])
        )
      })
      assert.match(stderr, /Unknown command: bogus/)
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Help command given": {
    function: async () => {
      const [stdout, stderr] = await new Promise((resolve, reject) => {
        exec(
          "node --experimental-json-modules --no-warnings bin/main.js help",
          (err, stdout, stderr) =>
            err ? reject(err) : resolve([stdout, stderr])
        )
      })
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Version command given": {
    function: async () => {
      const [stdout, stderr] = await new Promise((resolve, reject) => {
        exec(
          "node --experimental-json-modules --no-warnings bin/main.js version",
          (err, stdout, stderr) =>
            err ? reject(err) : resolve([stdout, stderr])
        )
      })
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), pkg.version)
    },
    skip: false,
  },
}
