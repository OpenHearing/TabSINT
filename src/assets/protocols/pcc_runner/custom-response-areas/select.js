// pcc_runner — selection. Builds an ordered queue, then enters the Runner subprotocol.
(function () {
  window.pccBattery = { queue: [], index: 0 };
  var statusEl = document.getElementById('pcc-queue-status');
  function render() {
    var q = window.pccBattery.queue;
    statusEl.textContent = q.length ? 'Order: ' + q.join('  →  ') : '(no tests selected)';
  }
  function add(id) { window.pccBattery.queue.push(id); render(); }
  document.getElementById('pcc-add-x').addEventListener('click', function () { add('TestX'); });
  document.getElementById('pcc-add-y').addEventListener('click', function () { add('TestY'); });
  document.getElementById('pcc-clear').addEventListener('click', function () {
    window.pccBattery = { queue: [], index: 0 }; render();
  });
  document.getElementById('pcc-start').addEventListener('click', function () {
    if (!window.pccBattery.queue.length) { window.tabsint.logger.warning('PCC: no tests selected.'); return; }
    window.pccBattery.index = 0;
    window.tabsint.logger.debug('PCC: starting battery ' + JSON.stringify(window.pccBattery.queue));
    // Option B: enter the Runner subprotocol (N sequential dispatch pages) instead of a per-test loop.
    window.tabsint.examService.navigateToTarget('Runner');
  });
  render();
})();
