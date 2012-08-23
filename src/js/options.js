$(document).ready(function () {
  var reader = new Reader();

  $('#tab-login').click(function (e) {
    e.preventDefault();
    display_form('.login');
  });

  $('#tab-signup').click(function (e) {
    e.preventDefault();
    display_form('.signup');
  });

  $('#form-signup').submit(function (e) {
    e.preventDefault();

    var data = $(this).serializeArray();

    reader.signup(data, function (err, data) {
      if (err)
        console.error(err);
      else
        alert('Success!'); // TODO: Proper confirmation
    });
  });

  $('#form-login').submit(function (e) {
    var email = $('input[name=login-email]').val(),
        pass  = $('input[name=login-password]').val();

    e.preventDefault();

    if (!email) return alert('Missing email');
    if (!pass) return alert('Missing password');

    reader.login(email, pass, function (err, data) {
      if (err)
        console.error(err);
      else
        alert('You are logged in!');
    });
  });
});

function display_form(name) {
  $(name).addClass('active');
  $('.forms').not(name).removeClass('active');
};