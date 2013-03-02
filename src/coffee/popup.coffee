reader = new Reader
req = chrome.extension.connect { name: 'popup' }
current_page = []

req.onMessage.addListener (res) ->
  if res.status
    ms = Date.now() - res.status.open_time
    current_page.status = res.status

    $('#type').text reader.status_string(res.status.status)
    $('#open-for').text "Time (m:s) #{open_for ms}"

chrome.tabs.getSelected null, (tab) ->
  req.postMessage
    popup:
      action: 'status'
      tab_id: tab.id

  current_page.tab = tab

$('.change_status').click (e) ->
  e.preventDefault()
  change = if $(this).attr 'id' is 'track' then reader.status.user_init else reader.status.ignored

  req.postMessage
    popup:
      action: 'change_status'
      tab_id: current_page.tab.id
      change_to: change

open_for = (ms) ->
  time = new Date(ms)
  "#{time.getMinutes()}:#{time.getSeconds()}"
