class Reader
  url: 'http://localhost:3000'

  status:
    article: 1
    ignored: 2
    homepage: 3
    user_init: 4
    saving: 5
    saved: 6

  articles: {}

  ###
  Get the human readable version of the statuses.

  Currently it is very simple and just returning the internal names
  for the statuses.
   
  @param {Number} n See this.status.
  @return {String} The status string.
  ###
  status_string: (n)  ->
    for s of @status
      return s if @status[s] is n

  ###
  Login user.

  Sends a request to the server and saves the user's token if
  the user exists.

  @param {String} email    
  @param {String} password
  @param {Function} callback Given two params (err, data). err is the errors
                             returned by the server.
  ###
  login: (email, password, callback) ->
    return callback(new TypeError('email is required'), null) if not email
    return callback(new TypeError('password is required'), null) if not password

    $.ajax
      url: "#{@url}/v1/auth/get-token?email=#{email}&password=#{password}"
      success: (res) =>
        return callback(res, null) if not res.token
        
        @set_settings { token: res.token, email: email }, (saved) ->
          if saved?
            @_token = res.token

          callback(null, res)

  ###
  Signup user.
 
  Sends a POST request to the server with the user data. If
  the user gets added the retrun from the server is the new
  user's token.
  
  @param {Object} user User object containing user and password.
  @param {Function} callback Given two params (err, data). data is the user object
                             returned from the server.
  ###
  signup: (user, callback) ->
    return callback(new TypeError('user is required'), null) if not user

    if not user.email or not user.password
      return callback(new TypeError('email and password is required'), null)

    $.ajax
      url: "#{@url}/v1/user"
      type: 'POST'
      data: user
      success: (res) =>
        return callback(res, null) if not res.token

        @set_settings { token: res.token, email: email }, (saved) ->
          if saved?
            @_token = res.token

          callback(null, res)

  ###
  Set settings to the settings object. The settings object is stored in
  localStorage.
  
  @param {Object} settings The settings to be added.
  @param {Function} callback Given one param (saved).
  ###
  set_settings: (settings, callback) ->
    return callback(false) if not settings or settings isnt 'object'

    @get_settings (data) ->
      $.extend data, settings
      chrome.storage.local.set { settings: data }, ->
        callback(true)

  ###
  Get setting from the settings object.
  
  @param {String|Function} key Key to search. Function to return
                               the whole settings object.
  @param {Function} callback Given the setting string/object.
  ###
  get_settings: (key, callback) ->
    if typeof key is 'function'
      callback = key
      key = null

    chrome.storage.local.get 'settings', (data) ->
      data.settings = data.settings || {}

      if key
        callback(data.settings[key])
      else
        callback(data.settings)

  ###
  Get the current token. If the token does not exist in
  `this._token` or in `localStorage` the user gets prompted to
  login again.

  @param {Function} callback Given `token` if token exists.
  ###
  get_token: (callback) ->
    return callback(@_token) if @_token

    @get_settings 'token', (token) =>
      if token?
        @_token = token
        callback(token)
      else
        callback(false)

  ###
  Prompt the user to loging.

  Will open a new tab with the options page, if it is not already open.
  ###
  prompt_login: ->
    url = chrome.extensions.getURL('options.html')

    chrome.tabs.query { url: url }, (query) ->
      chrome.tabs.create { url: url } if query.length is 0

  ###
  Get current article's status.

  @param {Number} tab_id The tab group to find the article in.
  @return {Object} The article status object.
  ###
  get_article_status: (tab_id) ->
    article = @articles[tab_id]
    article[article.length - 1]

  ###
  Checks if the URL matches the article format.

  Currently the function only checks if the URL contains a path. If
  it does it continues to check the URL does not exist in the 'ignore_list'.

  TODO: Update ignore_list with proper URLs.
  TODO: Move away from `indexOf` to regex instead.

  @param {String} url The URL to check.
  @param {Function} callback Given the status of the URL. See Reader#status for
                             more information.
  ###
  ignore_list: (url, callback) ->
    return callback(@status.article) if not url.match /\/.+\..+\/.+/

    chrome.storage.local.get 'ignore_list', (data) =>
      for i in data.ignore_list
        url = url.replace /http(|s):\/\/(www\.|)/, ''

        if url.indexOf data.ignore_list[i] isnt -1
          callback(@status.ignored)
        else
          callback(@status.article)

  ###
  Saves articles to server.

  @param {Array} articles Array of the potential articles to upload.
  @param {Function} callback Given two params (err, articles). Passes back the
                             modified articles object if no errors occure.
  ###
  save_articles: (articles, callback) ->
    return callback(new TypeError('No articles'), null) if not articles

    @get_token (token) =>
      if not token
        @prompt_login()
        return callback(new Error('User not logged in'), null)

      articles.forEach (article) ->
        if article.status is @status.article or article.status is @status.user_init
          article.status = @status.saving
          article.token = token

          if not article.close_time
            article.close_time = Date.now()

          time_spent = article.close_time - article.open_time

          if time_spent > @min_time
            $.ajax
              url: "#{@url}/v1/article"
              type: 'POST'
              data: article
              success: (data) ->
                # TODO: Check that the data is 200
                article.status = @status.saved
                callback(null, true)

  ###
  Change status of the current article to that given
  in options.change_to.

  @param {String} tab_id The tab group to change the front most article/
  @param {Number} to The status to change to.
  @return {Boolean} returns false if changing status fails.
  ###
  change_status: (tab_id, to) ->
    return false if not tab_id or not to

    article = @articles[tab_id]
    article[article.length - 1].status = to
