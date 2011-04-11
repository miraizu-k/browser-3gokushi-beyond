// ==UserScript==
// @name           3gokushi-MapStar
// @namespace      3gokushi
// @description    ブラウザ三国志のマップに★の数を表示します。
// @include        http://*.3gokushi.jp/map.php*
// ==/UserScript==

window.addEventListener("load",function() {

    if (typeof GM_addStyle == "undefined") {
        GM_addStyle = function(css) {
            var style = document.createElement('style');
            style.textContent = css;
            document.getElementsByTagName('head')[0].appendChild(style);
        };
    }


    GM_VAL_PREFIX = "GMMS_";

    /**
     * 設定データ初期化
     */
    var dataTable = {
        w : new Array("#FFFFFF", "#000000", GM_getValue(GM_VAL_PREFIX + "w", true)), // white
        r : new Array("#FF0000", "#FFFFFF", GM_getValue(GM_VAL_PREFIX + "r", true)), // red
        g : new Array("#00FF00", "#000000", GM_getValue(GM_VAL_PREFIX + "g", true)), // green
        b : new Array("#0000FF", "#FFFFFF", GM_getValue(GM_VAL_PREFIX + "b", true)), // blue
        y : new Array("#FFFF00", "#000000", GM_getValue(GM_VAL_PREFIX + "y", true)), // yellow
        p : new Array("#FF00FF", "#FFFFFF", GM_getValue(GM_VAL_PREFIX + "p", true)), // pink
        bk : new Array("#000000", "#FFFFFF", GM_getValue(GM_VAL_PREFIX + "bk", true)), // black
        bg : new Array("#0066FF", "#FFFFFF", GM_getValue(GM_VAL_PREFIX + "bg", true)), // sky blue
        o : new Array("#FFA500", "#000000", GM_getValue(GM_VAL_PREFIX + "o", true)) // orange
    };

    /**
     * styleの追加
     */
    GM_addStyle([
                 ".mapStar_outer{ width:10px;height:10px;margin:2px 4px 2px 0px;float:left;border:1px solid #000000;cursor:pointer; }",
                 ".mapStar_on{ filter:alpha(opacity=100);opacity:1; }",
                 ".mapStar_off{ filter:alpha(opacity=30);opacity:0.3;border:1px solid #999999; }",
                 ".mapStar_box{ filter:alpha(opacity=60);opacity:0.6; position: absolute; width: 8px; height: 8px; padding: 0px 0px 2px 3px; font-size: 8px;}",
               ].join("\n"));


    /**
     * 設定on/off処理関数
     */
    function onSettingClick() {
        var key = this.getAttribute("type");
        var gmv = GM_getValue(GM_VAL_PREFIX + key, true);
        GM_setValue(GM_VAL_PREFIX + key, !gmv);

        var clsName;
        var displayVal;
        if (gmv) {
            clsName = "mapStar_off";
            visibleVal = "hidden";
        } else {
            clsName = "mapStar_on";
            visibleVal = "visible";
        }

        var XPath = '//div[@class="mapStar_margin mapStar_box mapStar_' + key + '"]';
        var list = document.evaluate(XPath, document, null,
                XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

        for ( var i = 0; i < list.snapshotLength; i++) {
            list.snapshotItem(i).style.visibility = visibleVal;
        }

        XPath = '//div[@type="' + key + '"]';
        document.evaluate(XPath, document, null,
                XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.className = "mapStar_outer " + clsName;

    }

    /**
     * 設定ボックスの挿入
     */
    var insset = document.getElementById('mapboxInner');

    if (insset != null) {
        var set = document.createElement('div');
            set.style.backgroundColor = "#FFFFFF";
            set.setAttribute("id","mapStarBox");
            insset.appendChild(set);
        var cssText = "";
        for ( var key in dataTable) {
            var onoff = dataTable[key][2] ? "mapStar_on" : "mapStar_off";
            var setItem = document.createElement('div');
                setItem.className = "mapStar_outer " + onoff;
                setItem.style.backgroundColor = dataTable[key][0];

                set.appendChild(setItem);
                setItem.setAttribute("type", key);
                setItem.addEventListener("click", onSettingClick,false);
            cssText += ".mapStar_"+key+"{background-color:"+dataTable[key][0]+"; color:"+dataTable[key][1]+"} ";
        }
    }

    GM_addStyle(cssText);

    /**
     * MAPサイズ取得
     */
    var mapSize = document.getElementById('rollover').style.zIndex - 1;

    /**
     * 地図データの取得
     */
    var mapMap = new Array(mapSize + 1);
    var mapAreaDoc = document.getElementById('mapsAll');
    var imgRegCmp = new RegExp(/img\/panel\/[^_]*_([^_]*)_/);

    var imgMap = mapAreaDoc.getElementsByTagName('img');
    for ( var i = 0; i < imgMap.length; i++) {
        var clstxt = imgMap[i].className;
        if ((clstxt != null) && (clstxt.search(/mapAll(\d+)/) != -1)) {
            var mapIndex = RegExp.$1 - 0;
            var imgSrc = imgMap[i].src;
            if (imgRegCmp.exec(imgSrc)) {
                mapMap[mapIndex] = RegExp.$1;
            } else if (0 <= imgSrc.indexOf("blanc")) {
                mapMap[mapIndex] = "wall";
            }
        }
    }

    /**
     * 地図へ埋め込み
     *
     */
    var areas = mapAreaDoc.getElementsByTagName('area');

    // mapSizeからzIndexの値とmarginSizeを決定する
    var marginSize = "32px 0px 0px 23px";
    var zIndex = mapSize + 2;
    if (200 < zIndex && zIndex < 400) {
        marginSize = "25px 0px 0px 17px";
    } else if (400 <= zIndex) {
        marginSize = "16px 0px 0px 12px";
    }

    cssText = ".mapStar_margin{ margin:"+marginSize+"; z-index:"+zIndex+"; }";
    GM_addStyle(cssText);

    var regCmp = new RegExp(
            /(\'[^\']*\'[^\']*){5}\'(\u2605+)\'.*overOperation\(\'.*\'.*\'(.*)\'.*\'(.*)\'/);
    var j = 0;

    var alpha = 6;
    for ( var i = 1; i < mapMap.length; i++) {
        if (mapMap[i] != "undefined" && mapMap[i] == "wall") {
            continue;
        }

        if (areas[j] == "undefined") {
            break;
        }
        var mo = areas[j++].getAttribute('onmouseover');
        if (mo.search(/\u2605/) < 0) {
            continue;
        }

        if (regCmp.test(mo)) {
            var dataKey = (typeof mapMap[i] == "undefined") ? "w" : mapMap[i];

            var div = document.createElement('div');
            if (!dataTable[dataKey][2]) {
                div.style.visibility = "hidden";
            }

            div.className = "mapStar_margin mapStar_box mapStar_" + dataKey;
            div.setAttribute("id","mapStar_"+i);
            div.style.left = RegExp.$3;
            div.style.top = RegExp.$4;
            div.innerHTML = RegExp.$2.length;

            if (RegExp.$2.length >= 5) {
                div.style.border = "1px solid";
            }
            if (RegExp.$2.length >= 3) {
                div.style.fontWeight = "bold";
            }

            mapAreaDoc.appendChild(div);
        }
    }
},false);
