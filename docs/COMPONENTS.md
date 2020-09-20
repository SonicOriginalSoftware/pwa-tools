# What is a component?

A component is a custom element made to take the boilerplating and monotony of Web Components and make it more straight-forward to jump into. It takes advantage of a number of different technologies including shadow elements, templates, and lazy-loading events.

# Adding components and libraries

To add components or libraries, run `npx @sonicoriginalsoftware/pwa-tools init $resource-archive $resource-path`

This will download the resource source folder (containing a mixture of HTML files, CSS files, and JS files). From there, simply add the component name and path to the component folder to the `components` array that is passed in to the `load_components` function in the `init.js` file. More about that can be read [here](WORKFLOW.md#Component_Initialization)

# Removing components and libraries

To remove components, run `npx @sonicoriginalsoftware/pwa-tools de-init $resource-path`

This command will remove the resource by deleting the resource source folder.

# Customization

Generally customization is allowed through component styling/`css` but depending on the nature of the component their behavior may be customized as well. See the documentation on each component for details on what and how to style and what behavior can be customized.

# Loading (Lazily)

TODO

# Relationships

Components need to be attached to the DOM at some point. Actual `HTMLElements` end up attached to the DOM shadow-host, but the actual component needs to be attached to the DOM so to allow its shadow root to exist.

Relationships between components are handled through the relationships data structure. This data structure informs the DOM that when certain elements of the DOM become visible, these components should be attached and drawn. The data structure consists of mapping which DOM elements to attach the component to and the HTML DOM relationship in which they are attached (`beforeend`, `afterbegin`, etc.).
