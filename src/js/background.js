(function () {
  var articles = {},
      reader = new Reader();

  // TODO: Tmp
  var tmp = ['google', 'github', 'reddit.com'];

  chrome.storage.local.set({ 'ignore_list' : tmp }, function () {
    console.log('saved!');
  });

  chrome.tabs.onActivated.addListener(function (obj) {
    console.log('onActivated', obj);
  });

  chrome.tabs.onHighlighted.addListener(function (id, arr) {
    console.log('onHighlighted id', id);
    console.log('onHighlighted arr', arr);
  });

  // chrome.extension.onMessage(function () {});

  // Event on exension installed
  // -> Display options page

  /**
   * onCreated gets called when a tab is created. This listener adds an entry
   * in the articles object.
   *
   * TODO: Should maybe call a function to check that we do not have any tabs that are closed.
   */
  chrome.tabs.onCreated.addListener(function (tab) {
    console.log('--------- onCreated called', tab);

    articles[tab.id] = [];
  });

  /**
   * onRemoved gets called when a tab is physically removed (closed) or
   * the user navigates to a different website through the omnibox. The latter is
   * not documented in the Chrome API documentation, but for Chrome 21 (OS X) it is
   * the case.
   * 
   * When onRemoved gets called we check if there are any articles that have
   * not been saved in that tab group, before deleting the group to free up
   * some memory.
   */
  chrome.tabs.onRemoved.addListener(function (id) {
    console.log('--------- onRemoved called', id);

    if (articles.hasOwnProperty(id)) {
      // Save articles from the tab group which has been removed.
      reader.save_articles(articles[id], function (err, art) {
        console.log('Articles saved', art);

        // Remove tab group from `articles`.
        delete articles[id];
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

        if (!articles.hasOwnProperty(id)) {
          articles[id] = [];
        }

        var current = articles[id].length;

        if (current > 0)
          articles[id][current - 1].close_time = Date.now();

        articles[id][current] = {
          url : tab.url,
          status : status,
          open_time : Date.now(),
          scroll : 0
        };

        console.log(articles);
      });
    }
  });
})();