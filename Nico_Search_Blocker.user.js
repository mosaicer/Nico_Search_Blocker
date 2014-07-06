// ==UserScript==
// @name        Nico Search Blocker
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description ニコニコの動画検索時、各動画のタグ一覧の表示をするボタンを追加する
// @include     http://www.nicovideo.jp/tag/*
// @include     http://www.nicovideo.jp/search/*
// @version     1.0
// @grant       GM_xmlhttpRequest
// @require     http://code.jquery.com/jquery-2.1.1.min.js
// ==/UserScript==

$(function () {
  var clickTriangle = $("<li>").addClass("tagsCheck").text("▼"); // タグ一覧を表示するボタン

  // タグ一覧を表示するボタンを挿入
  $(".itemData > .list > li:nth-child(4n)").after(clickTriangle);

  // タグ一覧表示とタグをブロックリストに追加する動作関連-----------------------------------------------------------
  // クリックした時
  $(".tagsCheck").css("color", "#B22222").css("cursor", "pointer").click(function () {
        // クリックした要素の親要素
    var thisParent,
        // 動画のID
        vidsmNum;

    // タグ一覧を開いてない時
    if ($(this).text() === "▼") {
      $(this).text("▲");

      thisParent = $(this).parent(); // タグ挿入時に指定するセレクタ
      vidsmNum = $(this).prev().find("a").attr("href").substring(33); // 動画のIDを取得する

      // HTTPリクエスト
      GM_xmlhttpRequest({
        method: "GET",
        url: "http://www.nicovideo.jp/watch/" + vidsmNum,
        onload: function (httpSource) {
          var i,
              // DOMにパースする関連
              parser,
              doc,
              // タグのリンク
              vidTags,
              // 全てのタグ
              allTags;

          // 文字列で格納されたHTMLのソースをDOMにパースする
          parser = new DOMParser();
          doc = parser.parseFromString(httpSource.responseText, "text/html");

          // タグのリンクを取得
          vidTags = doc.querySelectorAll("a[class='videoHeaderTagLink']");
          for (i = 0; i < vidTags.length - 1; i++) { // vidTagsの最後に空白が入っているのでそれを取らないために-1する
            if (i !== 0) {
              allTags += ",　" + "<span class='addBlcTag'>" + $(vidTags[i]).text() + "</span>(" + (i+1) + ")";
            } else {
              allTags = "<span class='addBlcTag'>" + $(vidTags[i]).text() + "</span>(" + (i+1) + ")";
            }
          }
          // タグを<DIV>タグで囲って挿入
          $(thisParent).after($("<div>").addClass("videoTags").html(allTags));
          // タグ群のスタイル
          $(".videoTags").css("background-color", "#FFD700");
        }
      });
    }
    // タグ一覧を開いている時
    else if ($(this).text() === "▲") {
      $(this).text("▼");
      $(this).parent().next().remove(); // タグ群を消去
    }
  });
  // ----------------------------------------------------------------------------------------------------------------
});