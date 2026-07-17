# Contributing

NexTool is a static site. A useful change should keep a tool focused, make its
privacy boundary clear and avoid turning a simple utility into a dependency
stack.

## Local workflow

1. Create a focused branch.
2. Start the site with `python3 -m http.server 4173`.
3. Exercise the changed page at desktop and mobile widths.
4. Run `npm test`.
5. Describe what changed, what you tested and any remaining network or browser
   requirements in the pull request.

## Page contract

- local links and assets must resolve with and without a trailing fragment
- interactive controls must be keyboard reachable and visibly labelled
- sensitive inputs must not be logged, persisted or transmitted unexpectedly
- external libraries and APIs must be necessary and visible in the page source
- claims and counters must be reproducible from public or repository evidence
- generated output must have an explicit copy or download path where relevant

Do not commit `.env` files, credentials, analytics identifiers, user data,
generated screenshots or operating-system metadata.
