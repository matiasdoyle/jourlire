function Reader() {
  this.url = 'http://localhost:3000';
  this.email = '';
  this.token = '97f79487be374b3933913ce231f27419'; // TODO: TMP token

  // TODO: Hardcoded value of 10 secs.
  this.min_time_spent = 10000;
}

Reader.prototype.status = {
  article : 1,
  ignored : 2,
  homepage : 3,
  user_init : 4,
  saving : 5,
  saved : 6
};

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
        callback(false); // TODO: Prompt login.
      }
    });
  }
};

Reader.prototype.ignore_list = function (url, callback) {
  var self = this;

  if (url.match(/\/.+\..+\/.+/)) {
    // console.log('Reader#ignore_list() Think this is an article');

    chrome.storage.local.get('ignore_list', function (data) {
      // console.log('Reader#ignore_list() storage.get', data);
      
      // console.log(data.ignore_list.length);

      for (var i=0; i<data.ignore_list.length; i++) {
        url = url.replace(/http(|s):\/\/(www\.|)/, '');

        // console.log('datai', url);

        if (url.indexOf(data.ignore_list[i]) !== -1) {
          // console.log('Reader#ignore_list() ignoring');
          return callback(self.status.ignored);
        }
      }

      callback(self.status.article);
    });
  } else {
    // console.log('Reader#ignore_list() Does NOT think this is an article');
    callback(self.status.homepage);
  }
};

Reader.prototype.save_articles = function(articles, callback) {
  var self = this,
      upload = {},
      pending = 0,
      time_spent = 0;

  console.log('Reader#check_articles running', articles);
  
  if (!articles)
    return callback('No articles', null);

  this.get_token(function (token) {
    upload.token = token;
  });

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
};