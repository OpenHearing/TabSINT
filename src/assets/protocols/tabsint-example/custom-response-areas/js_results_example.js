// innerHTML example
const element1 = document.getElementById("exampleID1");
element1.innerHTML = "This text is <strong>bold</strong> and includes HTML!";

// textContent example
const element2 = document.getElementById("exampleID2");
element2.textContent = "This is some example text";

// Logging results
console.log("results:", window.tabsint.resultsModel.getResults());

// Displaying an example of parsing and siaplying something from results
// Note that what is grabbed from results is 'trivial'
const resDisp = document.getElementById("resultsDisplay");
resDisp.innerHTML = JSON.stringify(window.tabsint.resultsModel.getResults().currentPage.page.responseArea.type);

// Adding a div html field that displays if 1+1=2
const conditionalEle = document.getElementById("conditionalDiv");
if (1+1==2) {
    conditionalEle.style.display = "block";
}