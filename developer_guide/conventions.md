# Conventions

This section will detail the various conventions we would like to enforce in the TabSINT repository.

## Commit Messages

Any line of the commit message should not be longer than 100 characters. This allows the message to be easier to read on github as well as in various git tools.
- use imperative, present tense: `change` not `changed` nor `changes`
- don't capitalize first letter
- no dot (.) at the end

## Error Handling in App

Error handling in the app can consist of many pieces:

- logging error messages
- rejecting promises
- notifying the user of an error via an `alert`
- All error notifications should be spoken from the `TabSINT` perspective
  - i.e. "TabSINT encountered an issue...", "TabSINT failed to..."

## Strive for clean code

- Keep code formatting consistent
- Avoid code duplication
- Keep files short (max ~400 lines for long services)
- Functions should do one thing and do it well
- Name functions and classes with very descriptive and specific names (no need for comments to describe what they do)
- Only use comments in a JSDoc context to document functions and classes, following the style:

```
/**
 * Description of the function or class.
 * @summary Summary of the function or class.
 * @models Models referenced.
 * @param {number} name - Description.
 * @param {number} name - Description.
 * @returns Description and type of what the function returns.
 */
```

- Declare variables as locally as possible
- Use `let` or `const` instead of `var`
- Use the SonarLint VSCode extension and address issues before merging into the develop or main branches
- Avoid too many arguments in the function (not more than 3)
- Avoid Using Flags as Function Parameters
- Use Guard Clauses (Fail Fast)


[PREVIOUS: Repository Organization](organization.md)

[NEXT: Contributing Guidelines](contributing.md)

[BACK TO INDEX](developer-guide-index.md)