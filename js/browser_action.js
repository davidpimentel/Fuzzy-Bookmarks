$(document).ready(function() {
  var bookmarks = [];
  var fuse;
  var fuseOptions = {
      keys: ["title", "url"]
  };

  chrome.bookmarks.getTree(function(bookmarkTree) {
    for (var i = 0; i < bookmarkTree.length; i++) {
      processBookmarks("", bookmarkTree[i]);
    }
    fuse = new Fuse(bookmarks, fuseOptions);
    listenForInput();
  });

  function processBookmarks(parentPath, node) {
    if (node.url !== undefined) { //is bookmark
      var title = parentPath + node.title;
      var url = node.url.startsWith("http") ? node.url : undefined;
      bookmarks.push({title: title, url: url, id: node.id});
      return;
    } else if (node.children !== undefined) {
      var path = parentPath + node.title + "/";
      for (var i = 0, count = node.children.length; i < count; i++) {
        processBookmarks(path, node.children[i]);
      }

    }
  }

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
