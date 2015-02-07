// ==UserScript==
// @name        facelift2015
// @namespace   com.facepunch.facelift
// @description modifies facepunch a little
// @include     /.*facepunch\.com/.*/
// @version     0.0.2
// @require     http://code.jquery.com/jquery-1.11.2.min.js
// @require     jquery.growl.js
// @resource    GROWL_CSS	jquery.growl.css
// @resource	FPFIXER_CSS	fpfixer.css
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_getResourceText
// ==/UserScript==
function logger() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[FACELIFT] ");
    console.info.apply(console, arguments);
}
function logerror() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[FACELIFT] ");
    console.error.apply(console, arguments);
}

// simple error catching thing
function onError(event) {
    if (event.target.errorCode) {
        logerror('Database ERROR: ', event.target.errorCode);
    } else {
        logerror('Generic ERROR: ', event);
    }
}

//if someone is using this as a chrome script and not tampermonkey
if (!this.GM_getValue || (this.GM_getValue.toString && this.GM_getValue.toString().indexOf("not supported")>-1)) {
    this.GM_getValue=function (key,def) { return localStorage[key] || def; };
    this.GM_setValue=function (key,value) { localStorage[key]=value; };
    this.GM_deleteValue=function (key) { delete localStorage[key]; };
}

// simple quality of life functions
function arrayContains(needle, arrhaystack) {
    return arrhaystack.indexOf(needle) > -1;
}
function sescape(v) {
    return v.replace(/&/, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

var config = {
    'settings': {
        'poststats': '[1, 5, "false"]'
    },

    set: function(name, value) {
        //just fucken stringify everything who cares!!!
        value = JSON.stringify(value);
        logger("Set the value of " + name + " to: " + value);
        GM_setValue(name, value);
    },
    get: function(name) {
        var value = GM_getValue(name, config.settings[name]);
        var tempvalue = JSON.parse(value);
        return tempvalue || value;
    },
    reset: function(name) {
        logger("Reset the value of " + name);
        GM_deleteValue(name);
    }
};

//easy reference for FP icons
var icons = {
    'events':       '/fp/navbar/events.png',
    'popular':      '/fp/navbar/popular.png',
    'read':         '/fp/navbar/read.png',
    'ticker':       '/fp/navbar/ticker.png',
    'search':       '/fp/navbar/search.png',
    'more':         '/fp/navbar/more.png',
    'mail':         '/fp/navbar/pm.png',
    'wrench':       '/fp/navbar/controlpanel.png',
    'reports':      '/fp/report.png',

    //ratings
    'winner':       '/fp/ratings/winner.png',
    'heart':        '/fp/ratings/heart.png',
    'funny':        '/fp/ratings/funny2.png',
    'agree':        '/fp/ratings/tick.png',
    'disagree':     '/fp/ratings/cross.png',
    'zing':         '/fp/ratings/zing.png',
    'informative':  '/fp/ratings/information.png',
    'useful':       '/fp/ratings/wrench.png',
    'optimistic':   '/fp/ratings/rainbow.png',
    'artistic':     '/fp/ratings/palette.png',
    'late':         '/fp/ratings/clock.png',
    'dumb':         '/fp/ratings/box.png',

    //misc
    'newpost':      '/fp/newpost.gif',
    'hasimages':    '/fp/hasimages.png',
    'lastpost':     '/fp/vb/buttons/lastpost.gif',
    'link':         '/fp/link.png',
    'time':         '/fp/time.png',
    'close':        '/fp/close.png',
}

document.addEventListener('mousemove', function(e){
    popup.mouse.x = e.clientX || e.pageX;
    popup.mouse.y = e.clientY || e.pageY
}, false);

var popup = {
    'mouse': {
        'x': 0,
        'y': 0
    },

    //abstract out some menus here so other areas are less cluttered
    //property 'order' is REQUIRED
    'pages': {
        'mainpopup': function(node) {
            node.append($(document.createElement('button')).text("TESTES"));

        },
    },

    'toggleFloatingDiv': function(id){
        var myobj = $('#' + id);
        if(myobj.length) {
            if (myobj.css('display') == 'block') {
                myobj.hide('fast');
            } else {
                myobj.css({
                    left: popup.mouse.x + 'px',
                    top: popup.mouse.y + 'px',
                    display: 'none'
                }).show('fast');
            }
            return true;
        }
        return false;
    },

    'createFloatingDiv': function(id, divClass) {
        if (popup.toggleFloatingDiv(id)) return false;

        var div = $(document.createElement('div'))
            .css({
                left: popup.mouse.x + 'px',
                top: popup.mouse.y + 'px'
            })
            .attr("id", id)
            .addClass("top popupbox " + divClass)
            .show('fast')
            .appendTo("body");

        return div;
    },


    'openUrlInBox': function(name, content, isUrl, autohide) {
        var div = popup.createFloatingDiv(name, 'urlbox');
        if (!div) return false;

        div.text( "Fetching..." );

        //if we want to autohide the boxes on click then we have to specifically say that
        if(typeof(autohide) === 'undefined' || !autohide){}
        else {
            div.click(function(){
                $(this).hide();
            });
        }

        div.show('fast');

        if(typeof(isUrl) !== 'undefined' ){
            if(isUrl) {
                $.get( content, function( data ) {
                    div.html( data );
                });
            } else {
                div.text("");
                div.prepend($(document.createElement('a'))
                    .attr("href", "")
                    .css("float", "right")
                    .click(function(event){
                        event.preventDefault();
                        $(this).parent().hide();
                    })
                    .append(
                        $(document.createElement('img'))
                        .attr("src", icons["close"])
                    )
                );

                var mybox = $(document.createElement('div')).css("margin", "1em");
                mybox.appendTo(div);

                //call our page function stored above
                popup.pages[content](mybox);
            }
        }
        return false;
    }
}

function addNavbarLink(name, onclick, icon){
    var mya = $(document.createElement('a')).text(name)
    .append(
        $(document.createElement('img'))
        .attr({
            alt: name,
            title: name,
            src: (icons[icon] || icons['more'])
    }));


    if(typeof(onclick) === 'function'){
        mya.click(function(event){
            event.preventDefault();
            onclick();
        }).attr("href", "");
    } else {
        mya.attr("href", onclick);
    }

    $(document.createElement('div')).addClass("navbarlink")
    .append(mya)
    .insertBefore("#navbarlinks .navbarlink:last-child");
}

function populateCSS() {
	var ourcss = '';
	ourcss += GM_getResourceText("GROWL_CSS") + "\n";
	ourcss += GM_getResourceText("FPFIXER_CSS") + "\n";

	//custom css
    ourcss += 'body{ background-color: #f00; }';

    //now we actually add our CSS to the page
    //replace our existing stylesheet if it's already there, or add it to the bottom of the page to prevent overwriting
    if (document.getElementById('FP_CSS') !== null) {
        document.getElementById('FP_CSS').textContent = ourcss;
    } else {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.id = 'FP_CSS';
        style.textContent = ourcss;
        document.body.appendChild(style);
    }
	
}

function init() {
    populateCSS();
    logger(config.get("poststats"));
    addNavbarLink("Ticker", "/fp_ticker.php", "ticker");
    addNavbarLink("Facelift", function(){ popup.openUrlInBox("dumbthing", "mainpopup", false, false ); }, "useful");
}
init();