const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');
const button1 = document.getElementById('button1');
const button2 = document.getElementById('button2');

function handleButton1Click() {
    window.tabsint.logger.debug('Button1 clicked');
    page2.style.display = 'block';
    page1.style.display = 'none';
    window.tabsint.stateModel.updateState({ isSubmittable: true });
}

function handleButton2Click() {
    window.tabsint.logger.debug('Button2 clicked');
    page1.style.display = 'block';
    page2.style.display = 'none';
    window.tabsint.stateModel.updateState({ isSubmittable: false });
}


button1.addEventListener('click', handleButton1Click);
button2.addEventListener('click', handleButton2Click);
page1.style.display = 'block';
page2.style.display = 'none';

// prevent submitting unless on page2
window.tabsint.stateModel.updateState({ isSubmittable: false });