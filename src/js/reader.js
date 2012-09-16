function Reader() {
  this.url = 'http://localhost:3000';

  // TODO: Hardcoded value of 10 secs.
  this.min_time_spent = 10000;
}

/**
 * The status codes for the article.
 * TODO: Create an human readable version of this function.
 * 
 * @type {Object}
 */
Reader.prototype.status = {
  article : 1,
  ignored : 2,
  homepage : 3,
  user_init : 4,
  saving : 5,
  saved : 6
};

/**
 * The stored articles. TODO: Should maybe use localStorage instead.
 * 
 * @type {Object}
 */
Reader.prototype.articles = {};

/**
 * Login user.
 *
 * Sends a request to the server and saves the user's token if
 * the user exists.
 * 
 * @param  {String}   email    
 * @param  {String}   password
 * @param  {Function} callback Given two params (err, data). err is the errors
 *                             returned by the server.
 */
Reader.prototype.login = function (email, password, callback) {
  var self = this;

  if (!email) return callback(new TypeError('email is required'), null);
  if (!password) return callback(new TypeError('password is required'), null);

  $.ajax({
    url : self.url + '/v1/auth/get-token?email=' + email + '&password=' + password,
    success : function (data) {
      if (data.token) {
        self.set_settings({ token : data.token, email : email }, function (saved) {
          if (saved)
            self._token = data.token;

          callback(null, data);
        });
      } else {
        callback(data, null);
      }
    }
  });
};

/**
 * Signup user.
 *
 * Sends a POST request to the server with the user data. If
 * the user gets added the retrun from the server is the new
 * user's token.
 * 
 * @param  {Array}   user      $.serializeArray() formatted array.
 * @param  {Function} callback Given two params (err, data). data is the user object
 *                             returned from the server.
 */
Reader.prototype.signup = function (user, callback) {
  var self = this,
      required, settings;

  if (!user)
    return callback(new TypeError('`user` is required'), null);

  required = {
    email : 0,
    password : 0
  };

  for (var i=0; i<user.length; i++) {
    if (required.hasOwnProperty(user[i].name) && user[i].value !== '')
      required[user[i].name] = 1;
  }

  if (required.email == 0) return callback(new TypeError('email is required'), null);
  if (required.password == 0) return callback(new TypeError('password is required'), null);

  $.ajax({
    url : self.url + '/v1/user',
    type : 'POST',
    data : user,
    success : function (data) {
      if (data.token) {
        settings = { token : data.token, email : data.email };
        self.set_settings(settings, function (saved) {
          if (saved)
            self._token = data.token;

          callback(null, data);
        });
      } else {
        callback(data, null);
      }
    }
  });
};

/**
 * Set settings to the settings object. The settings object is stored in
 * localStorage.
 * 
 * @param {Object}   settings   The settings to be added.
 * @param {Function} callback   Given one param (saved).
 */
Reader.prototype.set_settings = function(settings, callback) {
  if (!settings || typeof settings !== 'object')
    return callback(false);

  this.get_settings(function (data) {
    $.extend(data, settings);

    chrome.storage.local.set({ 'settings' : data }, function () {
      callback(true);
    });
  });
};

/**
 * Get setting from the settings object.
 * 
 * @param  {String|Function}   key      Key to search. Function to return
 *                                      the whole settings object.
 * @param  {Function}          callback Given the setting string/object.
 */
Reader.prototype.get_settings = function(key, callback) {
  var settings;

  if (typeof key === 'function') {
    callback = key;
    key = null;
  }

  chrome.storage.local.get('settings', function (data) {
    data.settings = data.settings || {};

    if (key) {
      callback(data.settings[key]);
    } else {
      console.log(data.settings);
      callback(data.settings);
    }
  });
};

/**
 * Get the current token. If the token does not exist in
 * this._token or in localStorage the user gets prompted to
 * login again.
 *
 * @param  {Function} callback Given `token` if token exists.
 */
Reader.prototype.get_token = function(callback) {
  var self = this;

  if (this._token) {
    callback(this._token);
  } else {
    this.get_settings('token', function (token) {
      if (token) {
        self._token = token;
        callback(token);
      } else {
        console.warn('Token missing! Prompting login.');
        callback(false);
      }
    });
  }
};

Reader.prototype.prompt_login = function() {
  var options_url = chrome.extension.getURL('options.html');

  chrome.tabs.query({ url : options_url }, function (query) {
    if (query.length == 0)
      chrome.tabs.create({ url : options_url });
  });
};

/**
 * Get current article's status.
 * 
 * @param  {Number} tab_id The tab group to find the article in.
 * @return {Object}        The article status object.
 */
Reader.prototype.get_article_status = function (tab_id) {
  var article = this.articles[tab_id];
  return article[article.length - 1];
};

/**
 * Checks if the URL matches the article format.
 *
 * Currently the function only checks if the URL contains a path. If
 * it does it continues to check the URL does not exist in the 'ignore_list'.
 *
 * TODO: Update ignore_list with proper URLs.
 * TODO: Move away from `indexOf` to regex instead.
 * 
 * @param  {String}   url      The URL to check.
 * @param  {Function} callback Given the status of the URL. See Reader#status for
 *                             more information.
 * @return {[type]}            [description]
 */
Reader.prototype.ignore_list = function (url, callback) {
  var self = this;

  if (url.match(/\/.+\..+\/.+/)) {
    chrome.storage.local.get('ignore_list', function (data) {
      for (var i=0; i<data.ignore_list.length; i++) {
        url = url.replace(/http(|s):\/\/(www\.|)/, '');

        if (url.indexOf(data.ignore_list[i]) !== -1) {
          return callback(self.status.ignored);
        }
      }

      callback(self.status.article);
    });
  } else {
    callback(self.status.homepage);
  }
};

/**
 * Saves articles to server.
 * 
 * @param  {Array}    articles Array of the potential articles to upload.
 * @param  {Function} callback Given two params (err, articles). Passes back the
 *                             modified articles object if no errors occure.
 */
Reader.prototype.save_articles = function(articles, callback) {
  var self = this,
      upload = {},
      pending = 0,
      time_spent = 0;
  
  if (!articles)
    return callback('No articles', null);

  this.get_token(function (token) {
    if (!token) {
      self.prompt_login();
      return callback(new Error('Not logged in!'), null);
    }

    upload.token = token;

    function loop(i) {
      console.log('loop running', i);
      if (i < articles.length) {
        console.log('Reader#check_articles checking status', articles[i].status, self.status.article);

        if ((articles[i].status === self.status.article || articles[i].status === self.status.user_init) &&
            (articles[i].status !== self.status.saved || articles[i].status !== self.status.saving)) {

          console.log('trying to save', articles[i].url);

          articles[i].status = self.status.saving;

          upload.url = articles[i].url;
          upload.open_time = articles[i].open_time;
          upload.close_time = (articles[i].close_time ? articles[i].close_time : Date.now());

          time_spent = upload.close_time - upload.open_time;

          if (time_spent > self.min_time_spent) {
            $.ajax({
              url : self.url + '/v1/article',
              type : 'POST',
              data : upload,
              success : function (data) {
                console.log('Reader#check_articles saved', data);
                articles[i].status = self.status.saved;
                loop(++i);
              }
            });
          } else {
            console.warn('time_spent is less than the min time for %s ignoring', articles[i].url);
            articles[i].status = self.status.ignored;
            loop(++i);
          }
        } else {
          loop(++i);
        }
      } else {
        return callback(null, articles);
      }
    }

    loop(0);
  });
};

/**
 * Change status of the current article to that given
 * in options.change_to.
 * 
 * @param  {Object} options Options object which should include `change_to` and
 *                          `tab_id`
 * @return {Bool}           true on success and false if not.
 */
Reader.prototype.change_status = function(options) {
  if (!options || (!options.change_to || !options.tab_id))
    return false;

  var article = this.articles[options.tab_id];

  article[article.length - 1].status = options.change_to;

  return true;
};
