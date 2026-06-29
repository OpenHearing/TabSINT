// PCC spike — dispatcher.
// Runs every time control returns here (each test ends with {reference: "PccDispatcher"}).
// Pops the next queued subProtocol id and navigates to it; when the queue is exhausted,
// routes to the results dashboard.
//
// navigateToTarget() is deferred with setTimeout(0) so it runs AFTER this customResponseArea
// eval / page subscription finishes, avoiding reentrant page-change delivery mid-eval.
(function () {
  var battery = window.pccBattery || { queue: [], index: 0 };
  var target;

  if (battery.index < battery.queue.length) {
    target = battery.queue[battery.index];
    battery.index = battery.index + 1;
    window.tabsint.logger.debug('PCC dispatch -> ' + target + ' (' + battery.index + '/' + battery.queue.length + ')');
  } else {
    target = 'PccResults';
    window.tabsint.logger.debug('PCC dispatch -> results (queue exhausted)');
  }

  setTimeout(function () {
    window.tabsint.examService.navigateToTarget(target);
  }, 0);
})();
