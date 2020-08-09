import pkg from "../package.json"

export const usage = `
  pwa-tools
  Author: ${pkg.author}
  Version: ${pkg.version}

  Commands:
    init <init_options>                 Initializes the current directory for the pwa-framework
    add-component [component-name]      Add a component
    remove-component [component-name]   Remove a component

    help                                Show this menu
    version                             Show version

  Init Options:
    --pwa-shell-repository=, -p         Specify the pwa-shell repository to fetch
    --pwa-server-repository=, -s        Specify the pwa-server repository to fetch
    --target-directory=, -t             Specify the directory to extract into
`
