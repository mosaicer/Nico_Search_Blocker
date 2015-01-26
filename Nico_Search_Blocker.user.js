// ==UserScript==
// @name        Nico Search Blocker
// @namespace   https://github.com/mosaicer
// @author      mosaicer
// @description 各動画のタグ一覧を表示するボタンを追加し、タグ・キーワード検索のブロックを可能にする
// @include     http://www.nicovideo.jp/tag/*
// @include     http://www.nicovideo.jp/search/*
// @version     5.0
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// ==/UserScript==
(function () {
  'use strict';

      // 区切り文字
  var SPLIT_WORD = ',/,/',
      // 各クラス名
      TAG_CLASS = 'tagsCheck',
      TITLE_CLASS = 'titlesCheck',
      ADD_BLOCK_TAG_CLASS = 'addBlcTag',
      DEL_BLOCK_WORD_CLASS = 'deleteBlcWord',
      CHG_SETTING_FLAG_CLASS = 'changeSettingFlag',
      ADD_BL_LTR_BTN_CLASS = 'addBlcLtrBtn',
      OPEN_CLOSE_BL_BTN_CLASS = 'openCloseBlButton',
      OPEN_CLOSE_SET_BTN_CLASS = 'openCloseSetButton',
      OPEN_SETTING_DETAIL_CLASS = 'openSettingDetail',
      SETTING_STYLE_CLASS = 'settingItemStyle',
      VISIBILITY_CLASS = 'videoVisibility',
      VIDEO_NODE_CLASS = 'customVideoStyle',
      CLEAR_LEFT_CLASS = 'videoClearLeft',
      /*
        デフォルトのフラグ、その後はフラグを格納しておく
        3番目はそのフラグが有効であることを示す値
      */
      flagList = {
        blcTags_flag: [true, 'タグでの動画のブロック', true],
        blcKeywords_flag: [true, 'キーワードでの動画のブロック', true],
        unwantedVid_flag: [false, '検索対象外の動画のブロック', true],
        removedVid_flag: [false, '削除済みの動画のブロック', true],
        strictComp_flag: [0, '文字列比較の厳格化', 0],
        cacheLoad_flag: [false, 'キャッシュを使った読み込み', false]
      },
      // ブロックリスト
      blcNameArray = {
        // タグ
        blc_tags: [
          // ブロックする文字列の配列
          [],
          // 追加のフィルタリングの関数
          function (targetLtr) {
            var key = '',
                // 各動画の親ノード
                videoParentTag;

            // 各動画でループを回して全タグをチェックする
            for (key in videoTagsList) {
              // キーが自身のオブジェクトのプロパティだった場合
              if (videoTagsList.hasOwnProperty(key)) {
                // 動画IDから動画のノードを取得
                videoParentTag = document.querySelector('li[data-id="' + key + '"]');

                /*
                  その動画がどっちものブロックリストに入っていない
                  その動画がタグのブロックリストに入っていない
                  その動画のタグがブロックに引っかかった場合
                */
                if (
                  allBlockVideoList.indexOf(videoParentTag) < 0 &&
                  tagBlockVideoList.indexOf(videoParentTag) < 0 &&
                  videoTagsList[key].indexOf(targetLtr) >= 0
                ) {
                  // キーワードでブロックされた動画ではない場合
                  if (keywordBlockVideoList.indexOf(videoParentTag) < 0) {
                    // タグでブロックされた動画の配列に格納
                    tagBlockVideoList.push(videoParentTag);
                    // フラグが立っていたらクラスをつける
                    if (flagList.blcTags_flag[0]) {
                      videoParentTag.classList.add(VISIBILITY_CLASS);
                    }
                  }
                  // すでにキーワードでブロックされていた場合
                  else {
                    // その動画のノードをキーワードでブロックした動画の配列から消す
                    keywordBlockVideoList = keywordBlockVideoList.filter(
                      function (targetNode) {
                        return (videoParentTag !== targetNode);
                      }
                    );
                    // キーワードのフラグが立っていない(クラスがついていない)がタグのフラグが立っている場合
                    if (!flagList.blcKeywords_flag[0] && flagList.blcTags_flag[0]) {
                      videoParentTag.classList.add(VISIBILITY_CLASS);
                    }
                    // どちらにも引っかかる動画の配列に格納
                    allBlockVideoList.push(videoParentTag);
                  }
                }
              }
            }
          },
          /*
            ブロックの一覧のBOXのパーツの配列
            親ノードのID、中身のヘッダーのタイトルの中身、追加のname・placeholder
          */
          ['blTagsBox', '◎ブロックするタグ一覧', 'blTagForm', '追加するタグを入力してください', 'addBlTag'],
          // 削除のフィルタリングの関数
          function () {
            var key = '',
                blcFlag,
                // 各動画の親ノード
                videoParentTag;

            // 各動画でループを回して全タグをチェックする
            for (key in videoTagsList) {
              // キーが自身のオブジェクトのプロパティだった場合
              if (videoTagsList.hasOwnProperty(key)) {
                blcFlag = false;
                // 動画IDから動画のノードを取得
                videoParentTag = document.querySelector('li[data-id="' + key + '"]');

                // キーワードでブロックされた動画はスルーする
                if (keywordBlockVideoList.indexOf(videoParentTag) < 0) {
                  // タグのBLでのチェック
                  blcNameArray.blc_tags[0].forEach(function (targetLtr) {
                    if (!blcFlag && videoTagsList[key].indexOf(targetLtr) >= 0) {
                      blcFlag = true;
                    }
                  });

                  // タグのブロックに引っ掛からなかった場合
                  if (!blcFlag) {
                    // タグでブロックされた動画の場合
                    if (tagBlockVideoList.indexOf(videoParentTag) >= 0) {
                      // 対象の動画を配列から削除
                      tagBlockVideoList = tagBlockVideoList.filter(
                        function (targetNode) {
                          return (videoParentTag !== targetNode);
                        }
                      );

                      // フラグが立っていたら(クラスがついていたら)クラスを外す
                      if (flagList.blcTags_flag[0]) {
                        videoParentTag.classList.remove(VISIBILITY_CLASS);
                      }
                    }
                    // どちらにも引っかかる動画の場合
                    else if (allBlockVideoList.indexOf(videoParentTag) >= 0) {
                      // 対象の動画を配列から削除
                      allBlockVideoList = allBlockVideoList.filter(
                        function (targetNode) {
                          return (videoParentTag !== targetNode);
                        }
                      );
                      // キーワードでブロックされた動画の配列に格納しなおす
                      keywordBlockVideoList.push(videoParentTag);

                      // タグのフラグが立っていて、キーワードのフラグが立っていない場合、クラスを外す
                      if (flagList.blcTags_flag[0] && !flagList.blcKeywords_flag[0]) {
                        videoParentTag.classList.remove(VISIBILITY_CLASS);
                      }
                    }
                  }
                }
              }
            }
          }
          // ,ここにブロックするタグの一覧のBOXのノードが入る
        ],
        // キーワード
        blc_keywords: [
          [],
          function (targetLtr) {
            var key = '',
                videoParentTag,
                // ブロックされたかどうかのフラグ
                blcFlag;

            for (key in videoTitlesList) {
              if (videoTitlesList.hasOwnProperty(key)) {
                videoParentTag = document.querySelector('li[data-id="' + key + '"]');
                // ループの最初で値をfalseでリセット
                blcFlag = false;

                /*
                  その動画がどっちものブロックリストに入っていない
                  その動画がキーワードのブロックリストに入っていない
                */
                if (
                  allBlockVideoList.indexOf(videoParentTag) < 0 &&
                  keywordBlockVideoList.indexOf(videoParentTag) < 0
                ) {
                  blcFlag = (videoTitlesList[key].indexOf(targetLtr) >= 0);

                  // タイトルにヒットしなかった場合
                  if (!blcFlag && videoDescriptionsList.hasOwnProperty(key)) {
                    blcFlag = (videoDescriptionsList[key].indexOf(targetLtr) >= 0);
                  }

                  // タイトルか内容のどちらかに引っかかった場合
                  if (blcFlag) {
                    // タグでブロックされた動画ではない場合
                    if (tagBlockVideoList.indexOf(videoParentTag) < 0) {
                      // キーワードでブロックされた動画の配列に格納
                      keywordBlockVideoList.push(videoParentTag);
                      // フラグが立っていたらクラスをつける
                      if (flagList.blcKeywords_flag[0]) {
                        videoParentTag.classList.add(VISIBILITY_CLASS);
                      }
                    }
                    // すでにタグでブロックされていた場合
                    else {
                      // その動画のノードをタグでブロックした動画の配列から消す
                      tagBlockVideoList = tagBlockVideoList.filter(
                        function (targetNode) {
                          return (videoParentTag !== targetNode);
                        }
                      );
                      // タグのフラグが立っていない(クラスがついていない)がキーワードのフラグが立っている場合
                      if (!flagList.blcTags_flag[0] && flagList.blcKeywords_flag[0]) {
                        videoParentTag.classList.add(VISIBILITY_CLASS);
                      }
                      // どちらにも引っかかる動画の配列に格納
                      allBlockVideoList.push(videoParentTag);
                    }
                  }
                }
              }
            }
          },
          ['blKeywordsBox', '◎ブロックするキーワード一覧', 'blKeywordForm', '追加するキーワードを入力してください', 'addBlKeyword'],
          function () {
            var key = '',
                blcFlag,
                // 各動画の親ノード
                videoParentTag;

            // 各動画でループを回して全タイトル・内容をチェックする
            for (key in videoTitlesList) {
              // キーが自身のオブジェクトのプロパティだった場合
              if (videoTitlesList.hasOwnProperty(key)) {
                blcFlag = false;
                // 動画IDから動画のノードを取得
                videoParentTag = document.querySelector('li[data-id="' + key + '"]');

                // タグでブロックされた動画はスルーする
                if (tagBlockVideoList.indexOf(videoParentTag) < 0) {
                  blcNameArray.blc_keywords[0].forEach(function (targetLtr) {
                    // タイトル
                    if (!blcFlag && videoTitlesList[key].indexOf(targetLtr) >= 0) {
                      blcFlag = true;
                    }
                    // 内容
                    if (
                      videoDescriptionsList.hasOwnProperty(key) &&
                      !blcFlag &&
                      videoDescriptionsList[key].indexOf(targetLtr) >= 0
                    ) {
                      blcFlag = true;
                    }
                  });

                  // キーワードのブロックに引っ掛からなかった場合
                  if (!blcFlag) {
                    // キーワードでブロックされた動画の場合
                    if (keywordBlockVideoList.indexOf(videoParentTag) >= 0) {
                      // 対象の動画を配列から削除
                      keywordBlockVideoList = keywordBlockVideoList.filter(
                        function (targetNode) {
                          return (videoParentTag !== targetNode);
                        }
                      );

                      // フラグが立っていたら(クラスがついていたら)クラスを外す
                      if (flagList.blcKeywords_flag[0]) {
                        videoParentTag.classList.remove(VISIBILITY_CLASS);
                      }
                    }
                    // どちらにも引っかかる動画の場合
                    else if (allBlockVideoList.indexOf(videoParentTag) >= 0) {
                      // 対象の動画を配列から削除
                      allBlockVideoList = allBlockVideoList.filter(
                        function (targetNode) {
                          return (videoParentTag !== targetNode);
                        }
                      );

                      // タグでブロックされた動画の配列に格納しなおす
                      tagBlockVideoList.push(videoParentTag);

                      // キーワードのフラグが立っていて、タグのフラグが立っていない場合、クラスを外す
                      if (flagList.blcKeywords_flag[0] && !flagList.blcTags_flag[0]) {
                        videoParentTag.classList.remove(VISIBILITY_CLASS);
                      }
                    }
                  }
                }
              }
            }
          }
          // ,ここにブロックするキーワードの一覧のBOXのノードが入る
        ]
      },
      // ブロックの文字列で使う各タグをクローン用にセット
      blockWordLiTag = document.createElement('li'),
      blockWordSpanTag = document.createElement('span'),
      // HTMLタグ関連記号を文字実体参照に変換する用のオブジェクト
      charObjToEscape = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
      },
      // 1番目は設定の一覧のBOXを構成するパーツの配列、2番目はそのBOXのノード
      settingPartsArray = [['scriptSettingBox', '◎スクリプトの設定', '※有効な項目は緑色の文字で表示されます。', '各設定の詳細を見る']],
      // 各対象でブロックされた動画のノードを格納する配列
      tagBlockVideoList = [],
      keywordBlockVideoList = [],
      allBlockVideoList = [],
      // 動画の各要素を格納するオブジェクト、キー：動画ID,値：各文字列
      videoTagsList = {},
      videoTitlesList = {},
      videoDescriptionsList = {},
      // フォームの追加ボタンを押した時の挙動を簡単にするためのオブジェクト
      blAddBtnObj = {
        addBlTag: ['blTagForm', 'blc_tags'],
        addBlKeyword: ['blKeywordForm', 'blc_keywords']
      },
      // 検索対象外の動画のノードを格納
      unwantedVideoList = [],
      // 削除された動画のノードを格納
      removedVideoList = [],
      // 検索した文字列を格納する配列
      searchWordArray = [],
      // 全動画のノードを格納する配列
      allVideoNodesArray,
      // 処理の回数を記録し、終わった段階で処理をする
      checkVideoNodes = function () {
        var videoCounter;

        // 全動画のノードに対して処理
        allVideoNodesArray.forEach(function (targetNode) {
              // 使い回すので一旦格納
          var nodeClassList = targetNode.classList;

          // 最初にクラスが付いていたら消してリセットする
          if (nodeClassList.contains(CLEAR_LEFT_CLASS)) {
            nodeClassList.remove(CLEAR_LEFT_CLASS);
          }
          // ノードを消すクラスがついていない場合
          if (!nodeClassList.contains(VISIBILITY_CLASS)) {
            // 最初は値を初期化する
            if (typeof videoCounter === 'undefined') {
              videoCounter = 0;
            }
            // 2回目以降は足していく
            else {
              videoCounter++;
            }
            // 6の倍数で左の周り込み(float:feft)を消す(clear)クラスをつける
            if (videoCounter % 6 === 0) {
              nodeClassList.add(CLEAR_LEFT_CLASS);
            }
          }
        });
      },
      /**
        ブロックする文字列を追加
        @param: タグかキーワード
        @param: 対象の文字
        return: 重複したらfalse、成功したらtrue
      */
      addBlcLtr = function (stackName, targetLtr) {
            // 一旦、どっちの配列かを格納
        var blockArrayTemp = blcNameArray[stackName],
            // ブロックする文字列が格納された配列
            blockArray = blockArrayTemp[0],
            parentTag = blockArrayTemp[4].childNodes[1],
            liTag,
            spanTag;

        // すでにあった場合
        if (blockArray.indexOf(targetLtr) >= 0) {
          alert('"' + targetLtr + '"' + '　はすでに設定されています');
          return false;
        }
        // なかった場合、DBファイルに保存
        else {
          // すでにあるブロックする文字列の配列に追加する場合
          if (!!blockArray[0]) {
            GM_setValue(stackName, blockArray.join(SPLIT_WORD) + SPLIT_WORD + targetLtr);
          }
          // ブロックする文字列が何も設定されていなかった場合
          else {
            GM_setValue(stackName, targetLtr);
          }
          // 配列にも保存
          blockArray.push(targetLtr);
          // 追加した文字列で動画のチェック
          blockArrayTemp[1](targetLtr);

          // 各タグをクローンして格納
          liTag = blockWordLiTag.cloneNode(true);
          spanTag = blockWordSpanTag.cloneNode(true);
          // SPANタグを装飾してLIタグに挿入
          spanTag.setAttribute('name', stackName);
          spanTag.textContent = targetLtr;
          liTag.appendChild(spanTag);
          // LIタグをULタグに挿入
          parentTag.appendChild(liTag);
          // ブロックの文字列の間を空けるため半角スペースのテキストノードを挿入する
          parentTag.appendChild(document.createTextNode(' '));

          // 回り込みのクラスを付け直す
          checkVideoNodes();
          return true;
        }
      },
      // ブロックする文字列を削除
      delBlcLtr = function (stackName, targetLtr) {
            // 一旦、どっちの配列かを格納
        var blockArrayTemp = blcNameArray[stackName],
            // ブロックする文字列が格納された配列
            blockArray = blockArrayTemp[0],
            parentTag = blockArrayTemp[4].childNodes[1];

        // 配列から対象の文字列を削除して保存しなおす
        blockArray = blockArray.filter(function (theLtr) {
          return (targetLtr !== theLtr);
        });
        // DBの方も削除を反映させる
        GM_setValue(stackName, blockArray.join(SPLIT_WORD));

        // もともとの配列に入れ直す
        blcNameArray[stackName][0] = blockArray;
        // 対象の文字列で動画のチェック
        blockArrayTemp[3]();

        // HTMLタグ関連記号を文字実体参照に変換する
        targetLtr = targetLtr.replace(/[<>&]/g, function (str) {
          return charObjToEscape[str];
        });
        // 置換して対象を削除、nameがclassより先に来た時はこっちに引っかかる
        parentTag.innerHTML = parentTag.innerHTML.replace(
          '<li class="item"><span name="' + stackName +
          '" class="balloon tag ' + DEL_BLOCK_WORD_CLASS + '">' +
          targetLtr + '</span></li>', '');
        // 置換して対象を削除、classがnameより先に来た時はこっちに引っかかる
        parentTag.innerHTML = parentTag.innerHTML.replace(
          '<li class="item"><span class="balloon tag ' +
          DEL_BLOCK_WORD_CLASS + '" name="' + stackName + '">' +
          targetLtr + '</span></li>', '');

        // 回り込みのクラスを付け直す
        checkVideoNodes();
      },
      // コマンドメニューで使う関数
      changeSetFlags = function (flagName) {
        var tempFlag = flagList[flagName][0],
            key;

        // 厳密なチェック以外は反転させるだけ
        if (flagName !== 'strictComp_flag') {
          tempFlag = !tempFlag;
        }
        // 厳密なチェックは0と1を反転させる
        else if (!!tempFlag) {
          tempFlag--;
        } else {
          tempFlag++;
        }

        // DBと配列に格納
        flagList[flagName][0] = tempFlag;
        GM_setValue(flagName, tempFlag);

        // その後の処理を場合分け
        switch (flagName) {
          // タグのブロック
          case 'blcTags_flag':
            // タグでブロックしていた動画のノードのクラスを切り替える
            tagBlockVideoList.forEach(changeNodeClass);

            // どちらもfalseになった時orどちらもfalseから変わった時
            if (
              (tempFlag && !flagList.blcKeywords_flag[0]) ||
              (!tempFlag && !flagList.blcKeywords_flag[0])
            ) {
              // タグとキーワードのどちらもブロックの対象の動画のノードのクラスを切り替える
              allBlockVideoList.forEach(changeNodeClass);
            }
            break;
          // キーワードのブロック
          case 'blcKeywords_flag':
            keywordBlockVideoList.forEach(changeNodeClass);

            if (
              (tempFlag && !flagList.blcTags_flag[0]) ||
              (!tempFlag && !flagList.blcTags_flag[0])
            ) {
              allBlockVideoList.forEach(changeNodeClass);
            }
            break;
          // 対象外の動画のブロック
          case 'unwantedVid_flag':
            // 対象の動画のノードのクラスを切り替える
            unwantedVideoList.forEach(changeNodeClass);
            break;
          // 削除された動画のブロック
          case 'removedVid_flag':
            removedVideoList.forEach(changeNodeClass);
            break;
          // 厳密なチェック
          case 'strictComp_flag':
            // 対象外の動画のブロックのフラグを格納
            tempFlag = flagList.unwantedVid_flag[0];
            // 対象外の動画をリセットする
            unwantedVideoList.forEach(function (targetNode) {
                  // 動画の時間など表すノードの親ノードを取得
              var targetNodeParent = targetNode.childNodes[1];

              // 対象外の動画の表示を消す
              targetNodeParent.removeChild(targetNodeParent.lastChild);

              // フラグが立っていたらクラスを外す
              if (tempFlag) {
                targetNode.classList.remove(VISIBILITY_CLASS);
              }
            });
            // 配列の中身も空にする
            unwantedVideoList.length = 0;

            // 検索対象が含まれているか確認
            searchWordArray[flagList.strictComp_flag[0]].forEach(function (targetLtr) {
              var blcFlag,
                  targetNode;

              // 各動画をチェック、タイトルでチェックするのは削除された動画も確認するため、キーはグローバルのものを使う
              for (key in videoTitlesList) {
                // ループの最初で値をfalseでリセット
                blcFlag = false;

                // タイトルにヒットするかチェック
                if (videoTitlesList.hasOwnProperty(key)) {
                  blcFlag = (videoTitlesList[key].indexOf(targetLtr) >= 0);
                }

                // タイトルにヒットしなかった場合
                if (!blcFlag && videoTagsList.hasOwnProperty(key)) {
                  // タグにヒットするかチェック
                  blcFlag = (videoTagsList[key].indexOf(targetLtr) >= 0);
                  // タグにヒットしなかった場合
                  if (!blcFlag && videoDescriptionsList.hasOwnProperty(key)) {
                    // 内容にヒットするかチェック
                    blcFlag = (videoDescriptionsList[key].indexOf(targetLtr) >= 0);
                  }
                }

                // 検索対象が含まれていなかった時
                if (!blcFlag) {
                  // その動画のノードを取得
                  targetNode = document.querySelector('li[data-id="' + key + '"]');
                  // 動画のノードを配列に格納
                  unwantedVideoList.push(targetNode);

                  // 対象外の動画の表示をクローンして、時間などを表示しているノードの親ノードの末尾に追加
                  targetNode.childNodes[1].appendChild(unwantedVideoTag.cloneNode(true));

                  // フラグが立っていたらクラスをつける
                  if (tempFlag) {
                    targetNode.classList.add(VISIBILITY_CLASS);
                  }
                }
              }
            });
            break;
        }

        // 回り込みのクラスを付け直す
        checkVideoNodes();
      },
      // クラスを切り替える関数
      changeNodeClass = function (targetNode) {
        targetNode.classList.toggle(VISIBILITY_CLASS);
      };

  // 各クラスにスタイルをあてる
  GM_addStyle('.' + TAG_CLASS + ' { cursor: pointer; color: crimson; } ');
  GM_addStyle('.' + TITLE_CLASS + ' { cursor: pointer; color: crimson; } ');
  GM_addStyle('.' + ADD_BLOCK_TAG_CLASS + ' { cursor: pointer; } ');
  GM_addStyle('.' + DEL_BLOCK_WORD_CLASS + ' { cursor: pointer; } ');
  GM_addStyle('.' + CHG_SETTING_FLAG_CLASS + ' { cursor: pointer; } ');
  GM_addStyle('.' + OPEN_CLOSE_BL_BTN_CLASS + ' { cursor: pointer !important; background-color: crimson !important; } ');
  GM_addStyle('.' + OPEN_CLOSE_SET_BTN_CLASS + ' { cursor: pointer !important; background-color: dodgerblue !important; } ');
  GM_addStyle('.' + OPEN_SETTING_DETAIL_CLASS + ' { cursor: pointer !important; } ');
  GM_addStyle('.' + SETTING_STYLE_CLASS + ' { color: limegreen !important; } ');
  GM_addStyle('.' + VISIBILITY_CLASS + ' { display: none !important; } ');
  GM_addStyle('.' + VIDEO_NODE_CLASS + ' { float: left; width: 160px; margin-right: 20px; margin-bottom: 20px; } ');
  GM_addStyle('.' + CLEAR_LEFT_CLASS + ' { clear: left; } ');

  // ブロックの文字列のクローン用のノードにクラスをつける
  blockWordLiTag.setAttribute('class', 'item');
  blockWordSpanTag.setAttribute('class', 'balloon tag ' + DEL_BLOCK_WORD_CLASS);

  // 全動画のノードを格納
  allVideoNodesArray = Array.prototype.slice.call(
    document.querySelectorAll('li[data-enable-uad="1"]')
  );

  // 初期設定っぽいのは即時関数で済ませる
  (function () {
    var key = '',
        // 各キーの配列を一旦格納しておく
        blcPartsArraySub,
        // ブロックの一覧のDIVタグ
        blBoxDivTag,
        // 設定の一覧のBOXの中身
        settingBoxContainer = '',
        // タグとキーワードを並べるorそのボタンの親ノード
        blBoxParentNode = document.querySelector('section.tagCaption').childNodes[1],
        // そのページがサーチかタグかを判断するフラグ
        pageCheckFlag = /^https?\:\/\/www\.nicovideo\.jp\/tag\//.test(location.href),
        // ブロックする文字列のBOXのULタグ
        blockWordUlTag,
        // ブロック一覧のBOXの開閉のボタンのパーツを入れた配列
        blcBoxBtnPartsArray = [
          ['blc_tags', 'ブロックするタグ一覧を開く/閉じる'],
          ['blc_keywords', 'ブロックするキーワード一覧を開く/閉じる'],
          ['script_setting', 'スクリプトの設定一覧を開く/閉じる']
        ],
        // 各フラグ
        blockTagFlag,
        blockTitleFlag,
        ignoreFlag,
        strictFlag,
        // 検索対象外の動画につけるdivタグ
        unwantedVideoTag = document.createElement('div'),
        // エラーを2回以上出さないようにするフラグ
        errorFlag = true,
        // 処理した回数を記録するカウンタ
        taskCounter = 0,
        // 全角英数字文字列を半角文字列に変換する関数
        toOneByteAlphaNumeric = function (targetLtr) {
          return targetLtr.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
          });
        },
        // 通信でエラーが起きた時の関数
        printError = function (responseDetails) {
          // エラー情報をコンソールに出力
          console.error('An error occurred.' +
                        '\nresponseText: ' + responseDetails.responseText +
                        '\nreadyState: ' + responseDetails.readyState +
                        '\nresponseHeaders: ' + responseDetails.responseHeaders +
                        '\nstatus: ' + responseDetails.status +
                        '\nstatusText: ' + responseDetails.statusText +
                        '\nfinalUrl: ' + responseDetails.finalUrl);
          // アラートは初回だけ出す
          if (errorFlag) {
            alert('エラーが発生しました。詳しい情報はコンソールをご覧ください。\n' +
              '連続してエラーが発生する場合は、ネットワークやニコニコ動画の稼働状況をご確認ください。');
            errorFlag = false;
          }
        };

    // メインの横のコンテンツを消す
    document.querySelector('div[class="column sub"]').classList.add(VISIBILITY_CLASS);

    // メインの横を最大にして中央揃えにする
    blBoxDivTag = document.querySelectorAll('div.inner')[2];
    blBoxDivTag.style.width = '100%';
    blBoxDivTag.style.display = 'table';
    // ノードを入れ直して装飾
    blBoxDivTag = blBoxDivTag.childNodes[1];
    blBoxDivTag.style.width = '100%';
    // 検索の種類で入れ直すノードを変えて装飾
    if (pageCheckFlag) {
      blBoxDivTag = blBoxDivTag.childNodes[7];
    } else {
      blBoxDivTag = blBoxDivTag.childNodes[1].childNodes[5];
    }
    blBoxDivTag.style.display = 'table';
    blBoxDivTag.style.margin = '0 auto';

    // ブロックする文字列を格納していく
    for (key in blcNameArray) {
      // 使い回すので一旦格納
      blcPartsArraySub = blcNameArray[key][2];

      // ブロックするタグ・キーワード一覧を格納
      if (blcNameArray.hasOwnProperty(key) && !!GM_getValue(key)) {
        if (GM_getValue(key).indexOf(SPLIT_WORD) >= 0) {
          blcNameArray[key][0] = GM_getValue(key).split(SPLIT_WORD);
        } else {
          blcNameArray[key][0].push(GM_getValue(key));
        }
      }

      // ブロックの一覧のDIVタグを生成
      blBoxDivTag = document.createElement('div');
      // 各属性をつける
      blBoxDivTag.setAttribute('class', 'tagListBox ' + VISIBILITY_CLASS);
      blBoxDivTag.setAttribute('id', blcPartsArraySub[0]);
      // 共通部分を先に入れておく
      blBoxDivTag.innerHTML = '<div class="contentHeader"><p class="title" style="color:crimson;">' +
        blcPartsArraySub[1] + '</p><p class="edit"><input type="text" id="' +
        blcPartsArraySub[2] + '" placeholder="' + blcPartsArraySub[3] +
        '" style="width:250px;"> <button class="' + ADD_BL_LTR_BTN_CLASS +
        '" name="' + blcPartsArraySub[4] + '">追加</button></p></div>';
      // ブロックのBOXのULタグを生成してクラスをつける
      blockWordUlTag = document.createElement('ul');
      blockWordUlTag.setAttribute('class', 'tags');

      // 配列が空ではない場合、中身を入れていく
      if (!!blcNameArray[key][0].length) {
        // ブロックの配列でループを回す
        blcNameArray[key][0].forEach(function (targetLtr) {
              // 各ノードをクローンして格納
          var liTag = blockWordLiTag.cloneNode(true),
              spanTag = blockWordSpanTag.cloneNode(true);

          // SPANタグを装飾してLIタグに挿入
          spanTag.setAttribute('name', key);
          spanTag.textContent = targetLtr;
          liTag.appendChild(spanTag);
          // LIをULタグに挿入
          blockWordUlTag.appendChild(liTag);
          // ブロックの文字列の間を空けるため半角スペースのテキストノードを挿入する
          blockWordUlTag.appendChild(document.createTextNode(' '));
        });
      }

      // innerHTMLが入ったDIVタグに上のULタグを挿入
      blBoxDivTag.appendChild(blockWordUlTag);
      // 全体のDIVタグを親ノードに挿入する
      blBoxParentNode.appendChild(blBoxDivTag);
      // 配列に格納しておく
      blcNameArray[key].push(document.getElementById(blcPartsArraySub[0]));
    }

    // 各フラグと設定の一覧のBOXの中身
    for (key in flagList) {
      // (for-inループの対象となる)オブジェクト自身が持つプロパティなのか、プロトタイプ連鎖から来たプロパティなのかを判別する
      if (flagList.hasOwnProperty(key)) {
        // 初アクセス時のみに実行、フラグの設定
        if (typeof GM_getValue(key) === 'undefined') {
          GM_setValue(key, flagList[key][0]);
        } else {
          // 厳格なチェックのフラグは内容を変更したので、前のバージョンの場合は書き換える
          if (key === 'strictComp_flag' && !/\d/.test(GM_getValue(key))) {
            GM_setValue(key, flagList[key][0]);
          }
        }
        // 現在のフラグを格納していく、この時デフォルトの値を書き換えて保存する
        flagList[key][0] = GM_getValue(key);

        // そのフラグが有効である場合はスタイルのクラスをつける
        if (flagList[key][0] === flagList[key][2]) {
          settingBoxContainer += '<li class="item"><span id="' + key +
            '" class="balloon tag ' + CHG_SETTING_FLAG_CLASS + ' ' +
            SETTING_STYLE_CLASS + '">' + flagList[key][1] + '</span></li> ';
        } else {
          settingBoxContainer += '<li class="item"><span id="' + key +
            '" class="balloon tag ' + CHG_SETTING_FLAG_CLASS + '">' +
            flagList[key][1] + '</span></li> ';
        }
      }
    }

    // ブロックの一覧のDIVタグを生成
    blBoxDivTag = document.createElement('div');
    // 装飾して挿入
    blBoxDivTag.setAttribute('class', 'tagListBox ' + VISIBILITY_CLASS);
    blBoxDivTag.setAttribute('id', settingPartsArray[0][0]);
    blBoxDivTag.innerHTML = '<div class="contentHeader"><p class="title" style="color:dodgerblue;">' +
      settingPartsArray[0][1] + '<span class="infoTxtfavtag">' +
      settingPartsArray[0][2] + '</span></p><p class="edit"><a class="' + OPEN_SETTING_DETAIL_CLASS + '">' +
      settingPartsArray[0][3] + '</a></p></div><ul class="tags">' +
      settingBoxContainer + '</ul>';
    blBoxParentNode.appendChild(blBoxDivTag);
    // 配列に格納しておく
    settingPartsArray.push(document.getElementById(settingPartsArray[0][0]));

    // タグのボタン
    Array.prototype.slice.call(document.querySelectorAll('ul.list')).forEach(
      function (targetNode, index) {
        var tagCheckButton = document.createElement('li');

        // 最初と33以降は付けない
        if (!!index && index < 33) {
          tagCheckButton.appendChild(document.createTextNode('▼'));
          tagCheckButton.setAttribute('class', TAG_CLASS);
          targetNode.appendChild(tagCheckButton);
        }
      }
    );
    // タイトルのボタン
    Array.prototype.slice.call(document.querySelectorAll('p.itemTitle')).forEach(
      function (targetNode, index) {
        var titleCheckButton = document.createElement('span');

        // 33以降は付けない、32だとADEが無効の場合に支障が出る
        if (!!targetNode.nextSibling && index < 33) {
          titleCheckButton.appendChild(document.createTextNode('★'));
          titleCheckButton.setAttribute('class', TITLE_CLASS);
          targetNode.appendChild(titleCheckButton);
        }
      }
    );

    // ブロック一覧のBOXの開閉のボタンの親ノード
    blBoxDivTag = document.createElement('div');
    blBoxDivTag.style.marginTop = '5px';
    // ボタンを入れる前のノード
    if (pageCheckFlag) {
      blBoxParentNode = document.querySelector('div.contentBody');
    } else {
      blBoxParentNode = document.querySelectorAll('div.inner')[1];
    }

    // ブロック一覧のBOXの開閉のボタンの構成
    blcBoxBtnPartsArray.forEach(function (targetArray, index) {
      var blBoxDivTagSub = document.createElement('a');

      blBoxDivTagSub.setAttribute('name', targetArray[0]);
      blBoxDivTagSub.innerHTML = targetArray[1];
      // 最後以外は右に間を空けてくっつかないようにする
      if (index < 2) {
        blBoxDivTagSub.style.marginRight = '5px';
        blBoxDivTagSub.setAttribute('class', 'button nav rejection ' + OPEN_CLOSE_BL_BTN_CLASS);
      }
      // 設定のボタンはクラスが違う
      else {
        blBoxDivTagSub.setAttribute('class', 'button nav rejection ' + OPEN_CLOSE_SET_BTN_CLASS);
      }

      blBoxDivTag.appendChild(blBoxDivTagSub);
    });

    // タグの時はヘッダーの末尾、サーチの時は検索BOXの下に挿入
    if (pageCheckFlag) {
      blBoxParentNode.appendChild(blBoxDivTag);
    } else {
      blBoxParentNode.insertBefore(blBoxDivTag, document.querySelector('div.tagListBox'));
    }

    // 検索対象を格納
    searchWordArray.push(
      // 記号も含めたURIエンコード
      decodeURIComponent(
        // 検索ワードの前と後を消す
        location.href.replace(/(^https?\:\/\/www\.nicovideo\.jp\/(search|tag)\/)|(\?.*)/g, '')
        // 全角・半角空白か+で区切る
      ).split(/\s|\+/)
    );
    // 変換したものを入れる用の配列を格納
    searchWordArray.push([]);
    // 全角を半角に変換して格納
    searchWordArray[0].forEach(function (targetLtr) {
      searchWordArray[1].push(toOneByteAlphaNumeric(targetLtr));
    });

    // 各フラグを設定して使いまわす
    blockTagFlag = flagList.blcTags_flag[0];
    blockTitleFlag = flagList.blcKeywords_flag[0];
    ignoreFlag = flagList.cacheLoad_flag[0];
    strictFlag = flagList.strictComp_flag[0];

    // 対象外の動画の表示用のDIVタグの設定
    unwantedVideoTag.style.color = 'red';
    unwantedVideoTag.innerHTML = '検索対象を含まない動画です';

    // 各タグ・タイトル・内容を格納、ブロック処理、検索対象のチェック
    allVideoNodesArray.forEach(function (targetNode) {
          // 動画のIDを取得
      var videoId = targetNode.getAttribute('data-id');

      // 動画のノードのクラスを自前のクラスで上書き
      targetNode.setAttribute('class', VIDEO_NODE_CLASS);
      // APIから各動画の情報を取得
      GM_xmlhttpRequest({
        method: 'GET',
        url: 'http://ext.nicovideo.jp/api/getthumbinfo/' + videoId,
        ignoreCache: ignoreFlag,
        onload: function (responseDetails) {
              // 文字列からXMLをパース
          var doc = new DOMParser().parseFromString(responseDetails.responseText, 'application/xml'),
              // 動画の全タグを格納する配列
              allTags = [],
              // 動画のタイトル
              videoTitle,
              // 動画の内容
              videoDescription,
              // ブロック対象・検索対象かのチェック用フラグ
              blcFlag = 0,
              // 検索対象のチェック用
              blcFlagSub,
              // 動画のタイトルのAタグ
              aTag;

          // 正常に通信出来た時
          if (responseDetails.status === 200) {
            // タグのボタンを押した時に動画IDを取りやすくするように、動画IDのクラスを追加
            targetNode.childNodes[5].childNodes[3].childNodes[1].classList.add(videoId);

            // 動画が削除されていない時
            if (doc.getElementsByTagName('nicovideo_thumb_response')[0].getAttribute('status') === 'ok') {
              // 動画のタグを格納していき、オブジェクトにも保存
              Array.prototype.slice.call(doc.getElementsByTagName('tag'))
                .forEach(function (targetLtr) {
                  allTags.push(targetLtr.textContent);
              });
              videoTagsList[videoId] = allTags;
              // 動画のタイトルを取得して、オブジェクトにも保存
              videoTitle = doc.getElementsByTagName('title')[0].textContent;
              videoTitlesList[videoId] = videoTitle;
              // 動画の内容を取得して、オブジェクトにも保存
              videoDescription = doc.getElementsByTagName('description')[0].textContent;
              videoDescriptionsList[videoId] = videoDescription;

              // タグのBLでのチェック
              blcNameArray.blc_tags[0].forEach(function (targetLtr) {
                if (!!!blcFlag && allTags.indexOf(targetLtr) >= 0) {
                  blcFlag++;
                }
              });

              // 1回だけ判定したいので比較する用に変数に保存
              blcFlagSub = blcFlag;
              // キーワードのBLでのチェック
              blcNameArray.blc_keywords[0].forEach(function (targetLtr) {
                // タイトル
                if (
                  blcFlag === blcFlagSub &&
                  videoTitle.indexOf(targetLtr) >= 0
                ) {
                  blcFlag++;
                }
                // 内容
                if (
                  blcFlag === blcFlagSub &&
                  videoDescription.indexOf(targetLtr) >= 0
                ) {
                  blcFlag++;
                }
              });

              // ブロックにヒットした場合
              if (!!blcFlag) {
                // 1回ヒットした場合
                if (blcFlag === 1) {
                  // タグでヒットした場合
                  if (!!blcFlagSub) {
                    // 対象の配列に動画のノードを格納
                    tagBlockVideoList.push(targetNode);
                    // フラグが立っていたらクラスをつける
                    if (blockTagFlag) {
                      targetNode.classList.add(VISIBILITY_CLASS);
                    }
                  }
                  // タイトルか内容でヒットした場合
                  else {
                    keywordBlockVideoList.push(targetNode);
                    if (blockTitleFlag) {
                      targetNode.classList.add(VISIBILITY_CLASS);
                    }
                  }
                }
                // 2回ヒットした場合(タグとタイトル)
                else {
                  allBlockVideoList.push(targetNode);
                  // どちらのフラグが立っていればクラスを付ける
                  if (blockTagFlag || blockTitleFlag) {
                    targetNode.classList.add(VISIBILITY_CLASS);
                  }
                }
              }
              // ブロックにヒットしなかった場合
              else {
                // フラグをリセット
                blcFlag = false;
                // 検索対象が含まれているか確認
                searchWordArray[strictFlag].forEach(function (targetLtr) {
                  // タグ
                  if (!blcFlag && allTags.indexOf(targetLtr) >= 0) {
                    blcFlag = true;
                  }
                  // タイトル
                  if (!blcFlag && videoTitle.indexOf(targetLtr) >= 0) {
                    blcFlag = true;
                  }
                  // 内容
                  if (!blcFlag && videoDescription.indexOf(targetLtr) >= 0) {
                    blcFlag = true;
                  }
                });

                // 検索対象が含まれていなかった時
                if (!blcFlag) {
                  unwantedVideoList.push(targetNode);
                  targetNode.childNodes[1].appendChild(unwantedVideoTag.cloneNode(true));

                  if (flagList.unwantedVid_flag[0]) {
                    targetNode.classList.add(VISIBILITY_CLASS);
                  }
                }
              }
            }
            // 削除済み動画の処理
            else {
              // 削除された動画のノードを格納
              removedVideoList.push(targetNode);

              // 動画のタイトルのAタグを取得して装飾
              aTag = targetNode.childNodes[5].childNodes[1].childNodes[1];
              aTag.style.textDecoration = 'line-through';
              aTag.style.color = 'lightgray';
              // タイトルを配列に格納
              videoTitlesList[videoId] = aTag.getAttribute('title');

              // フラグが立っていたらクラスをつける
              if (flagList.removedVid_flag[0]) {
                targetNode.classList.add(VISIBILITY_CLASS);
              }
            }
          } else {
            printError(responseDetails);
          }

          // 処理の回数を記録
          taskCounter++;
          // 処理が全て終わった時、回り込みのクラスをつける
          if (taskCounter === 32) {
            checkVideoNodes();
          }
        },
        onerror: printError
      });
    });
  }());

  // クリックイベント
  document.addEventListener('click', function (ev) {
        // クリックしたノードを取得
    var targetNode = ev.target,
        // タグ表示用のDIVタグ
        divTag,
        parentTag,
        vidTags,
        // DIVタグの中身
        tags;

    // まずはクリックされたノードのクラス名で分ける
    switch (targetNode.className) {
      // タグのボタン
      case TAG_CLASS:
        // 親のノードを取得
        parentTag = targetNode.parentNode.parentNode;
        // 閉じられていた場合
        if (targetNode.textContent === '▼') {
          // マークを変更
          targetNode.textContent = '▲';
          // DIVタグを生成
          divTag = document.createElement('div');
          // 動画のIDをclassListから取得
          vidTags = videoTagsList[parentTag.classList[1]];

          // その動画のタグがあった場合、つまりその動画が削除されていない場合
          if (!!vidTags) {
            // DIVタグの中身を構成
            if (!!vidTags.length) {
              divTag.style.backgroundColor = 'gold';
              tags = '<span class="' + ADD_BLOCK_TAG_CLASS + '">' +
                vidTags.join('</span>,　<span class="' +
                ADD_BLOCK_TAG_CLASS + '">') + '</span>';
            } else {
              divTag.style.backgroundColor = 'pink';
              tags = 'この動画につけられたタグはありません';
            }
            // DIVタグを設定
            divTag.innerHTML = tags;
          }
          // その動画が削除されていた場合、適当に設定
          else {
            divTag.style.backgroundColor = 'pink';
            divTag.innerHTML = 'この動画は削除されています';
          }

          // 親のノードにDIVタグを挿入
          parentTag.appendChild(divTag);
        }
        // 開かれていた場合、マークを変えて中身を削除
        else {
          targetNode.textContent = '▼';
          parentTag.removeChild(parentTag.lastChild);
        }
        break;
      // 表示されたタグ
      case ADD_BLOCK_TAG_CLASS:
        addBlcLtr('blc_tags', targetNode.textContent);
        break;
      // タイトルのボタン
      case TITLE_CLASS:
        // プロンプトを出して入力させる、デフォルトにタイトルの文字列
        tags = prompt(
          'ブロックしたいキーワードを入力してください',
          videoTitlesList[
            targetNode.previousSibling.previousSibling.getAttribute('href').replace(/(^\/watch\/)|(\?.+)/g, '')
          ]
        );
        // 内容があれば第二引数に渡して関数を実行
        if (!!tags) {
          addBlcLtr('blc_keywords', tags);
        }
        break;
      // フォームの追加ボタン
      case ADD_BL_LTR_BTN_CLASS:
        // フォームのノードを取得
        parentTag = blAddBtnObj[targetNode.getAttribute('name')];
        divTag = document.getElementById(parentTag[0]);
        // フォームの値を取得
        tags = divTag.value;
        // 内容がある場合
        if (!!tags && addBlcLtr(parentTag[1], tags)) {
          // フォームの中身を消す
          divTag.value = '';
        }
        break;
      // 各ブロックの一覧のBOXにある各文字列ボタンの削除
      case 'balloon tag ' + DEL_BLOCK_WORD_CLASS:
        delBlcLtr(targetNode.getAttribute('name'), targetNode.textContent);
        break;
      // 設定の一覧のBOXにある各文字列ボタンの切り替え(スタイルなしバージョン)
      case 'balloon tag ' + CHG_SETTING_FLAG_CLASS:
        // スタイルを追加後、フラグを切り替える関数を実行
        targetNode.classList.add(SETTING_STYLE_CLASS);
        changeSetFlags(targetNode.getAttribute('id'));
        break;
      // 設定の一覧のBOXにある各文字列ボタンの切り替え(スタイルありバージョン)
      case 'balloon tag ' + CHG_SETTING_FLAG_CLASS + ' ' + SETTING_STYLE_CLASS:
        // スタイルを削除後、フラグを切り替える関数を実行
        targetNode.classList.remove(SETTING_STYLE_CLASS);
        changeSetFlags(targetNode.getAttribute('id'));
        break;
      // ブロックするタグ・キーワード一覧を開閉するボタン
      case 'button nav rejection ' + OPEN_CLOSE_BL_BTN_CLASS:
        blcNameArray[targetNode.getAttribute('name')][4].classList.toggle(VISIBILITY_CLASS);
        break;
      // 設定を開閉するボタン
      case 'button nav rejection ' + OPEN_CLOSE_SET_BTN_CLASS:
        settingPartsArray[1].classList.toggle(VISIBILITY_CLASS);
        break;
      // 設定の詳細をアラートで出す
      case OPEN_SETTING_DETAIL_CLASS:
        alert('◯タグでの動画のブロック\n' +
              '　指定した文字列が動画のタグにあればその動画をブロックします。\n' +
              '◯キーワードでの動画のブロック\n' +
              '　指定した文字列が動画のタイトルor投稿文にあればその動画をブロックします。\n' +
              '　ここで指定した文字列はタグについてはチェックしません。\n' +
              '◯検索対象外の動画のブロック\n' +
              '　検索した文字列が動画のタグ・タイトル・投稿文のいずれにもない場合、その動画をブロックします。\n' +
              '◯削除済みの動画のブロック\n' +
              '　検索した時に削除された動画が含まれていた場合、その動画をブロックします。\n' +
              '◯文字列比較の厳格化\n' +
              '　全角英数字と半角英数字を別の文字列として比較します。\n' +
              '　この設定は"検索対象外の動画のブロック"の処理に影響します。\n' +
              '◯キャッシュを使った読み込み\n' +
              '　ニコニコ動画のAPIから情報を取得する時にキャッシュを使うかどうか切り替えられます。\n' +
              '　読み込みでエラーが出た時はここの設定を変えることで解決できるかもしれません。');
        break;
    }
  }, false);
}());