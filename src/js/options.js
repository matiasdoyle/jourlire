// Generated by CoffeeScript 1.5.0
(function() {
  var display_form;

  $(document).ready(function() {
    var reader;
    reader = new Reader();
    reader.get_token(function(token) {
      if (token) {
        $('#logged-in').removeClass('hidden');
        return $('#logged-out').addClass('hidden');
      } else {
        $('#logged-out').removeClass('hidden');
        return $('#logged-in').addClass('hidden');
      }
    });
    $('#tab-login').click(function(e) {
      e.preventDefault();
      return display_form('.login');
    });
    $('#tab-signup').click(function(e) {
      e.preventDefault();
      return display_form('.signup');
    });
    $('#form-signup').submit(function(e) {
      var data;
      e.preventDefault();
      data = {
        email: $('input[name=email]').val(),
        password: $('input[name=password]').val()
      };
      return reader.signup(data, function(err, data) {
        if (err) {
          return console.error(err);
        } else {
          return alert('Success!');
        }
      });
    });
    $('#form-login').submit(function(e) {
      var email, password;
      e.preventDefault();
      email = $('input[name=login-email]').val();
      password = $('input[name=login-password]').val();
      return reader.login(email, password, function(err, data) {
        if (err) {
          return console.error(err);
        } else {
          return alert('You are logged in!');
        }
      });
    });
    return $('#logout').click(function(e) {
      e.preventDefault();
      return chrome.storage.local.clear(function(err) {
        return callback(err);
      });
    });
  });

  display_form = function(name) {
    $(name).addClass('active');
    return $('.forms').not(name).removeClass('active');
  };

}).call(this);
