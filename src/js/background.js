(function () {
  'use strict';

  var reader = new Reader();

  // TODO: Tmp
  var tmp = ['http*://google.com', 'github.com', 'reddit.com', 'facebook.com'];

  chrome.storage.local.set({ 'ignore_list' : tmp }, function () {
    console.log('saved!');
  });

  /**
   * Listen to messages from popup.js
   */
  chrome.extension.onConnect.addListener(function (sender) {
    sender.onMessage.addListener(function (req) {
      if (req.popup) {
        if (req.popup.action === 'status') {
          var stat = reader.get_article_status(req.popup.tab_id);
          sender.postMessage({ status : stat });
        }
      }
    });
  });

  /**
   * onCreated gets called when a tab is created. This listener adds an entry
   * in the articles object.
   *
   * TODO: Should maybe call a function to check that we do not have any tabs that are closed.
   */
  chrome.tabs.onCreated.addListener(function (tab) {
    console.log('--------- onCreated called', tab);

    reader.articles[tab.id] = [];
  });

  /**
   * onRemoved gets called when a tab is physically removed (closed) or
   * the user navigates to a different website through the omnibox. The latter is
   * not consistent. Sometimes it is called and other times it is not.
   * 
   * When onRemoved gets called we check if there are any articles that have
   * not been saved in that tab group, before deleting the group to free up
   * some memory.
   */
  chrome.tabs.onRemoved.addListener(function (id) {
    console.log('--------- onRemoved called', id);

    if (reader.articles.hasOwnProperty(id)) {
      // Save articles from the tab group which has been removed.
      reader.save_articles(reader.articles[id], function (err, art) {
        console.log('reader.articles saved', art);

        // Remove tab group from `reader.articles`.
        delete reader.articles[id];
      });
    } else {
      console.error('Unknown tab group removed!');
    }
  });

  chrome.tabs.onUpdated.addListener(function (id, change, tab) {
    console.log('--------- onUpdated called');

    if (tab.status === 'complete' && !tab.url.match(/[^!]#.*/)) {
      reader.ignore_list(tab.url, function (status) {
        console.log(status);

        if (!reader.articles.hasOwnProperty(id)) {
          reader.articles[id] = [];
        }

        var current = reader.articles[id].length;

        if (current > 0)
          reader.articles[id][current - 1].close_time = Date.now();

        reader.articles[id][current] = {
          url : tab.url,
          status : status,
          open_time : Date.now(),
          scroll : 0
        };

        console.log(reader.articles);
      });
    }
  });
})();