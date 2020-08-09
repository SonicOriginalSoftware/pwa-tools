import { strict as assert } from "assert"

import { init } from "../lib/commands/init.js"

export const id = "Test init"

export const assertions = {
  "Default Initialize": {
    function: async () =>
      assert.doesNotReject(async () =>
        await init({
          pwa_server_repository: "",
          pwa_shell_repository: "",
          target_directory: process.cwd(),
        })
      ),
    skip: true
  },
}
