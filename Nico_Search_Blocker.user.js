// ==UserScript==
// @name        Nico Search Blocker
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description 各動画のタグ一覧を表示するボタンを追加し、タグとタイトルでの検索のブロックを可能にする
// @include     http://www.nicovideo.jp/tag/*
// @include     http://www.nicovideo.jp/search/*
// @version     3.0
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @require     http://code.jquery.com/jquery-2.1.1.min.js
// ==/UserScript==

$(function () {
      // DBから取得する系処理
  var DBInit = function() {
        this.tagChangeObj = {};
        this.titleChangeObj = {};
        this.flagArray = {
          "blcTags_flag": [
            "タグでの動画の検索避けを",
            this.tagChangeObj
          ],
          "blcTitles_flag": [
            "タイトルでの動画の検索避けを",
            this.titleChangeObj
          ]
        };
        this.blcTagsList = [];
        this.blcTitlesList = [];
        this.blcNameArray = {
            "blc_tags": [
            this.blcTagsList,
            ["|タグ▼", "|タグ▲"]
          ],
          "blc_titles": [
            this.blcTitlesList,
            ["タイトル▼", "タイトル▲"]
          ]
        };
        this.msgFlag = 0;
        this.msg = "";
      },
      firstSetting,
      // 各ボタンを挿入
      ButtonSet = function() {
        this.btnArray = {
          ".itemData > ul.list": $("<li>").addClass("tagsCheck").text("▼"),
          "li[data-enable-uad='1'] > .itemContent > p.itemTitle": $("<span>").addClass("titlesCheck").text("★"),
          ".siteHeaderGlovalNavigation": "<li><a href='javascript:void(0);'><span id='tagsMenu'>|タグ▼</span></a></li><li><a href='javascript:void(0);'><span id='titlesMenu'>タイトル▼</span></a></li>"
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
    // ユーザースクリプトコマンドメニューで実行する関数、有効/無効の切り替え
    blcFeaturesChg: function(flagName) {
      this.msgFlag = GM_getValue(flagName) === 1 ? 0 : 1;
      GM_setValue(flagName, this.msgFlag);
      location.reload();
    },
    // アクセス時の処理
    accessFeature: function() {
      for (key in this.flagArray) {
        // (for-inループの対象となる)オブジェクト自身が持つプロパティなのか、プロトタイプ連鎖から来たプロパティなのかを判別する
        if (this.flagArray.hasOwnProperty(key)) {
          // 初アクセス時のみに実行、フラグの設定
          if (typeof GM_getValue(key) === "undefined") {
            GM_setValue(key, 1);
          }
          // ユーザースクリプトコマンドメニューを構成
          this.msgFlag = GM_getValue(key) === 1 ? "無効" : "有効";
          this.msg = this.flagArray[key][0] + this.msgFlag + "にする";
          GM_registerMenuCommand(this.msg, this.blcFeaturesChg.bind(this.flagArray[key][1][key + "Change"], key));
        }
      }
    },
    // ブロックリストを取得
    getBlockList: function() {
      for (key in this.blcNameArray) {
        if (this.blcNameArray.hasOwnProperty(key)) {
          if (typeof GM_getValue(key) !== "undefined") {
            if (GM_getValue(key).indexOf(",/,/") !== -1) {
              this.blcNameArray[key][0] = GM_getValue(key).split(",/,/");
            } else {
              this.blcNameArray[key][0].push(GM_getValue(key));
            }
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
    // ブロックリストに一致しない動画のタグとタイトルを取得
    getTargetLtr: function(stackName, theFlag) {
      if (typeof GM_getValue(stackName) !== "undefined" && firstSetting.blcNameArray[stackName][0][0] !== "" && GM_getValue(theFlag) === 1) {
        if (this.blcFlag === 0) {
          if (stackName === "blc_tags") {
            firstSetting.blcNameArray[stackName][0].forEach(this.completeComp, loadFeatures);
          } else {
            firstSetting.blcNameArray[stackName][0].forEach(this.partComp, loadFeatures);
          }
          if (this.blcFlag === 0 && stackName === "blc_tags") {
            this.allTags.push("<span class='addBlcTag'>" + this.clickObj + "</span>");
          }
        }
      } else if (stackName === "blc_tags") {
        this.allTags.push("<span class='addBlcTag'>" + this.clickObj + "</span>");
      }
    },
    // 完全一致で比較(タグと文字列追加時)
    completeComp: function(targetLtr) {
      if (targetLtr === this.clickObj && this.blcFlag === 0) {
        this.blcFlag = 1;
      }
    },
    // 単純一致で比較(タイトル)
    partComp: function(targetLtr) {
      if (this.clickObj.indexOf(targetLtr) >= 0 && this.blcFlag === 0) {
        this.blcFlag = 1;
      }
    },
    // 動画のタグリストとタイトルリストを取得 or 動画を消去
    pushOrRmv: function(stackName, liTag) {
      if (this.blcFlag === 0) {
        if (stackName === "blc_tags") {
          this.tagsList[$(liTag).attr("data-id")] = this.allTags;
        } else {
          this.titlesList[$(liTag).attr("data-id")] = this.clickObj;
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
    blcMenu: function(theTag, stackName, className, idName) {
      this.blcLtrTemp = "";
      // 一覧を閉じている時
      if ($(theTag).text().match(/▼/)) {
        $(theTag).text(firstSetting.blcNameArray[stackName][1][1]);
        if (typeof GM_getValue(stackName) !== "undefined" && firstSetting.blcNameArray[stackName][0][0] !== "") {
          this.blcLtrTemp = "<li><a class='" + className + "' href='javascript:void(0);'>" + firstSetting.blcNameArray[stackName][0].join("</a></li><li><a class='" + className + "' href='javascript:void(0);'>") + "</a></li>";
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

  // 各タグとタイトル格納+ブロック処理
  $("li[data-enable-uad='1']").each(function () {
    var thisLi = $(this); // ローカル変数にしないと最初のタグしか取れず値が変わらない

    // HTTPリクエスト
    GM_xmlhttpRequest({
      method: "GET",
      url: "http://ext.nicovideo.jp/api/getthumbinfo/" + $(thisLi).attr("data-id"),
      onload: function (responseDetails) {
        var parser, doc;
        // XMLをパース
        parser = new DOMParser();
        doc = parser.parseFromString(responseDetails.responseText, "application/xml");
        // 値をリセット
        loadFeatures.allTags = [];
        loadFeatures.blcFlag = 0;
        // 各<tag>タグに対して処理を行う
        $(doc).find("tag").each(function () {
          loadFeatures.clickObj = $(this).text();
          loadFeatures.getTargetLtr("blc_tags", "blcTags_flag");
        });
        loadFeatures.pushOrRmv("blc_tags", thisLi);
        if (loadFeatures.blcFlag === 0) {
          // <title>タグに対して処理を行う
          $(doc).find("title").each(function () {
            loadFeatures.clickObj = $(this).text();
            loadFeatures.getTargetLtr("blc_titles", "blcTitles_flag");
          });
          loadFeatures.pushOrRmv("blc_titles", thisLi);
        }
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
      $(thisParent).after($("<div>").css("background-color", "#FFD700").html(allTagsList));
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
    var blockWord;
    blockWord = prompt("タイトルについてブロックしたい文字列を入力してください", loadFeatures.titlesList[$(this).prev().attr("href").slice(7, -21)]);
    // 文字列をブロックリストに追加
    if (blockWord !== null) {
      loadFeatures.blcFlag = 0;
      loadFeatures.clickObj = blockWord;
      loadFeatures.addBlcLtr("blc_titles");
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
  $("#titlesMenu").bind("click", function () {
    loadFeatures.blcMenu($(this), "blc_titles", "blockTitle", "#titlesMenu");
    // 文字列をブロックリストから削除
    $(".blockTitle").click(function () {
      loadFeatures.delBlcLtr($(this).text(), "blc_titles");
    });
  });
});