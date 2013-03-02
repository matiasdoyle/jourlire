// Generated by CoffeeScript 1.5.0
(function() {
  var reader, tmp;

  reader = new Reader;

  tmp = ['google.com', 'github.com', 'reddit.com', 'facebook.com'];

  chrome.storage.local.set({
    ignore_list: tmp
  }, function() {
    return console.log('Saved tmp ignore list');
  });

  /*
  Listen to messages from popup.js
  */


  chrome.extension.onConnect.addListener(function(sender) {
    return sender.onMessage.addListener(function(req) {
      if (req.popup) {
        if (req.popup.action === 'status') {
          return sender.postMessage({
            status: reader.get_article_status(req.popup.tab_id)
          });
        } else if (req.popup.action === 'change_status') {
          if (reader.change_status(req.popup)) {
            return sender.postMessage({
              changed: true,
              status: reader.get_article_status(req.popup.tab_id)
            });
          }
        }
      }
    });
  });

  /*
  onCreated gets called when a tab is created. This listener adds an entry
  in the articles object.
  
  TODO: Should maybe call a function to check that we do not have any tabs that are closed.
  */


  chrome.tabs.onCreated.addListener(function(tab) {
    return reader.articles[tab.id] = [];
  });

  /*
  onRemoved gets called when a tab is physically removed (closed) or
  the user navigates to a different website through the omnibox. The latter is
  not consistent. Sometimes it is called and other times it is not.
  
  When onRemoved gets called we check if there are any articles that have
  not been saved in that tab group, before deleting the group to free up
  some memory.
  */


  chrome.tabs.onRemoved.addListener(function(id) {
    if (reader.articles.hasOwnProperty(id)) {
      return reader.save_articles(reader.articles[id], function(err, saved) {
        return delete reader.articles[id];
      });
    }
  });

  /*
  ...
  */


  chrome.tabs.onUpdated.addListener(function(id, change, tab) {
    if (tab.status === 'complete' && !tab.url.match(/[^!]#.*/)) {
      return reader.ignore_list(tab.url, function(status) {
        var current;
        if (!reader.articles.hasOwnProperty(id)) {
          reader.articles[id] = [];
        }
        current = reader.articles[id].length;
        if (current > 0) {
          reader.articles[id][current - 1].close_time = Date.now();
        }
        return reader.articles[id][current] = {
          url: tab.url,
          status: status,
          open_time: Date.now(),
          scroll: 0
        };
      });
    }
  });

}).call(this);
