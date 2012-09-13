$(document).ready(function () {
  // var reader = new Reader();
  console.log('opened!');

  var req = chrome.extension.connect({ name: 'popup' });

  req.onMessage.addListener(function (res) {
    if (res.status) {
      var ms = Date.now() - res.status.open_time,
          open = open_for(ms);

      $('#type').text(res.status.status);
      $('#open-for').text('Time (m:s) ' + open);
    }
  });

  chrome.tabs.getSelected(null, function (tab) {
    var msg = {
      popup : {
        action : 'status',
        tab_id : tab.id
      }
    };

    req.postMessage(msg);
  });
});

// TODO: Just a test at the moment
function open_for (ms) {
  var time = new Date(ms);

  return time.getMinutes() + ':' + time.getSeconds();
}