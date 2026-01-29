# Migration Guide from TabSINT Classic

## Develop Protocol

Please use the develop protocol to get started writing a protocol in TabSINT 5.0: https://github.com/OpenHearing/TabSINT/tree/develop/src/assets/protocols/develop.

## Parameter mapping

Please review the model interfaces to see how to access the new models variables.

For example:

- `dm.examResults.testResults.responses[i].response` --> `results.currentExam.responses[i].response`
- `disk.protocol.name` --> `disk.activeProtocolMeta.name`

## CustomJS

See [CustomJS](custom-js.md)

[PREVIOUS: Repository Organization](organization.md)

[NEXT: CustomJS Response Area Guide](custom-js.md)

[BACK TO INDEX](developer-guide-index.md)
