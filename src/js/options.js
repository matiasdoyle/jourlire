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
    e.preventDefault();
    
    var data = $(this).serializeArray();

    // TODO: check if there is an async version of this...
    // chrome.extension.sendRequest({ method : 'user-login', data : data });
  });
});

function display_form(name) {
  $(name).addClass('active');
  $('.forms').not(name).removeClass('active');
};