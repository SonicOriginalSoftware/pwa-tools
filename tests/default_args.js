import { strict as assert } from "assert"
import { exec } from "child_process"

import { usage } from "../lib/usage.js"

export const id = "Test default arguments"

export const assertions = {
  "No argument given": {
    function: async () => {
      const output = await new Promise((resolve, reject) => {
        exec("node bin/main.js", (err, stdout, stderr) =>
          err ? reject(err) : resolve([stdout, stderr])
        )
      })
      return assert.deepStrictEqual(output, usage)
    },
  },
}
