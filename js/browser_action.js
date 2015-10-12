$(document).ready(function() {
  var bookmarks;
  var filteredBookmarks;
  var activeBookmarkIndex = 1;
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

    var keyupObservable = Rx.Observable.fromEvent(input, 'keyup')
      .map(function (e) {
        return e.target.value;
      })
      .debounce(250)
      .distinctUntilChanged();

    var commandKeypress = Rx.Observable.fromEvent(input, 'keydown')
      .filter(isCommandKeypress)
      .do(function(e) { e.preventDefault();})
      .map(function (e) {
        switch(e.keyCode) {
          case 38:
            return "up";
          case 40:
            return "down";
          case 13:
            return "enter";
        }
      });

    var searcher = keyupObservable.flatMapLatest(fuzzySearch);

    var keyupSubscription = searcher.subscribe(
      function (data) {
        activeBookmarkIndex = 1;
        filteredBookmarks = data;
        results.empty();

        $.each(data, function(i, value) {
          $('<li>' + value.title + '</li>').appendTo(results);
        });
        highlightSelectedBookmark();
      },
      function (error) {
        // Handle any errors
        results.empty();

        $('<li>Error: ' + error + '</li>').appendTo(results);
    });

    var commandSubscription = commandKeypress.subscribe(
      function(keypress) {
        switch(keypress) {
          case "up":
            activeBookmarkIndex = activeBookmarkIndex > 1 ? activeBookmarkIndex - 1 : filteredBookmarks.length;
            highlightSelectedBookmark();
            break;
          case "down":
            activeBookmarkIndex = activeBookmarkIndex < filteredBookmarks.length ?
              activeBookmarkIndex + 1 : 1;
            highlightSelectedBookmark();
            break;
          case "enter":
            var id = filteredBookmarks[activeBookmarkIndex - 1].id;
            chrome.bookmarks.get(id, function(bookmarks) {
              if (bookmarks.length > 0) {
                var url = bookmarks[0].url;
                chrome.tabs.create({url: url}, function(){});
              }
            });
            break;
        }

      });
  }

  function isCommandKeypress(e) {
    return e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 13;
  }
  function highlightSelectedBookmark() {
    $("#results > li").removeClass("active");
    $("#results > li:nth-child(" + activeBookmarkIndex + ")").addClass("active");
  }

});
