chrome.runtime.onInstalled.addListener(function () {
  cacheBookmarks();
});

chrome.runtime.onStartup.addListener(function() {
  cacheBookmarks();
});

chrome.bookmarks.onCreated.addListener(cacheBookmarks);
chrome.bookmarks.onRemoved.addListener(cacheBookmarks);
chrome.bookmarks.onChanged.addListener(cacheBookmarks);
chrome.bookmarks.onMoved.addListener(cacheBookmarks);
chrome.bookmarks.onChildrenReordered.addListener(cacheBookmarks);
chrome.bookmarks.onImportEnded.addListener(cacheBookmarks);

function cacheBookmarks() {
  var bookmarks = [];
  chrome.bookmarks.getTree(function(bookmarkTree) {
    for (var i = 0; i < bookmarkTree.length; i++) {
      processBookmarks("", bookmarkTree[i]);
    }
    saveBookmarks(bookmarks);
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

  function saveBookmarks(bookmarks) {
    chrome.storage.local.set({"bookmarks": bookmarks}, function() {});
  }
}
