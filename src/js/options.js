$(document).ready(function () {

  $('#tab-login').click(function (e) {
    e.preventDefault();
    display_form('.login');
  });

  $('#tab-signup').click(function (e) {
    e.preventDefault();
    display_form('.signup');
  });

  // TODO: Handle submits.
  $('#form-login').submit(function (e) {
    e.preventDefault();
    
    var data = $(this).serializeArray();

    // TODO: check if there is an async version of this...
    // chrome.extension.sendRequest({ method : 'user-login', data : data });
  });

  $('#form-signup').submit(function (e) {
    e.preventDefault();

    var data = $(this).serializeArray();
  });
});

function display_form(name) {
  $(name).addClass('active');
  $('.forms').not(name).removeClass('active');
};