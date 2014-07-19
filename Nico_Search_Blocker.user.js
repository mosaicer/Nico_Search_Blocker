// ==UserScript==
// @name        Nico Search Blocker
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description 各動画のタグ一覧を表示するボタンを追加し、タグでの検索のブロックを可能にする
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
      tagsMenu = $("<li>").html("<a href='javascript:void(0);'><span id='tagsMenu'>|タグ▼"),
      // ブロックしたタグを入れる変数
      blcTagsTemp = "",
      // クリックしたタグを代入
      clickTag,
      // 全ての動画の全てのタグを格納(連想配列)
      tagsList = {}; // {} === new Object()

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

  // タグ格納+ブロック処理
  $("li.item").each(function () { // 各動画の頭のタグ
        // 各動画の全てのタグを格納
    var allTags = [],
        // 対象のタグがブロックタグに入ってるかどうかのフラグ
        flag = 0,
        // 後から参照できるように変数にしまっておく
        thisLi = $(this);

    // 動画IDがちゃんと取れた時
    if (typeof $(this).attr("data-id") !== "undefined") {
      // HTTPリクエスト
      GM_xmlhttpRequest({
        method: "GET",
        url: "http://ext.nicovideo.jp/api/getthumbinfo/" + $(this).attr("data-id"),
        onload: function (responseDetails) {
          var parser, doc; // DOMにパースする関連

          // XMLをパース
          parser = new DOMParser();
          doc = parser.parseFromString(responseDetails.responseText, "application/xml");
          // 各<tag>タグに対して処理を行う
          $(doc).find("tag").each(function () {
            clickTag = $(this).text();
            // ブロックリストが設定されている時
            if (typeof GM_getValue("blc_tags") !== "undefined" && blcTagsList !== "" && GM_getValue("blcTags_flag") === 1) {
              // ブロックされたタグが見つからなかった場合
              if (flag === 0) {
                // 配列でタグを取得した時
                if (typeof blcTagsList === "object") {
                  blcTagsList.forEach(function (targetTag) {
                    if (targetTag === clickTag && flag === 0) {
                      flag = 1;
                    }
                  });
                }
                // 文字列でタグを取得した時
                else {
                  if (clickTag === blcTagsList) {
                    flag = 1;
                  }
                }
                // ブロックされたタグが見つからなかった場合は配列に格納
                if (flag === 0) {
                  allTags.push("<span class='addBlcTag'>" + clickTag + "</span>");
                }
              }
            } else {
              allTags.push("<span class='addBlcTag'>" + clickTag + "</span>");
            }
          });
          // ブロックされたタグが見つからなかった場合は連想配列に格納 , sm... => タグ一覧の配列
          if (flag === 0) {
            tagsList[$(thisLi).attr("data-id")] = allTags;
          }
          // ブロックされたタグが見つかった場合は動画自体を消去
          else {
            $(thisLi).remove();
          }
        }
      });
    }
  });

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
        vidsmNum,
        // 各動画の全てのタグの文字列
        allTagsList;

    // タグ一覧を開いてない時
    if ($(this).text() === "▼") {
      $(this).text("▲");

      thisParent = $(this).parent(); // タグ挿入時に指定するセレクタ
      vidsmNum = $(this).prev().find("a").attr("href").substring(33); // 動画のIDを取得する
      allTagsList = tagsList[vidsmNum].join(",　"); // 動画IDに紐付けられた配列を文字列に変換

      // タグを<DIV>タグで囲って挿入
      $(thisParent).after($("<div>").addClass("videoTags").html(allTagsList));
      // タグ群のスタイル
      $(".videoTags").css("background-color", "#FFD700");

      // 表示されたタグをクリックした時
      $(".addBlcTag").css("cursor", "pointer").click(function () {
        var addFlag = 0; // 重複チェックのフラグ

        clickTag = $(this).text();
        // 初めてor空に、追加する時
        if (typeof GM_getValue("blc_tags") === "undefined" || blcTagsList === "") {
          GM_setValue("blc_tags", clickTag);
          location.reload(); // ページを更新して設定を反映させる
        }
        // すでに入ってる時
        else {
          // 配列でタグを取得した時
          if (typeof blcTagsList === "object") {
            // クリックしたタグがブロックリストに入っているかチェック
            blcTagsList.forEach(function (targetTag) {
              if (targetTag === clickTag && addFlag === 0) {
                addFlag = 1;
              }
            });
            // タグが重複していない時
            if (addFlag === 0) {
              blcTagsTemp = blcTagsList.join(",/,/") + ",/,/" + clickTag;
            }
          }
          // 文字列でタグを取得した時
          else {
            if (blcTagsList !== clickTag) {
              blcTagsTemp = blcTagsList + ",/,/" + clickTag;
            }
          }
          if (addFlag === 1) {
            alert("\"" + clickTag + "\"" + "　はすでに設定されています");
          } else {
            // ブロックするタグを再設定
            GM_setValue("blc_tags", blcTagsTemp);
            // ページを更新して設定を反映させる
            location.reload();
          }
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
  $("#tagsMenu").bind("click", function () {
    blcTagsTemp = "";
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