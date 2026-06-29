// PCC spike — selection page.
// Builds an ORDERED queue of subProtocol ids on a window-global, then launches
// the dispatcher. Runs in the customResponseArea eval context (window.tabsint available).
(function () {
  // Fresh queue each time the selection page loads (supports re-runs in one session).
  window.pccBattery = { queue: [], index: 0 };

  var statusEl = document.getElementById('pcc-queue-status');

  function render() {
    var q = window.pccBattery.queue;
    statusEl.textContent = q.length ? 'Order: ' + q.join('  →  ') : '(no tests selected)';
  }

  function add(id) {
    window.pccBattery.queue.push(id);
    render();
  }

  document.getElementById('pcc-add-a').addEventListener('click', function () { add('TestA'); });
  document.getElementById('pcc-add-b').addEventListener('click', function () { add('TestB'); });
  document.getElementById('pcc-clear').addEventListener('click', function () {
    window.pccBattery = { queue: [], index: 0 };
    render();
  });

  document.getElementById('pcc-start').addEventListener('click', function () {
    if (!window.pccBattery.queue.length) {
      window.tabsint.logger.warning('PCC: no tests selected.');
      return;
    }
    window.pccBattery.index = 0;
    window.tabsint.logger.debug('PCC: starting battery ' + JSON.stringify(window.pccBattery.queue));
    window.tabsint.examService.navigateToTarget('PccDispatcher');
  });

  render();
})();
