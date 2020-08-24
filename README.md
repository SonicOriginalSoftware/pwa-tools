# PWA Framework

# What is this?

This package is meant as a library and toolkit to build single-page progressive web applications.

# Another framework?

No. And yes. This framework tries to sift down the boilerplate and dependency hell by being (almost) fully self-contained. Its not "another javascript front-end framework"; this actually builds forward-looking progressive web apps.

# But what about the unzipper?

Yes! The unzipper I wrote from scratch and submitted back to the community to do with what they see fit. "Why didn't you just use an existing library!?!?!?!" Well, because the ones that are popular are abandoned and the ones that aren't abandoned I don't like! Simple as that!

And when I say simple - I do mean...simple. The unzipper doesn't handle _every_ possible zip file case; but what it does handle it handles using about 550 LOC, >450 of which are boilerplate data structure code to represent the zip data structures. The actual unzipping behavior is all of ~80 LOC! All using pure, easy to understand async javascript!

# NIH syndrome, much?

Its javascript. If its more complicated than what can be done in the source files contained in this framework then it doesn't belong here. This framework strives for elegance, simplicity, and robustness while creating web applications that are more easily pivoted to the ever-changing landscape of the web.

# BuT LeGaCy WeB ApPs ArE sTaBlE

Sure, so is IE11.

# What dependencies does this require?

Only a recent version of `npm`/`npx` (`13.5`+, ideally `14.0`+)

# Fine. How do I use it?

See the [Getting Started Docs](docs/GETTING_STARTED.md)

© 2020 Nathan Blair
