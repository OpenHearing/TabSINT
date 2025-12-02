const myButton = document.getElementById('testButton');

function handleButtonClick() {
    window.tabsint.logger.debug('Button clicked!');
    window.tabsint.resultsModel.updateCurrentPage({ response: 'Button clicked!' });
}

myButton.addEventListener('click', handleButtonClick);
