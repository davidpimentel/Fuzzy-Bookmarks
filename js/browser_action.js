$(document).ready(function() {
  var bookmarks;
  var fuse;

  chrome.storage.local.get("bookmarks", function(result) {
    if (result.bookmarks !== undefined) {
      bookmarks = result.bookmarks;
      var fuseOptions = {
        keys: ["title", "url"]
      };
      fuse = new Fuse(bookmarks, fuseOptions);
      listenForInput();
    }
  });

  function fuzzySearch(text) {
    return Promise.resolve(fuse.search(text));
  }

  function listenForInput() {
    var input = $('#searchBar');
    var results = $('#results');

    var keyup = Rx.Observable.fromEvent(input, 'keyup')
      .map(function (e) {
        return e.target.value;
      })
      .debounce(750)
      .distinctUntilChanged();

    var searcher = keyup.flatMapLatest(fuzzySearch);

    var subscription = searcher.subscribe(
      function (data) {

        results.empty();

        $.each(data, function(i, value) {
          $('<li>' + value.title + '</li>').appendTo(results);
        });
      },
      function (error) {
        // Handle any errors
        results.empty();

        $('<li>Error: ' + error + '</li>').appendTo(results);
    });
  }

})
