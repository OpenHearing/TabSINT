const myButton = document.getElementById('testButton');

function handleButtonClick() {
    console.log('Button clicked!');
    window.results.currentPage.response = "Button clicked!";
}

myButton.addEventListener('click', handleButtonClick);
