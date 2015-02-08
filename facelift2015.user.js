// ==UserScript==
// @name        facelift2015
// @namespace   com.facepunch.facelift
// @description modifies facepunch a little
// @include     /.*facepunch\.com/.*/
// @version     0.3.2
// @require     http://code.jquery.com/jquery-1.11.2.min.js
// @require     jquery.growl.js
// @resource    GROWL_CSS   jquery.growl.css
// @resource    FPFIXER_CSS fpfixer.css
// @resource    FLCONFIGPAGE fpconfigpage.html
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_getResourceText
// ==/UserScript==
function logger() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[FACELIFT] ");
    console.info.apply(console, args);
    var mymessage = args.map(function(num){return JSON.stringify(num) + "\n";}).join(" ");
    $.growl({ title: "Facelift", message: mymessage, location: "br"});
}
function logerror() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[FACELIFT] ");
    console.error.apply(console, args);
    $.growl.error({ message: args.join(" "), location: "br"});
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
/* Takes the specified url, and gives you a nicely formatted way to access the get variables
 * Example: http://dumb.url/?f=3&d=butt&u=me
 *     obj.f = 3
 *     obj.d = "butt"
 *     obj.u = "me"
 */
function getQueryParams(qs) {
    var vars = {};
    var parts = qs.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
/* Parses VBulletin timestamps into an actual usable Date object
 */
function actualTime(time){
    var mytime = time.split(" ");
    
    if(mytime.length === 3){
        if(mytime[2].toLowerCase().indexOf("ago") === -1){
            //using absolute time -- super ez
            mytime = mytime[1] + " " + /\d*/g.exec(mytime[0]) + ", " + mytime[2];
            time = new Date( Date.parse( mytime ) );
        } else {
            //using relative time -- just a tiny bit harder
            //has a console.log bug where it won't log to console until the end of this block and everything has already changed??
            var time = new Date();
            mytime[0] = parseInt(mytime[0], 10);
            mytime[1] = mytime[1].toLowerCase();
            
            switch(mytime[1]){
                case "days": case "day":
                    time.setDate( time.getDate() -mytime[0] );
                    break;
                case "hours": case "hour":
                    time.setHours( time.getHours() -mytime[0] );
                    break;
                case "minutes": case "minute":
                    time.setMinutes( time.getMinutes() -mytime[0] );
                    break;
                case "seconds": case "seconds":
                    time.setSeconds( time.getSeconds() -mytime[0] );
                    break;
            }
        }
    }
        
    return time;
}

//OOP config object
var configObj = function (settings, prefix) {
    this.settings = settings;
    this.prefix = prefix;
};
configObj.prototype.set = function(name, value) {
    //just fucken stringify everything who cares!!!
    value = JSON.stringify(value);
    logger("Set the value of " + this.prefix + name + " to: " + value);
    GM_setValue(this.prefix + name, value);
};
configObj.prototype.get = function(name) {
    var value = GM_getValue(this.prefix + name, this.settings[name]);
    var tempvalue = JSON.parse(value);
    //if(name !== 'debug')
    //config.log("Fetched something from config: ", this.prefix + name , tempvalue);
    return tempvalue || value;
};
configObj.prototype.reset = function(name) {
    GM_deleteValue(this.prefix + name);
    logger("Reset the value of " + this.prefix + name);
};
configObj.prototype.resetAll = function(){
    //HACK: greasemonkey keeps having GM_ListValues() break and this is a bad workaround
    //https://github.com/greasemonkey/greasemonkey/issues/2033
    var keys = cloneInto(GM_listValues(), window);
    keys.map(function(key) {
        if(key.indexOf(this.prefix) !== -1){
            GM_deleteValue(key);
        }
    });

    logger("Deleted the following keys: ", keys);
};
configObj.prototype.list = function(){
    //HACK: greasemonkey keeps having GM_ListValues() break and this is a bad workaround
    //https://github.com/greasemonkey/greasemonkey/issues/2033
    //weird map thing also... idk this is really kind of dumb
    var keys = cloneInto(GM_listValues(), window);
    var mythis = this; //HACK: inline functions use wrong this :^)

    return keys.map(function(key) {
        if(key.indexOf(mythis.prefix) !== -1){
            var t = {};
            t[key] = GM_getValue(key);
            return t;
        }
    });
};

//actually create our config objects with default parameters
var config = new configObj(
    {
        'poststats': '[1, 5, "false"]',
        'debug': true,
    },
    "settings_"
);

var data = new configObj(
    {
        'obj': false,
    },
    "data_"
);

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
    'folder':       '/images/cms/sections.png',

    //hardcoded
    'book':         'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHjSURBVDjLdZO/alVBEMZ/5+TemxAbFUUskqAoSOJNp4KC4AsoPoGFIHY+gA+jiJXaKIiChbETtBYLUbSMRf6Aydndmfks9kRjvHdhGVh2fvN9uzONJK7fe7Ai6algA3FZCAmQqEF/dnihpK1v7x7dPw0woF64Izg3Xl5s1n9uIe0lQYUFCtjc+sVuEqHBKfpVAXB1vLzQXFtdYPHkGFUCoahVo1Y/fnie+bkBV27c5R8A0pHxyhKvPn5hY2MHRQAQeyokFGJze4cuZfav3gLNYDTg7Pklzpw4ijtIQYRwFx6BhdjtCk+erU0CCPfg+/o2o3ZI13WUlLGo58YMg+GIY4dmCWkCAAgPzAspJW5ePFPlV3VI4uHbz5S5IQfy/yooHngxzFser30iFcNcuAVGw3A0Ilt91IkAsyCXQg5QO0szHEIrogkiguwN2acCoJhjnZGKYx4Ujz5WOA2YD1BMU+BBSYVUvNpxkXuIuWgbsOxTHrG3UHIFWIhsgXtQQpTizNBS5jXZQkhkcywZqQQlAjdRwiml7wU5xWLaL1AvZa8WIjALzIRZ7YVWDW5CiIj48Z8F2pYLl1ZR0+AuzEX0UX035mxIkLq0dhDw5vXL97fr5O3rfwQHJhPx4uuH57f2AL8BfPrVlrs6xwsAAAAASUVORK5CYII=',
    'faceliftcp':   'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAQCAYAAADJViUEAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQxJREFUeNp8U1ENwkAM3V0QcBLAwXAAyf4BB6AAJgEFgIKBAnAAKAAJc7A5GC15JS9l0ORl1+u9tu96C0VRZM6WgrUgd/sXwUFws41IQT38EFQ9RLW54CrYefIQASNtBQHV1Fbwa8EGBbKAtpU4oSqB1l2Pr1ZGtDNxLT7wbfA9O19treQZnD0qlKQ/kd6O/LfUSDpLSqI2du1+GZObntZMb/hFbrFOuLjkiB0kWJKnzT2So21PMRZfObfxkJyFkk9O67GnwzFeXsWXFvEQWppf44gVurMEH2mmeUFtJke2C7UEuT3RAQI3aN39IXMCvcCWf4wjApfsv2mCkeA+cIEaEhIq5jQNf65+CTAAkBpA6/X4W+8AAAAASUVORK5CYII=',
};

// popup class for the easy creation of popups
document.addEventListener('mousemove', function(e){
    popup.mouse.x = e.pageX;
    popup.mouse.y = e.pageY;
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
    
    'prep': function(node){
        node.text("");
        node.prepend($(document.createElement('a'))
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
        mybox.appendTo(node);
        return mybox;
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
                var mybox = popup.prep(div);

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

//stores information relative to what page we're currently on
//mostly just a placeholder
var pageinfo = {};

function determinePageInfo(){
    var loc = window.location.pathname;
    loc = loc.substr(1); //remove leading slash

    var te = loc.indexOf("/"); //still have slash?
    if(te !== -1){
        loc = loc.substr(0,te+1); //trim everything after slash
    } else {
        te = loc.indexOf(".php");
        if (te !== -1) {
            loc = loc.substr(0,te+4); //trim everything after ".php"
        }
    }

    var qparams = getQueryParams(window.location.search);

    //always grab the username of person running script
    pageinfo.username = $( "#navbar-login a" ).text();

    switch(loc){
        //we're at the index page (probably?)
        case "forum.php": case "":
            pageinfo.index = true;
            break;

        //viewing forum
        case "forums/": case "forumdisplay.php":
            pageinfo.forum = true;
            pageinfo.forumName = $( "#lastelement span" ).text();
            pageinfo.forumID = parseInt(qparams.f, 10);

            processThreads();

            break;

        //viewing thread
        case "threads/": case "showthread.php":
            pageinfo.thread = true;

            //Find "breadcrumb" in header, take last span, find the "a" tag inside of it
            pageinfo.forumName = $( "#breadcrumb :last-of-type a" ).text();
            pageinfo.forumID =  parseInt(getQueryParams($( "#breadcrumb :last-of-type a" )[0].href).f,10);
            pageinfo.threadName = $( "#lastelement span" ).text();
            //it's possible to be on thread page without specifiying "t" in the url
            //so we fetch the permalink of the first post instead #yolo
            pageinfo.threadID = parseInt(getQueryParams($("a.postcounter")[0].href).t, 10);
            pageinfo.pageNum = parseInt(qparams.page, 10) || 1;

            if ($("#pollinfo").length ){
                pageinfo.hasPoll = true;
            }

            processPosts();
            break;

        //posting a new thread
        case "newthread/": case "newthread.php":
            pageinfo.newthread = true;
            break;

        //making a poll?
        case "poll/": case "poll.php":
            pageinfo.poll = true;
            break;

        //making a sicknasty reply
        case "newreply/": case "newreply.php":
            pageinfo.newreply = true;
            pageinfo.threadID = parseInt(getQueryParams($( "#breadcrumb :last-of-type a" )[0].href).t,10);
            pageinfo.threadName = $( "#breadcrumb span:last-of-type a" ).text();
            pageinfo.postID = parseInt(qparams.p || 0,10);
            break;

        //editing a post
        case "editpost/": case "editpost.php":
            pageinfo.editpost = true;
            break;

        //viewing recent happenings/events
        case "fp_events/": case "fp_events.php":
            pageinfo.eventlog = true;
            pageinfo.eventType = qparams.type || "all";
            pageinfo.eventMem = parseInt(qparams.user || 0, 10);
            break;

        //viewing someone's userpage
        case "members/": case "members.php": case "member.php":
            pageinfo.members = true;
            break;

        //viewing the disabled memberlist
        case "memberlist/": case "memberlist.php":
            pageinfo.memberlist = true;
            break;

        //seeing the list of online members
        case "online/": case "online.php":
            pageinfo.online = true;
            break;

        //moderator/admin list (i don't know the URL rewrite version though so i just guessed)
        case "showgroups/": case "showgroups.php":
            pageinfo.showgroups = true;
            break;

        //chat was totally removed but i'll still keep this here anyways
        case "chat/": case "chat.php":
            pageinfo.chat = true;
            break;

        case "read/": case "fp_read.php":
            pageinfo.read = true;
            break;

        case "subscription/": case "subscription.php":
            pageinfo.subscription = true;
            addOptionToUserCP();

            $("#jump-to-folder").prepend($(document.createElement("a"))
                .addClass("textcontrol")
                .attr("href", "/usercp.php")
                .css("float", "left").css("margin-right", "1em")
                .text("View Subscriptions with New Posts")
            );

            break;

        //userprofile options configuration menu thing
        case "profile/": case "profile.php": case "usercp/": case "usercp.php":
            pageinfo.usercp = true;
            addOptionToUserCP();
            if(qparams.do === "facelift") createOptionsMenu();
            break;

        //PMs inbox and other stuff like that
        case "private/": case "private.php":
            pageinfo.pm = true;
            addOptionToUserCP();

            switch(qparams.do){
                case "showpm":
                    pageinfo.showpm = true;
                    pageinfo.sender = $("#post_ .username").text();
                    pageinfo.recipients = [];
                    $("#showpm .commalist .username").each( function (index) {
                        pageinfo.recipients.push($(this).text());
                    });
                    if(pageinfo.recipients.length == 0){
                        pageinfo.recipients.push(pageinfo.username);
                    }
                    break;

                case undefined: //inbox
                    var temp = $("#foldercontrols .allfolders").attr("title");
                    temp = temp.substr(temp.indexOf(":")+1);
                    pageinfo.messageNum = parseInt(temp, 10) || 0;

                    temp = $("#foldercontrols .quota").attr("title");
                    temp = temp.substr(temp.indexOf(":")+1);
                    pageinfo.messageMax = parseInt(temp, 10) || 0;
                    break;
            }
            break;

        default:
            pageinfo.unknown = true;
            break;
    }
}

//used when viewing a thread or any other pages that have posts on it
//TODO: check for deleted posts
function processPosts(){
    var posts = $("#posts li");

    if(typeof(pageinfo["posts"]) === 'undefined') pageinfo["posts"] = {};
    if(typeof(pageinfo["users"]) === 'undefined') pageinfo["users"] = {};

    posts.each(function(index){
        var post = $(this);
        var postid = parseInt(getQueryParams(post.find(".postcounter").attr("href")).p, 10);
        var userstats = post.find("#userstats").html().split("<br>");

        //find the ratings, parse a list of them, store into array with keys being the name, and value being the count
        var ratings = post.find(".rating_results span");
        var ratingsarr = {};
        ratings.each(function(){
            var type = $(this).find("img").attr("alt");
            var count = parseInt($(this).find("strong").text(), 10);
            ratingsarr[type] = count;
        });

        //parse flagdog into -> { fullname: flagcode }
        var country = post.find(".postlinking img[src^=\"/fp/flags/\"]");
        var countrycode = (/(?:.*\/flags\/)(.*)(?:\.png)/g.exec(country.attr("src")));
        countrystats = {};
        if(countrycode !== null) countrystats[country.attr("alt")] = countrycode[1];

        //who posted this thing??
        var userid = parseInt(getQueryParams(post.find(".username").attr("href")).u, 10);

        //values that we can easily retrieve
        pageinfo["posts"][postid] = {
            "id": postid,
            "time": actualTime(post.find( ".postdate .date" ).text()),
            "edited": ( post.find(".postdate .time").length > 0 || false ),
            "posterid": userid,
            "ratings": ratingsarr,
            "text": post.find(".postcontent").html(),
            "numquotes": post.find(".postcontent .quote").length,
            "numlinks": post.find(".postcontent a").not(".postcontent .quote a").length,
            "numemotes": post.find(".postcontent img[src^=\"/fp/emoot/\"]").not(".postcontent .quote img").length,
            "isop": (parseInt(post.find(".nodecontrols a:last-of-type").attr("name"), 10) === 1),
        };

        pageinfo["users"][userid] = {
            "id": parseInt(getQueryParams(post.find(".username").attr("href")).u, 10),
            "name": post.find(".username").text(),
            "title": post.find(".usertitle").text(),
            "avatar": post.find("img[alt*=\"Avatar\"]"),
            "rank": ( //don't you just love inline conditionals
                ( post.find(".username font[color=\"#A06000\"]").length > 0) ? "gold" :
                ( post.find(".username span[style=\"color:#00aa00;font-weight:bold;\"]").length > 0 ) ? "moderator" :
                "blue"),
            "joinmonth": userstats[0].split(" ")[0],
            "joinyear": parseInt(userstats[0].split(" ")[1],10),
            "posts": parseInt(userstats[1].split(" ")[0].replace(',', ''),10),
            "country": countrystats,
        };

        //below are values that require other values to already be set
        var curdate = new Date();
        var memdate = new Date( pageinfo["users"][userid]["joinmonth"] + " 1, " + pageinfo["users"][userid]["joinyear"]);
        pageinfo["users"][userid]["monthcount"] = (curdate.getFullYear()*12 + curdate.getMonth()*1) - (memdate.getFullYear()*12 + memdate.getMonth()*1);
    
    
    
        //manipulate a post
        if(config.get("debug") === true){
            $(document.createElement("a"))
            .attr("href","")
            .click(function(e){ 
                e.preventDefault();
                var div = popup.createFloatingDiv('debug_'+postid, 'debug');
                if (!div) return false; 
                
                /*div.click(function(){
                    $(this).hide();
                });*/
                div.show('fast');
                var mybox = popup.prep(div);
                
                debugPosts(postid, mybox);
            })
            .append($(document.createElement("img"))
                .attr("src", icons["wrench"])
                .attr("alt", "Debug")
                .attr("title", "Debug")
            )
            .appendTo(post.find(".postlinking"));
        }
    });
    
}

function debugPosts(id, div){
    var mytable = $(document.createElement("table")).css("border-collapse", "separate").css("border-spacing", ".5em");
    div.append(mytable);
    for(key in pageinfo['posts'][id]){
        var mydata = pageinfo['posts'][id][key];
        if(typeof(mydata) === "object") mydata = JSON.stringify(mydata);
    
        mytable.append($(document.createElement("tr"))
            .append($(document.createElement("th"))
                .text(key + ": ")
                .css("font-weight", "bold")
            )
            .append($(document.createElement("td")).append($(document.createElement("div"))
                .text(mydata)
                .css("max-height", "5em")
                .css("max-width", "30em")
                .css("overflow", "auto")
            ))
        );
    }
}

function processThreads(){
    //subscription.php?do=doaddsubscription&threadid=1444284
    var threads = $("#threads .threadbit");

    threads.each(function(index){
        var thread = $(this);

        modifyThreadBit(thread);
    });

}
function modifyThreadBit(thread){


    $(document.createElement("a"))
        .text("Subscribe")
        .attr("rel", "nofollow")
        .attr("href", "")
        .click(function(e){
            e.preventDefault();
            subscribeThread(
                $(this),
                parseInt(getQueryParams(thread.find(".threadtitle .title").attr("href")).t, 10),
                false
            );
        })
        .appendTo(thread.find(".threadmeta .author"));


}
function subscribeThread(obj, id, isAlreadySub){
    logger("Fake subscribing to ", id);
    obj.text("Unsubscribe");
}


function populateCSS() {
    var ourcss = '';
    ourcss += GM_getResourceText("GROWL_CSS") + "\n";
    ourcss += GM_getResourceText("FPFIXER_CSS") + "\n";

    // custom css
    //ourcss += "";

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

function addOptionToUserCP(messActive){
    //select the "my account" portion of the navigation
    var myaccount = $("#usercp_nav .block:last-of-type .blockbody > ul > li:nth-child(2)");

    var mylist = $(document.createElement("li"));
    mylist.addClass("facelift")
    .append($(document.createElement("h3"))
        .addClass("blocksubhead")
        .text(" Facelift")
        .prepend($(document.createElement("img"))
            .addClass("usercpimage")
            .attr("alt", "Facelift")
            .attr("src", icons['faceliftcp'])
        )
    ).append($(document.createElement("ul"))
        .addClass("blockrow")
    ).insertAfter(myaccount);



    mylist.find("ul").append($(document.createElement("li"))
        .addClass((messActive)? "active" : "inactive" )
        .append($(document.createElement("a"))
            .attr("href", "profile.php?do=facelift")
            .text("Configuration")
        )
    );
}

function createOptionsMenu(){
    document.body.textContent = "Loading page!!";
    
    unsafeWindow.document.documentElement.innerHTML = GM_getResourceText("FLCONFIGPAGE");
    
    //addNavbarLinks();

    $("#usercp_nav .active").attr("class", "inactive");
    $("#breadcrumb #lastelement").text("Facelift Configuration");

    addOptionToUserCP(true);
    
    //old janky version below
    /*$.get( "/profile.php?do=editattachments" , function( data ) {
        unsafeWindow.document.documentElement.innerHTML = data;
        addNavbarLinks();

        $("#usercp_nav .active").attr("class", "inactive");
        $("#breadcrumb #lastelement").text("Facelift Configuration");
        $("#attachmentlist").remove();

        addOptionToUserCP(true);
    });*/
}

function addNavbarLinks(){
    addNavbarLink("Ticker", "/fp_ticker.php", "ticker");
    addNavbarLink("Subscriptions", "/subscription.php?do=viewsubscription&folderid=all", "book");
    //addNavbarLink("Facelift", function(){ popup.openUrlInBox("dumbthing", "mainpopup", false, false ); }, "useful");

    $(document.createElement("a"))
        .attr("href","profile.php?do=facelift")
        .append($(document.createElement("img"))
            .attr("src", icons["artistic"])
            .attr("alt", "Facelift")
            .attr("title", "Facelift")
        )
        .appendTo($("#navbar-login .buttons"));
}

function init() {

    determinePageInfo();
    console.log(pageinfo);
    
    populateCSS();
    addNavbarLinks();
}
init();
