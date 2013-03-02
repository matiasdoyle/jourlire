reader = new Reader

tmp = ['google.com', 'github.com', 'reddit.com', 'facebook.com']

###
Listen to messages from popup.js
###
chome.extension.onConnect.addListener (sender) ->
  sender.onMessage.addListener (req) ->
    if req.popup
      if req.popup.action is 'status'
        sender.postMessage { status: reader.get_article_status(req.popup.tab_id) }
      
      else if req.popup.action is 'change_status'  
        if reader.change_status req.popup
          sender.postMessage
            changed: true
            status: reader.get_article_status(req.popup.tab_id)

###
onCreated gets called when a tab is created. This listener adds an entry
in the articles object.

TODO: Should maybe call a function to check that we do not have any tabs that are closed.
###
chrome.tabs.onCreated.addListener (tab) ->
  reader.articles[tab.id] = []

###
onRemoved gets called when a tab is physically removed (closed) or
the user navigates to a different website through the omnibox. The latter is
not consistent. Sometimes it is called and other times it is not.

When onRemoved gets called we check if there are any articles that have
not been saved in that tab group, before deleting the group to free up
some memory.
###
chrome.tabs.onRemoved.addListener (id) ->
  if reader.articles.hasOwnProperty id
    reader.save_articles reader.articles[id], (err, saved) ->
      delete reader.articles[id]

###
...
###
chrome.tabs.onUpdated.addListener (id, change, tab) ->
  if tab.status is 'complete' and not tab.url.match /[^!]#.*/
    reader.ignore_list tab.url, (status) ->
      if not reader.articles.hasOwnProperty id
        reader.articles[id] = []

      current = reader.articles[id].length

      if current > 0
        reader.articles[id][current - 1].close_time = Date.now()

      reader.articles[id][current] =
        url: tab.url
        status: status
        open_time: Date.now()
        scroll: 0
