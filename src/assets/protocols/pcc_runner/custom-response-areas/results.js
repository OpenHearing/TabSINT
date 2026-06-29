// pcc_runner — selectable results dashboard.
(function () {
  window.tabsint.stateModel.updateState({ isSubmittable: true });
  var tests = [
    { id: 'TestX', label: 'Test X' },
    { id: 'TestY', label: 'Test Y' },
  ];
  var results = window.tabsint.resultsModel.getResults();
  var responses = (results && results.currentExam && results.currentExam.responses) || [];
  function responsesFor(testId) {
    return responses.filter(function (r) { return (r.pageId || '').indexOf(testId) === 0; });
  }
  var boxes = document.getElementById('pcc-result-boxes');
  tests.forEach(function (t) {
    if (responsesFor(t.id).length === 0) return;
    var label = document.createElement('label'); label.style.display = 'block';
    var cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = t.id; cb.className = 'pcc-cb';
    label.appendChild(cb); label.appendChild(document.createTextNode(' ' + t.label));
    boxes.appendChild(label);
  });
  if (!boxes.children.length) boxes.textContent = '(no test results found in this session)';
  document.getElementById('pcc-show').addEventListener('click', function () {
    var out = document.getElementById('pcc-result-output'); out.innerHTML = '';
    var checked = [].slice.call(document.querySelectorAll('.pcc-cb:checked')).map(function (c) { return c.value; });
    if (!checked.length) { out.textContent = '(select one or more tests above)'; return; }
    checked.forEach(function (id) {
      var block = document.createElement('div'); block.style.marginBottom = '10px';
      var h = document.createElement('h4'); h.textContent = id + ' results'; h.style.margin = '4px 0';
      block.appendChild(h);
      responsesFor(id).forEach(function (r) {
        var line = document.createElement('div'); line.textContent = r.pageId + ': ' + JSON.stringify(r.response);
        block.appendChild(line);
      });
      out.appendChild(block);
    });
  });
})();
