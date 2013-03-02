$(document).ready ->
  reader = new Reader()

  reader.get_token (token) ->
    if token
      $('#logged-in').removeClass 'hidden'
      $('#logged-out').addClass 'hidden'
    else
      $('#logged-out').removeClass 'hidden'
      $('#logged-in').addClass 'hidden'

  $('#tab-login').click (e) ->
    e.preventDefault()
    display_form '.login'

  $('#tab-signup').click (e) ->
    e.preventDefault()
    display_form '.signup'

  $('#form-signup').submit (e) ->
    e.preventDefault()

    data =
      email: $('input[name=email]').val()
      password: $('input[name=password]').val()

    reader.signup data, (err, data) ->
      if err
        console.error err
      else
        alert 'Success!'

  $('#form-login').submit (e) ->
    e.preventDefault()

    email = $('input[name=login-email]').val()
    password = $('input[name=login-password]').val()

    reader.login email, password, (err, data) ->
      if err
        console.error err
      else
        alert 'You are logged in!'

  $('#logout').click (e) ->
    e.preventDefault()

    chrome.storage.local.clear (err) ->
      callback(err)

display_form = (name) ->
  $(name).addClass 'active'
  $('.forms').not(name).removeClass 'active'
