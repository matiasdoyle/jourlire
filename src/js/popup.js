$(document).ready(function () {
  console.log('opened!');

  var reader = new Reader(),
      req = chrome.extension.connect({ name: 'popup' }),
      current_page = {};

  req.onMessage.addListener(function (res) {
    if (res.status) {
      var ms = Date.now() - res.status.open_time,
          open = open_for(ms);

      current_page.status = res.status;

      $('#type').text(reader.get_status_string(res.status.status));
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

    current_page.tab = tab;
  });

  $('.change_status').click(function (e) {
    e.preventDefault();

    var change = ($(this).attr('id') === 'track' ?
      reader.status.user_init : reader.status.ignored);

    var msg = {
      popup : {
        action : 'change_status',
        tab_id : current_page.tab.id,
        change_to : change
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