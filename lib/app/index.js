var app = require('derby').createApp(module)
  .use(require('derby-ui-boot'))
  .use(require('../../ui'))

app.get('/', function(page) {
  page.render('home');
});

app.get('/form/:id', function(page, model, params, next) {
  var formular = model.at('form.' + params.id);
  formular.subscribe(function(err) {
	if(err) return next(err);
      model.ref('_page.form', formular);
	page.render('form');
  })
  
});


app.get('/list', function(page, model, params, next) {
  var userId = model.get('_session.userId');
  var user = model.at('users.' + userId);

  var itemsQuery = model.query('items', {userId: userId});

  model.subscribe(user, itemsQuery, function(err) {
    if (err) return next(err);

    model.ref('_page.user', user);
    itemsQuery.ref('_page.items');

    user.increment('visits');
    page.render('list');
  });
});


// CONTROLLER FUNCTIONS //

app.fn('vorschlaege.add', function(e, el) {
  var newItem = this.model.del('_page.form.inhalt');
  if (!newItem) return;
  newItem.userId = this.model.get('_session.userId');
  this.model.add('items', newItem);
});

