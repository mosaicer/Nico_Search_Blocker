// ==UserScript==
// @name        Nico Search Blocker
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description 各動画のタグ一覧を表示するボタンを追加し、タグ・キーワード検索のブロックを可能にする
// @include     http://www.nicovideo.jp/tag/*
// @include     http://www.nicovideo.jp/search/*
// @version     4.0
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @require     http://code.jquery.com/jquery-2.1.1.min.js
// ==/UserScript==

$(function () {
      // DBから取得する系処理
  var DBInit = function() {
        this.flagArray = {
          "blcTags_flag": ["タグでの動画のブロックを", {}],
          "blcKeywords_flag": ["キーワードでの動画のブロックを", {}],
          "unwantedVid_flag": ["検索対象外の動画のブロックを", {}],
          "removedVid_flag": ["削除済みの動画のブロックを", {}],
          "cacheLoad_flag": ["キャッシュを使った読み込みを", {}]
        };
        this.blcNameArray = {
          "blc_tags": [[], ["|タグ▼", "|タグ▲"]],
          "blc_keywords": [[], ["キーワード▼", "キーワード▲"]]
        };
        this.msgFlag = false;
        this.msg = "";
      },
      firstSetting,
      // 各ボタンを挿入
      ButtonSet = function() {
        this.btnArray = {
          ".itemData > ul.list": $("<li>").addClass("tagsCheck").text("▼"),
          "li[data-enable-uad='1'] > .itemContent > p.itemTitle": $("<span>").addClass("titlesCheck").text("★"),
          ".siteHeaderGlovalNavigation": "<li><a href='javascript:void(0);'><span id='tagsMenu'>|タグ▼</span></a></li><li><a href='javascript:void(0);'><span id='keywordsMenu'>キーワード▼</span></a></li>"
        };
      },
      btnSetting,
      // ロード終了時に行う系処理
      LoadCheck = function() {
        this.tagsList = {};
        this.titlesList = {};
        this.blcLtrTemp = "";
      },
      loadFeatures,
      // for-inで使う変数
      key = "";

  DBInit.prototype = {
    // アクセス時の処理
    accessFeature: function() {
      for (key in this.flagArray) {
        // (for-inループの対象となる)オブジェクト自身が持つプロパティなのか、プロトタイプ連鎖から来たプロパティなのかを判別する
        if (this.flagArray.hasOwnProperty(key)) {
          // 初アクセス時のみに実行、フラグの設定
          if (typeof GM_getValue(key) === "undefined") {
            GM_setValue(key, true);
          }
          // ユーザースクリプトコマンドメニューを構成
          this.msgFlag = GM_getValue(key) === true ? "無効" : "有効";
          this.msg = this.flagArray[key][0] + this.msgFlag + "にする";
          GM_registerMenuCommand(this.msg, this.blcFeaturesChg.bind(this.flagArray[key][1][key + "Change"], key));
        }
      }
    },
    // ユーザースクリプトコマンドメニューで実行する関数、有効/無効の切り替え
    blcFeaturesChg: function(flagName) {
      this.msgFlag = GM_getValue(flagName) === true ? false : true;
      GM_setValue(flagName, this.msgFlag);
      location.reload();
    },
    // ブロックリストを取得
    getBlockList: function() {
      for (key in this.blcNameArray) {
        if (this.blcNameArray.hasOwnProperty(key) && typeof GM_getValue(key) !== "undefined") {
          if (GM_getValue(key).indexOf(",/,/") >= 0) {
            this.blcNameArray[key][0] = GM_getValue(key).split(",/,/");
          } else {
            this.blcNameArray[key][0].push(GM_getValue(key));
          }
        }
      }
    }
  };

  ButtonSet.prototype.insertButton = function () {
    // ボタンを挿入
    for (key in this.btnArray) {
      if (this.btnArray.hasOwnProperty(key)) {
        $(this.btnArray[key]).appendTo(key);
      }
    }
  };

  LoadCheck.prototype = {
    // 完全一致で比較(タグ・文字列追加時・検索対象)
    completeComp: function(targetLtr) {
      if (typeof targetLtr !== "undefined" && targetLtr === this.clickObj && this.blcFlag === 0) {
        this.blcFlag = 1;
      } else if (this.chkFlag === 0 && this.clickObj === firstSetting.searchTag) {
        this.chkFlag = 1;
      }
    },
    // 単純一致で比較(キーワード・検索対象)
    partComp: function(targetLtr) {
      if (typeof targetLtr !== "undefined" && this.clickObj.indexOf(targetLtr) >= 0 && this.blcFlag === 0) {
        this.blcFlag = 1;
      } else if (this.chkFlag === 0 && this.clickObj.indexOf(firstSetting.searchKeyword) >= 0) {
        this.chkFlag = 1;
      }
    },
    // タイトルと記述での処理
    ttlAndDscrpt: function() {
      // 検索対象が含まれているか(タグ検索ではチェックしない)
      if (typeof firstSetting.searchKeyword !== "undefined") {
        this.partComp();
      }
      // ブロックリストと比較(どちらの検索でもチェック)
      if (typeof GM_getValue("blc_keywords") !== "undefined" && firstSetting.blcNameArray["blc_keywords"][0][0] !== "" && GM_getValue("blcKeywords_flag") === true) {
        firstSetting.blcNameArray["blc_keywords"][0].forEach(this.partComp, loadFeatures);
      }
    },
    // 動画のタグリストとタイトルリストを取得 or 動画を消去
    pushOrRmv: function(stackName, liTag) {
      if (this.blcFlag === 0) {
        switch (stackName) {
          case "tags":
            this.tagsList[$(liTag).attr("data-id")] = this.allTags;
            break;
          case "titles":
            this.titlesList[$(liTag).attr("data-id")] = this.clickObj;
            break;
          default:
            break;
        }
      } else {
        $(liTag).remove();
      }
    },
    // ブロックする文字列を追加
    addBlcLtr: function(stackName) {
      if (typeof GM_getValue(stackName) === "undefined" || firstSetting.blcNameArray[stackName][0][0] === "") {
        GM_setValue(stackName, this.clickObj);
        location.reload();
      } else {
        firstSetting.blcNameArray[stackName][0].forEach(this.completeComp, loadFeatures);
        if (this.blcFlag === 0) {
          GM_setValue(stackName, firstSetting.blcNameArray[stackName][0].join(",/,/") + ",/,/" + this.clickObj);
          location.reload();
        } else {
          alert("\"" + this.clickObj + "\"" + "　はすでに設定されています");
        }
      }
    },
    // ブロックする文字列を削除
    delBlcLtr: function(targetLtr, stackName) {
      this.blcLtrTemp = firstSetting.blcNameArray[stackName][0].filter(function (theLetter) { return (theLetter !== targetLtr); });
      this.blcLtrTemp = this.blcLtrTemp.join(",/,/");
      GM_setValue(stackName, this.blcLtrTemp);
      location.reload();
    },
    // ブロックリストメニューの処理
    blcMenu: function(theTag, stackName, clsName, idName) {
      this.blcLtrTemp = "";
      // 一覧を閉じている時
      if ($(theTag).text().match(/▼/)) {
        $(theTag).text(firstSetting.blcNameArray[stackName][1][1]);
        if (typeof GM_getValue(stackName) !== "undefined" && firstSetting.blcNameArray[stackName][0][0] !== "") {
          this.blcLtrTemp = "<li><a class='" + clsName + "' href='javascript:void(0);'>" + firstSetting.blcNameArray[stackName][0].join("</a></li><li><a class='" + clsName + "' href='javascript:void(0);'>") + "</a></li>";
        }
        $("<ul style='color: black;'>" + this.blcLtrTemp + "</ul>").appendTo($(theTag).parent());
      }
      // 一覧を開いている時
      else {
        $(theTag).text(firstSetting.blcNameArray[stackName][1][0]);
        $(idName).next().remove();
      }
    }
  };

  // インスタンス化
  firstSetting = new DBInit();
  btnSetting = new ButtonSet();
  loadFeatures = new LoadCheck();

  // 初期処理
  firstSetting.accessFeature();
  firstSetting.getBlockList();

  // ボタン挿入
  btnSetting.insertButton();

  // 検索対象を格納
  if(location.href.match(/www\.nicovideo\.jp\/search\//)) {
    firstSetting.searchKeyword = $("div.message > p > span:eq(0)").text();
  } else {
    firstSetting.searchTag = $.trim($("header.contentHeader > h1 > span").text()); // 末尾に空白があるためtrimする
  }
  // ignoreCacheの設定
  firstSetting.ignoreFlag = GM_getValue("cacheLoad_flag") === true ? false : true;

  // 各タグとタイトル格納+ブロック処理
  $("li[data-enable-uad='1']").each(function () {
    var thisLi = $(this); // ローカル変数にしないと最初のタグしか取れず値が変わらない

    // HTTPリクエスト
    GM_xmlhttpRequest({
      method: "GET",
      url: "http://ext.nicovideo.jp/api/getthumbinfo/" + $(thisLi).attr("data-id"),
      ignoreCache: firstSetting.ignoreFlag, // falseでキャッシュを使った読み込み

      onload: function (responseDetails) {
            // xmlをパース
        var parser = new DOMParser(),
            doc = parser.parseFromString(responseDetails.responseText, "application/xml");

        // 値をリセット
        loadFeatures.allTags = [];
        loadFeatures.blcFlag = 0;
        loadFeatures.chkFlag = 0;
        // 動画が削除されていない時
        if ($(doc).find("nicovideo_thumb_response").attr("status") === "ok") {
          // 各<tag>タグに対して処理を行う
          $(doc).find("tag").each(function () {
            loadFeatures.clickObj = $(this).text();
            // 検索対象が含まれているか
            if (typeof firstSetting.searchKeyword !== "undefined") {
              loadFeatures.partComp();
            } else {
              loadFeatures.completeComp();
            }
            // ブロックリストと比較＋タグを配列に格納
            if (typeof GM_getValue("blc_tags") !== "undefined" && firstSetting.blcNameArray["blc_tags"][0][0] !== "" && GM_getValue("blcTags_flag") === true) {
              if (loadFeatures.blcFlag === 0) {
                firstSetting.blcNameArray["blc_tags"][0].forEach(loadFeatures.completeComp, loadFeatures);
              }
              if (loadFeatures.blcFlag === 0) {
                loadFeatures.allTags.push("<span class='addBlcTag'>" + loadFeatures.clickObj + "</span>");
              }
            } else {
              loadFeatures.allTags.push("<span class='addBlcTag'>" + loadFeatures.clickObj + "</span>");
            }
          });
          loadFeatures.pushOrRmv("tags", thisLi);
          if (loadFeatures.blcFlag === 0) {
            // <title>タグに対して処理を行う
            $(doc).find("title").each(function () {
              loadFeatures.clickObj = $(this).text();
              loadFeatures.ttlAndDscrpt();
            });
            loadFeatures.pushOrRmv("titles", thisLi);
          }
          if (loadFeatures.blcFlag === 0) {
            // <description>タグに対して処理を行う
            $(doc).find("description").each(function () {
              loadFeatures.clickObj = $(this).text();
              loadFeatures.ttlAndDscrpt();
            });
            loadFeatures.pushOrRmv("descriptions", thisLi);
          }
          // 検索対象外の動画の処理
          if (loadFeatures.blcFlag === 0 && loadFeatures.chkFlag === 0) {
            if (GM_getValue("unwantedVid_flag") === false) {
              $("<br><span style='color:red;'>検索対象を含まない動画です</span>").appendTo($(thisLi).children("p.itemTime"));
            } else {
              $(thisLi).remove();
            }
          }
        }
        // 削除済み動画の処理
        else {
          if (GM_getValue("removedVid_flag") === false) {
            loadFeatures.aTag = $(thisLi).children("div.itemContent").children("p.itemTitle").children("a");
            loadFeatures.tagsList[$(thisLi).attr("data-id")] = [0];
            loadFeatures.titlesList[$(thisLi).attr("data-id")] = $(loadFeatures.aTag).text();
            $(loadFeatures.aTag).css("text-decoration", "line-through").css("color", "#BEBEBE");
          } else {
            $(thisLi).remove();
          }
        }
      },
      // エラー(サーバが見つからない時)
      onerror: function (res) {
        alert("エラーが発生しました。" + "\nレスポンスの本体: " + res.responseText + "\nリクエストの状態: " + res.readyState + "\nレスポンスに含まれるHTTPヘッダー: " + res.responseHeaders + "\nレスポンスのHTTPエラーコード: " + res.status + "\nHTTPステータステキスト: " + res.statusText + "\nリダイレクト先のURL: " + res.finalUrl);
      }
    });
  });

  // タグ一覧表示ボタン
  $(".tagsCheck").css("color", "#B22222").css("cursor", "pointer").click(function () {
    var thisParent, // クリックした要素の親要素
        allTagsList; // 各動画の全てのタグの文字列

    // タグ一覧を開いてない時
    if ($(this).text() === "▼") {
      $(this).text("▲");
      thisParent = $(this).parent(); // タグ挿入時に指定するセレクタ
      allTagsList = loadFeatures.tagsList[$(this).prev().find("a").attr("href").substring(33)].join(",　");
      if (allTagsList !== "0") { // 動画が削除済みかどうか
        $(thisParent).after($("<div>").css("background-color", "#FFD700").html(allTagsList));
      } else {
        $(thisParent).after($("<div>").css("background-color", "#FFD700").html("<span style='color:red; font-weight:bold'>この動画は削除されています"));
      }
      // 表示されたタグをクリックした時
      $(".addBlcTag").css("cursor", "pointer").click(function () {
        loadFeatures.blcFlag = 0;
        loadFeatures.clickObj = $(this).text();
        loadFeatures.addBlcLtr("blc_tags");
      });
    }
    // タグ一覧を開いている時
    else {
      $(this).text("▼");
      $(this).parent().next().remove();
    }
  });
  // タイトル表示ボタン
  $(".titlesCheck").css("color", "#B22222").css("cursor", "pointer").click(function () {
    var blockWord = prompt("ブロックしたいキーワードを入力してください", loadFeatures.titlesList[$(this).prev().attr("href").slice(7, -21)]);

    // 文字列をブロックリストに追加
    if (blockWord !== null) {
      loadFeatures.blcFlag = 0;
      loadFeatures.clickObj = blockWord;
      loadFeatures.addBlcLtr("blc_keywords");
    }
  });

  // ヘッダーにブロックしたタグ一覧を表示させるメニュー
  $("#tagsMenu").bind("click", function () {
    loadFeatures.blcMenu($(this), "blc_tags", "blockTag", "#tagsMenu");
    // 文字列をブロックリストから削除
    $(".blockTag").click(function () {
      loadFeatures.delBlcLtr($(this).text(), "blc_tags");
    });
  });
  // ヘッダーにブロックした文字列一覧を表示させるメニュー
  $("#keywordsMenu").bind("click", function () {
    loadFeatures.blcMenu($(this), "blc_keywords", "blockKeyword", "#keywordsMenu");
    // 文字列をブロックリストから削除
    $(".blockKeyword").click(function () {
      loadFeatures.delBlcLtr($(this).text(), "blc_keywords");
    });
  });
});