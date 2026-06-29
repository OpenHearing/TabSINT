// PCC battery — selection page. Builds an ordered queue of subProtocol ids, then launches dispatcher.
(function () {
  window.pccBattery = { queue: [], index: 0 };
  var statusEl = document.getElementById('pcc-queue-status');

  function render() {
    var q = window.pccBattery.queue;
    statusEl.textContent = q.length ? 'Order: ' + q.join('  →  ') : '(no tests selected)';
  }
  function add(id) { window.pccBattery.queue.push(id); render(); }

  document.getElementById('pcc-add-raads').addEventListener('click', function () { add('RAADS'); });
  document.getElementById('pcc-add-quick').addEventListener('click', function () { add('QuickQ'); });
  document.getElementById('pcc-clear').addEventListener('click', function () {
    window.pccBattery = { queue: [], index: 0 };
    render();
  });
  document.getElementById('pcc-start').addEventListener('click', function () {
    if (!window.pccBattery.queue.length) { window.tabsint.logger.warning('PCC: no tests selected.'); return; }
    window.pccBattery.index = 0;
    window.tabsint.logger.debug('PCC: starting battery ' + JSON.stringify(window.pccBattery.queue));
    window.tabsint.examService.navigateToTarget('PccDispatcher');
  });
  render();
})();
