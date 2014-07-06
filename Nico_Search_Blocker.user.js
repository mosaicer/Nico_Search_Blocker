// ==UserScript==
// @name        Nico Search Blocker
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description 各動画のタグ一覧の表示をするボタンを追加し、タグ・タイトルで検索のブロックを可能にする
// @include     http://www.nicovideo.jp/tag/*
// @include     http://www.nicovideo.jp/search/*
// @version     2.0
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @require     http://code.jquery.com/jquery-2.1.1.min.js
// ==/UserScript==

$(function () {
      // 設定されているタグ
  var blcTagsList,
      // タグ一覧を表示するボタン
      clickTriangle = $("<li>").addClass("tagsCheck").text("▼"),
      // ブロックしたタグ一覧を表示するボタン
      tagsMenu = $("<li>").html("<a href='javascript:void(0);'><span id='tagsMenu'>|タグ▼");

  // インストール後、最初のアクセスの時、ブロックの機能を有効にする
  if (typeof GM_getValue("blcTags_flag") === "undefined") {
    GM_setValue("blcTags_flag", 1);
  }

  // ブロックするものが設定されているならばそれを取得する
  if (typeof GM_getValue("blc_tags") !== "undefined") {
    // 2つ以上タグがある場合
    if (GM_getValue("blc_tags").indexOf(",/,/") !== -1) {
      blcTagsList = GM_getValue("blc_tags").split(",/,/");
    }
    // 1つしかタグがない場合
    else {
      blcTagsList = GM_getValue("blc_tags");
    }
  }

  setCommandMenu(); // ユーザスクリプトコマンドメニューに項目を追加する

  // ユーザー広告部分を削除
  $("div[class='contentBody uad searchUad video']").remove();
  // タグ一覧を表示するボタンを挿入
  $(".itemData > .list > li:nth-child(4n)").after(clickTriangle);
  // ブロックしたタグ一覧を表示するボタンを挿入
  $(tagsMenu).appendTo(".siteHeaderGlovalNavigation");


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

          // 表示されたタグをクリックした時
          $(".addBlcTag").css("cursor", "pointer").click(function () {
            var blcTagsTemp;

            // 初めてor空に、追加する時
            if (typeof GM_getValue("blc_tags") === "undefined" || blcTagsList === "") {
              GM_setValue("blc_tags", $(this).text());
              location.reload(); // ページを更新して設定を反映させる
            }
            // すでに入ってる時
            else {
              // タグが重複してない時
              if (blcTagsList.indexOf( $(this).text() ) === -1) {
                // 配列でタグを取得した時
                if (typeof blcTagsList === "object") {
                  blcTagsTemp = blcTagsList.join(",/,/") + ",/,/" + $(this).text();
                }
                // 文字列でタグを取得した時
                else {
                  blcTagsTemp = blcTagsList + ",/,/" + $(this).text();
                }
                // ブロックするタグを再設定
                GM_setValue("blc_tags", blcTagsTemp);
                // ページを更新して設定を反映させる
                location.reload();
              }
              // タグが重複している時
              else {
                alert($(this).text() + "はすでに設定されています");
              }
            }
          });
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

  // ヘッダーにブロックしたタグ一覧を表示させるメニュー関連----------------------------------------------------------
  // メニューをクリックした時
  $("#tagsMenu").click(function () {
    var blcTagsTemp = ""; // ブロックしたタグを入れる変数

    // ブロックしたタグ一覧を閉じている時
    if ( $(this).text().match(/▼/) ) {
      $(this).text("|タグ▲");

      // タグが登録されている時
      if (typeof GM_getValue("blc_tags") !== "undefined" && blcTagsList !== "") {
        // 配列でタグを取得した時
        if (typeof blcTagsList === "object") {
          blcTagsTemp = "<li><a class='blockTag' href='javascript:void(0);'>" + blcTagsList.join("</a></li><li><a class='blockTag' href='javascript:void(0);'>") + "</a></li>";
        }
        // 文字列でタグを取得した時
        else {
          blcTagsTemp = "<li><a class='blockTag' href='javascript:void(0);'>" + blcTagsList + "</a></li>";
        }
      }
      // 取得したタグを挿入
      $("<ul style='color: black;'>" + blcTagsTemp + "</ul>").appendTo( $(this).parent() );

      // ブロックしたタグをクリックした時(ブロックするタグが設定されていなければ実行されない)
      $(".blockTag").click(function () {
        var clickTag; // クリックしたタグを代入

        // 中身を空にする
        blcTagsTemp = "";
        // 配列でタグを取得した時(タグが1つの時は必ずそれが削除されるためその動作は不要)
        if (typeof blcTagsList === "object") {
          clickTag = $(this).text();
          blcTagsTemp = blcTagsList.filter(function (thisTag) {
            return (thisTag !== clickTag);
          });
          blcTagsTemp = blcTagsTemp.join(",/,/"); // ,/,/区切りの文字列として取得
        }
        /// ブロックするタグを再設定
        GM_setValue("blc_tags", blcTagsTemp);
        // ページを更新して設定を反映させる
        location.reload();
      });
    }
    // ブロックしたタグ一覧を開いている時
    else {
      $(this).text("|タグ▼");
      $("#tagsMenu").next().remove();
    }
  });
  // ----------------------------------------------------------------------------------------------------------------

  // ユーザスクリプトコマンドメニューに項目を追加する
  function setCommandMenu() {
    var // 有効or無効かの判別
        msg_flag,
        // メッセージを代入
        msg;

    msg_flag = GM_getValue("blcTags_flag") === 1 ? "無効" : "有効"; // 有効/無効の時、無効/有効にする
    msg = "タグでの動画の検索避けを" + msg_flag + "にする";
    // 各ユーザースクリプトコマンドサブメニューにメッセージを付加する
    GM_registerMenuCommand(msg, blcTagsChange);

    // タグについてのブロックの有効/無効を切り替える
    function blcTagsChange() {
      var tags_flag = GM_getValue("blcTags_flag") === 1 ? 0 : 1; // 有効/無効の時、無効/有効にする

      GM_setValue("blcTags_flag", tags_flag);
      location.reload(); // ページを更新して設定を反映させる
    }
  }
});