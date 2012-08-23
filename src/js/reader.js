function Reader() {
  this.url = 'http://localhost:3000';
  this.email = '';
  this.token = '97f79487be374b3933913ce231f27419'; // TODO: TMP token
}

Reader.prototype.article = 1;
Reader.prototype.ignored = 2;
Reader.prototype.homepage = 3;
Reader.prototype.user_init = 4;
Reader.prototype.saving = 5;
Reader.prototype.saved = 6;

Reader.prototype.login = function (email, password, callback) {
  if (!email) return callback(new TypeError('email is required'), null);
  if (!password) return callback(new TypeError('password is required'), null);

  var self = this;

  $.ajax({
    url : self.url + '/v1/auth/get-token?=email=' + email + '&password=' + password,
    success : function (data) {
      if (data) {
        self.email = data.email;
        self.token = data.token;
      }
    }
  });
};

Reader.prototype.signup = function (user, callback) {
  
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
          return callback(self.ignored);
        }
      }

      callback(self.article);
    });
  } else {
    // console.log('Reader#ignore_list() Does NOT think this is an article');
    callback(self.homepage);
  }
};

Reader.prototype.save_articles = function(articles, callback) {
  var self = this,
      upload = {},
      pending = 0;

  console.log('Reader#check_articles running', articles);
  
  if (!articles)
    return callback('No articles', null);

  upload.token = this.token;

  // console.log('Reader#check_articles checking #', articles.length);

  pending = articles.length;

  function loop(i) {
    console.log('loop running', i);
    if (i < articles.length) {
      console.log('Reader#check_articles checking status', articles[i].status, self.article);

      if ((articles[i].status === self.article || articles[i].status === self.user_init) &&
          (articles[i].status !== self.saved || articles[i].status !== self.saving)) {

        console.log('trying to save', articles[i].url);

        articles[i].status = self.saving;

        upload.url = articles[i].url;
        upload.open_time = articles[i].open_time;
        upload.close_time = (articles[i].close_time ? articles[i].close_time : Date.now());

        // console.log('Reader#check_articles uploading...');

        // Saving article.
        $.ajax({
          url : self.url + '/v1/article',
          type : 'POST',
          data : upload,
          success : function (data) {
            console.log('Reader#check_articles saved', data);
            articles[i].status = self.saved;
            loop(++i);
          }
        });
      } else {
        loop(++i);
      }
    } else {
      return callback(null, articles);
    }
  }

  loop(0);
};