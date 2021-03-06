﻿// ==UserScript==
// @name        facelift2015
// @namespace   com.facepunch.facelift
// @description modifies facepunch a little
// @include     /.*facepunch\.com/.*/
// @version     0.10.11
// @require     jquery-1.11.2.min.js
// @require     jquery.growl.js
// @require     jsonfn.js
// @requre      jquery-ui.min.js
// @resource    GROWL_CSS   jquery.growl.css
// @resource    FPFIXER_CSS fpfixer.css
// @resource    FLCONFIGPAGE fpconfigpage.html
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_getResourceText
// @grant       GM_info
// ==/UserScript==
"use strict";

function logger() {
    var args = Array.prototype.slice.call(arguments);
    var mymessage = args.map(function(num){return JSONfn.stringify(num) + "\n";}).join(" ");
    $.growl({ title: "Facelift", message: mymessage, location: "bl"});

    args.unshift("[FACELIFT] ");
    console.info.apply(console, args);
}
function logerror() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[FACELIFT] ");
    console.error.apply(console, args);
    $.growl.error({ message: args.join(" "), location: "br"});
}

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

//utility functions used in scripts
var facelift = {
    //add to our existing stylesheet if it's already there, or add it to the bottom of the page to prevent overwriting by default css
    "appendCSS": function(str){
        var mycssthing = document.getElementById('FP_CSS');

        if (mycssthing) {
            mycssthing.textContent = mycssthing.textContent + "\r\n" + str;
        } else {
            var style = document.createElement('style');
            style.type = 'text/css';
            style.id = 'FP_CSS';
            style.textContent = str;
            document.body.appendChild(style);
        }
    },

    //adds a navbar link to the header on FP
    "addNavbarLink": function(name, onclick, icon){
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
    },
    
    "addOptionToUserCP": function(displayName, url, makeActive){
        var myfacelift = $("#usercp_nav .block:last-of-type .blockbody > ul > .facelift");
        var mylist;
        
        //if we haven't added one yet
        if(myfacelift.length == 0){
            //select the "my account" portion of the navigation
            var myaccount = $("#usercp_nav .block:last-of-type .blockbody > ul > li:nth-child(2)");

            myfacelift = $(document.createElement("li"));
            myfacelift.addClass("facelift")
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
        }
        
        //remove all other active classes
        if(makeActive) {
            $("#usercp_nav .active").toggleClass("active inactive");
        }
        
        myfacelift.find("ul").append($(document.createElement("li"))
            .addClass((makeActive)? "active" : "inactive" )
            .append($(document.createElement("a"))
                .attr("href", url)
                .text(displayName)
            )
        );
        
    },
    
    //pretty useful for large arrays
    "arrayContains": function(needle, arrhaystack) {
        return arrhaystack.indexOf(needle) > -1;
    },

    //i'm pretty sure stringify/parse already does this though
    "sescape": function(v) {
        return v.replace(/&/, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    },

    /* Takes the specified url, and gives you a nicely formatted way to access the get variables
     * Example: http://dumb.url/?f=3&d=butt&u=me
     *     obj.f = 3
     *     obj.d = "butt"
     *     obj.u = "me"
     */
    "getQueryParams": function(qs) {
        var vars = {};
        var parts = qs.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        return vars;
    },

    /* Parses VBulletin timestamps into an actual usable Date object
     * pls kill me
     */
    "actualTime": function(time){
        //we use timezone to put the relative times back into UTC
        var timezone = data.get("timezone");
        if(!timezone) timezone = grabTimeZone(); //defined in scraper script
        if(!timezone) return; //i have no idea what happened

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
                        time.setDate( time.getDate() - mytime[0] );
                        break;
                    case "hours": case "hour":
                        time.setHours( time.getHours() - mytime[0] );
                        break;
                    case "minutes": case "minute":
                        time.setMinutes( time.getMinutes() - mytime[0] );
                        break;
                    case "seconds": case "seconds":
                        time.setSeconds( time.getSeconds() - mytime[0] );
                        break;
                }
            }
        } else {
            time = new Date();
        }

        //timezone fixer
        time.setHours(time.getHours() + timezone);

        return time;
    },
    
    "prepUCPMenu": function(title, subtitle){
        document.body.textContent = "Loading page!!";
        unsafeWindow.document.documentElement.innerHTML = GM_getResourceText("FLCONFIGPAGE");

        $("#usercp_nav .active").attr("class", "inactive");
        $("#breadcrumb #lastelement").text(title || "UserCP");
        
        // modify timestamp at bottom of page
        var timezone = data.get("timezone");
        if(timezone) timezone *= -1;
        var mydate = new Date();
        $("#footer_time").html("All times are GMT " + timezone + ". The time now is <span class=\"time\">" + mydate.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) + "</span>.");

        var myuserguy = $( "#navbar-login > a");
        if(myuserguy.text() === "Placeholder"){
            var myname = data.get("username");
            if(myname === ""){
                data.reset("username");
                myname = "Unknown";
            }
            myuserguy.find("strong").text(myname);
            myuserguy.attr("href", "member.php?u=" + (data.get("userid") || 0));
            pageinfo.username = myname;
            pageinfo.userid = parseInt(facelift.getQueryParams(myuserguy.attr("href")).u, 10);
        }
        
        var myoutput = $(document.createElement("div"));
        
        $("#usercp_content > div").append(myoutput
            .addClass("block")
            .append($(document.createElement("h2"))
                .addClass("blockhead")
                .text(subtitle || "UserCP")
            )
        );
        
        return myoutput;
    }
};

//OOP config object
var configObj = function (prefix, settings, descriptions) {
    this.settings = settings;
    this.descriptions = descriptions;
    this.prefix = prefix;
    this.allowDelete = true;
    this.allowEdit = true;

    this.set = function(name, value) {
        //just fucken stringify everything who cares!!!
        value = JSONfn.stringify(value);
        //console.log("Set the value of " + this.prefix + name + " to: " + value);
        GM_setValue(this.prefix + name, value);
    };
    this.update = function(name, value){
        //super hacky
        this.set(name.substr(this.prefix.length), value);
    };
    this.get = function(name, def) {
        var value = GM_getValue(this.prefix + name);

        // nothing is set yet, so make sure to set our default for easy configuration
        if(!value) {
            value = def || this.settings[name];
            if(typeof(value) !== 'undefined') this.set(name, value);
            return value;
        }

        //parse non-strings into an actual usable object
        var tempvalue;
        try{
            var tempvalue = JSONfn.parse(value);
        } catch (e){}
        //if(name !== 'debug')
        return tempvalue || value;
    };
    this.reset = function(name) {
        var mypref = this.prefix + name;
        GM_deleteValue(mypref);
        console.log("Reset the value of " + mypref);
    };
    this.resetAll = function(){
        //HACK: greasemonkey keeps having GM_ListValues() break and this is a bad workaround
        //https://github.com/greasemonkey/greasemonkey/issues/2033
        var keys = cloneInto(GM_listValues(), window);
        var mythis = this; //hack
        keys.map(function(key) {
            if(key.indexOf(mythis.prefix) !== -1){
                console.log("Deleted key: ", key);
                GM_deleteValue(key);
            }
        });
    };
    this.resetAllContains = function(search){
        //HACK: greasemonkey keeps having GM_ListValues() break and this is a bad workaround
        //https://github.com/greasemonkey/greasemonkey/issues/2033
        var keys = cloneInto(GM_listValues(), window);
        var mythis = this; //hack
        
        //use a substr to check if that last section of it is identical or not
        keys.map(function(key) {
            if(key.indexOf(mythis.prefix) !== -1 && key.substr(key.length - search.length) === search){
                console.log("Deleted key: ", key);
                GM_deleteValue(key);
            }
        });
    };
    this.list = function(){
        //HACK: greasemonkey keeps having GM_ListValues() break and this is a bad workaround
        //https://github.com/greasemonkey/greasemonkey/issues/2033
        //weird map thing also... idk this is really kind of dumb
        var keys = cloneInto(GM_listValues(), window);
        var mythis = this; //HACK: inline functions use wrong this :^)

        keys = keys.filter(function(key) {
            if(key.indexOf(mythis.prefix) !== -1){
                return true;
            }
        });

        return keys.map(function(key) {
            var t = {};
            //t[key] = mythis.get(key);
            t[key] = JSONfn.parse(GM_getValue(key));
            return t;
        });
    };
    this.prettyPrint = function(node, key, value){
        //used in clicks
        var mythis = this;
        // because we automatically prefix keys
        var prefixless = key.substr(this.prefix.length);

        var myrow = $(document.createElement("tr"));
        node.append(myrow);

        myrow.append($(document.createElement("td"))
            .text(key)
            .addClass("facelift_config key")
        );

        if(this.allowEdit === true){
            var mycell = $(document.createElement("td"))
                .addClass("facelift_config value " + typeof(value));

            var myinput = $(document.createElement("input")).attr("value", value);

            switch(typeof(value)){
                case "boolean":
                    myinput.attr("type", "checkbox").attr("checked", value)
                    .click(function(){ mythis.update(key, this.checked); });
                    break;

                case "number":
                    myinput.attr("type", "number");
                case "string":
                default:
                    myinput.change(function(){
                        var myval = this.value;
                        try{ myval = JSONfn.parse(this.value); } catch(e) { /* this is mostly just for numbers anyways */ }
                        mythis.update(key, myval);
                    });
                    break;
            }

            myrow.append(mycell.append(myinput));
        } else {
            myrow.append($(document.createElement("td"))
                .text(value)
                .addClass("facelift_config value " + typeof(value))
            );
        }

        if(this.allowDelete === true){
            myrow.prepend($(document.createElement("td"))
                .text("X")
                .click(function(){ mythis.reset(prefixless); $(this).parent().remove(); })
                .css("cursor", "pointer")
                .addClass("facelift_config delete")
            )
        }
    };
    this.prettyPrintList = function(target){
        var mytable = $(document.createElement("table"));
        mytable.addClass("facelift_config");
    
        target.append($(document.createElement("h3"))
            .addClass("blocksubhead")
            .text(this.displayName || "Header")
        ).append($(document.createElement("div"))
            .addClass("section")
            .append(mytable)
        );

        var myrow = $(document.createElement("tr"));
        mytable.append($(document.createElement("thead")).append(myrow));

        myrow.append($(document.createElement("th"))
                .text("Key")
                .addClass("facelift_config key")
            )
            .append($(document.createElement("th"))
                .text("Value")
                .addClass("facelift_config value")
            );
            
        if(this.allowDelete === true){
            myrow.prepend($(document.createElement("th"))
                .text("Delete")
                .addClass("facelift_config delete")
            );
        }

        var mylist = this.list();
        for(var i = 0; i < mylist.length; i++){
            var mykey = Object.keys(mylist[i])[0];
            this.prettyPrint(mytable, mykey, mylist[i][mykey]);
        }
    };
};

//make a list of this stuff
var configList = [];
function registerConfigObject(wef){
    configList[configList.length] = wef;
};

/* Holds all of our stored scripts for easy reference
 */
var scripts = new configObj("scripts_", {} );
scripts.allowDelete = false;
scripts.allowEdit = false;
scripts.displayName = "Scripts";
scripts.isRoot = function(key){
    return (key.substr(0, this.prefix.length + 1) === this.prefix + "a");
};
scripts.prettyPrint = function(node, key, script){
    var mydiv = $(document.createElement("div"));
    mydiv.addClass("facelift_config blockrow script").css("overflow","hidden").css("height","auto");
    
    var myright = $(document.createElement("div"));
    
    myright.css("float", "right")
        .append(
            $(document.createElement("button"))
            .text("Edit")
        )
        .appendTo(mydiv);
    
    if(script.canDisable === true){
        myright.append(
            $(document.createElement("button"))
            .text("Disable")
        );
    }
    
    if(script.canUninstall === true){
        myright.append(
            $(document.createElement("button"))
            .text("Uninstall")
        );
    }
    
    //name and version
    mydiv.append($(document.createElement("div"))
        .addClass("titlemeta")
        .append($(document.createElement("strong"))
            .text(script.name || key)
        ).append($(document.createElement("small"))
            .text(" v" + (script.version || "?.?.?"))
        )
    );
    
    mydiv.append($(document.createElement("p"))
        .addClass("description")
        .css("margin-left", "10px")
        .text(script.description || "")
    );
    
    
    
    
    node.append(mydiv);
    
};



var data = new configObj("data_",
    {
        'firsttime': true,
        'username': 'unknown',
        'userid': 0,
        'lastversion': GM_info.script.version,
    }
);
data.allowEdit = false;
data.displayName = "Global Data";


var config = new configObj("settings_",
    {
        'debug': false,
    }
);
config.displayName = "General Configuration";


registerConfigObject(config);
registerConfigObject(scripts);
registerConfigObject(data);




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
};


//interface for api
function registerScript(obj){
    // make sure that the script being passed isn't run as a root script
    registerScriptReal(false, obj);
}
//actual register function. shouldn't be called directly in custom scripts
function registerScriptReal(isRoot, obj){
    var baseorder = (isRoot)? 'a' : 'b';   
    var mystring = baseorder + "_" + numToLetters(obj.order || 0) + "_" + obj.shortname;
    
    var updatecheck = scripts.get(mystring);
    var doinstallfunc = false;
    var doinstall = false;
    
    //if we already have the script installed
    if(typeof(updatecheck) !== 'undefined'){
        //if our installed version is lower than our new version, set it to install, but don't call it's install function
        if(!compareVersionNumbers(updatecheck.version, obj.version)){
            logger("Updating script [" + obj.name + "] to version (" + obj.version + ")");
            doinstall = true;
        }
    } else { 
        console.log("Installing script for first time: ", obj);
        //installing for first time so do everything
        doinstall = true;
        doinstallfunc = true;
    }
    
    if(doinstall){
        //set some variables that need to be set first and check for exploits
        obj = preventScriptExploit(obj, isRoot, updatecheck);
    
        //remove all instances of script based on the shortname to prevent conflicts
        scripts.resetAllContains(obj.shortname);
        
        //actually store our script now
        scripts.set(mystring, obj);
    }
    if(doinstallfunc && typeof(obj.install) !== 'undefined'){
        obj.install();
    }
}

// script = script object of what we're installing
// root = if the script we're installing is root
// old = the currently installed script if it exists
function preventScriptExploit(script, root, old){
    if(old && old.firstrun === false){
        script.firstrun = false;
    } else {
        script.firstrun = true;
    }
    script.updatetime = new Date();
    script.isRoot = root;
    
    if(typeof(script.order) !== "number"){
        script.order = 5;
    }
    
    //force parameters back to default values if we're not a root script
    if(root === false){
        script.canDisable = true;
        script.canUninstall = true;
    }
    
    return script;
}

// taken from http://java.com/js/deployJava.js
// because too much effort otherwise tbh
function compareVersionNumbers(installed, required) {
    var a = installed.split('.');
    var b = required.split('.');

    for (var i = 0; i < a.length; ++i) {
        a[i] = Number(a[i]);
    }
    for (var i = 0; i < b.length; ++i) {
        b[i] = Number(b[i]);
    }
    if (a.length == 2) {
        a[2] = 0;
    }

    if (a[0] > b[0]) return true;
    if (a[0] < b[0]) return false;

    if (a[1] > b[1]) return true;
    if (a[1] < b[1]) return false;

    if (a[2] > b[2]) return true;
    if (a[2] < b[2]) return false;

    return true;
}

/* turns a number into something that can be used with alphabetical order
 * worst code ever made tbh
 */
function numToLetters(n) {
    var ordA = 'a'.charCodeAt(0);
    var ordZ = 'z'.charCodeAt(0);
    var len = ordZ - ordA + 1;

    var s = "";
    var temp = 0;
    while(n >= 0) {
        if(n >= len) temp = len-1;
        else temp = n;
        s = s + String.fromCharCode(temp + ordA);
        n = n - len;
    }
    return s;
}
//try to go through execute our installed scripts
function executeScripts(){
    var myscripts = scripts.list();

    executeScriptLoop(myscripts, function(script, key){
        if(script.load) script.load();
    
        // make sure we set that we've run the script already once before
        if(script.firstrun === true) {
            script.firstrun = false;
            console.log(key + " ran for the first time!");
            
            //holy fuk this is hacky
            scripts.update(key, script);
        }
    });
    
    //isn't really used for much but can be useful for completely overhauling pages
    executeScriptLoop(myscripts, function(script, key){
        if(script.loadLate) script.loadLate();
    });
    
    //process threads if we're looking at a forum view
    if(pageinfo.forum === true){
        var threads = $("#threads .threadbit");
    
        threads.each(function(index){
            var thread = $(this);
            executeScriptLoop(myscripts, function(script){
                if(script.onThread){ 
                    script.onThread(thread);
                }
            });
        });
    }

}

function executeScriptLoop(myscripts, callback){
    if(!callback) return false;
    
    for(var i = 0; i < myscripts.length; i++){
        var mykey = Object.keys(myscripts[i])[0];
        var myscript = myscripts[i][mykey];
        
        try{
            callback(myscript, mykey);
        } catch (e){
            logerror(e);
        }
    }
}


//handle version change and first time runs
function handleScriptChecks(){    
    //check for our greasemonkey script version, and compare it to our last run to see if it updated
    //also run on the first time too
    var lastversion = data.get("lastversion");
    if(!compareVersionNumbers(lastversion, GM_info.script.version) || data.get("firsttime") === true){ //need to update
        data.set("lastversion", GM_info.script.version);
        logger("Updated Greasemonkey Script to: " + GM_info.script.version);

        /* base scraper functionality
         * still need to make it less cumbersome and modular
         */
        registerScriptReal(true, {
            "version": "0.3.0",
            "author": "HeroicPillow",
            "name": "Scraper",
            "shortname": "scraper",
            "description": "Fetches/parses useful information about the page you are currently browsing for usage in other scripts.",
            "order": 0,
            "canDisable": true,
            "canUninstall": false,

            "load": function(){
                this.setupGlobals();
                this.determinePageInfo();
                
                if(config.get("debug") === true) console.log("Page Info: ", pageinfo);
                
                if(this.firstrun === true){
                    //make sure some values are set
                    var myuserguy = $( "#navbar-login > a");
                    data.set("username", myuserguy.text());
                    data.set("userid", parseInt(facelift.getQueryParams(myuserguy.attr("href")).u, 10));

                    grabTimeZone();
                }
            },
            "setupGlobals": function(){
                //scrapes for fp timestamp at bottom of page
                window.grabTimeZone = function(){
                    var timezone = $("#footer_time")
                    if(timezone.length === 0) return;
                    // assuming we've found our time text
                    timezone = timezone.text();
                    timezone = timezone.substr(timezone.indexOf("GMT"));
                    timezone = timezone.substr(0, timezone.indexOf("."));
                    timezone = timezone.split(" ");
                    if(timezone[1]){
                        timezone = -1 * parseInt(timezone[1], 10);
                        data.set("timezone", timezone); //update our config
                        return timezone;
                    } else {
                        return 0;
                    }
                };
            },
            "determinePageInfo": function(){
                window.pageinfo = {}; //make a global variable for us to use
                var loc = window.location.pathname.substr(1); //get our page/queries, and remove leading slash

                var te = loc.indexOf("/"); //still have slash?
                if(te !== -1){
                    loc = loc.substr(0,te+1); //trim everything after slash
                } else {
                    te = loc.indexOf(".php");
                    if (te !== -1) {
                        loc = loc.substr(0,te+4); //trim everything after ".php"
                    }
                }

                var qparams = facelift.getQueryParams(window.location.search);
                pageinfo.qparams = qparams;

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
                        pageinfo.hasThreadList = true;
                        break;

                    //viewing thread
                    case "threads/": case "showthread.php":
                        pageinfo.thread = true;

                        //Find "breadcrumb" in header, take last span, find the "a" tag inside of it
                        pageinfo.forumName = $( "#breadcrumb :last-of-type a" ).text();
                        pageinfo.forumID =  parseInt(facelift.getQueryParams($( "#breadcrumb :last-of-type a" )[0].href).f,10);
                        pageinfo.threadName = $( "#lastelement span" ).text();
                        //it's possible to be on thread page without specifiying "t" in the url
                        //so we fetch the permalink of the first post instead #yolo
                        pageinfo.threadID = parseInt(facelift.getQueryParams($("a.postcounter")[0].href).t, 10);
                        pageinfo.pageNum = parseInt(qparams.page, 10) || 1;

                        if ($("#pollinfo").length ){
                            pageinfo.hasPoll = true;
                        }
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
                        pageinfo.threadID = parseInt(facelift.getQueryParams($( "#breadcrumb :last-of-type a" )[0].href).t,10);
                        pageinfo.threadName = $( "#breadcrumb span:last-of-type a" ).text();
                        pageinfo.postID = parseInt(qparams.p || 0,10);
                        break;

                    //editing a post
                    case "editpost/": case "editpost.php":
                        pageinfo.editpost = true;
                        break;

                    //viewing recent happenings/events
                    case "events/": case "fp_events.php":
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
                        pageinfo.hasThreadList = true;
                        break;

                    case "subscription/": case "subscription.php":
                        pageinfo.subscription = true;
                        pageinfo.usercp = true;
                        break;

                    //userprofile options configuration menu thing
                    case "profile/": case "profile.php": case "usercp/": case "usercp.php":
                        pageinfo.usercp = true;
                        break;

                    //PMs inbox and other stuff like that
                    case "private/": case "private.php":
                        pageinfo.pm = true;
                        pageinfo.usercp = true;

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
                //always grab/set the username of person running script
                var myuserguy = $( "#navbar-login > a");
                if(myuserguy.length > 0){
                    pageinfo.username = myuserguy.text();
                    pageinfo.userid = parseInt(facelift.getQueryParams(myuserguy.attr("href")).u, 10);
                }
            },
            "onThread": function(thread){
                if(!pageinfo["threads"]) pageinfo["threads"] = {};
                
                var threadid = parseInt(thread.attr("id").split("_")[1], 10);
                
                pageinfo["threads"][threadid] = {
                    "id": threadid,
                    "name": thread.find(".threadtitle > a.title").text(),
                    "replies": parseInt(thread.find(".threadreplies").text().replace(',', ''), 10),
                    "views": parseInt(thread.find(".threadviews").text().replace(',', ''), 10),
                    "lastpostdate": facelift.actualTime(thread.find( ".threadlastpost > dl > dd:first-of-type" ).text())
                };
            },
            "processPosts": function(){
                var posts = $("#posts li");

                if(typeof(pageinfo["posts"]) === 'undefined') pageinfo["posts"] = {};
                if(typeof(pageinfo["users"]) === 'undefined') pageinfo["users"] = {};

                posts.each(function(index){
                    var post = $(this);

                    //only process if the post wasn't deleted
                    if(post.attr("class").indexOf("postbitdeleted") !== -1) return false;

                    var postid = parseInt(facelift.getQueryParams(post.find(".postcounter").attr("href")).p, 10);
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
                    var countrystats = {};
                    if(countrycode !== null) countrystats[country.attr("alt")] = countrycode[1];

                    //who posted this thing??
                    var userid = parseInt(facelift.getQueryParams(post.find(".username").attr("href")).u, 10);

                    //values that we can easily retrieve
                    pageinfo["posts"][postid] = {
                        "id": postid,
                        "idname": "#post_" + postid,
                        "time": facelift.actualTime(post.find( ".postdate .date" ).text()),
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
                        "id": parseInt(facelift.getQueryParams(post.find(".username").attr("href")).u, 10),
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
                });
            },
        });

        // Config menu in usercp
        registerScriptReal(true, {
            "version": "0.2.0",
            "author": "HeroicPillow",
            "name": "Config Menu",
            "shortname": "configmenu",
            "description": "Allows you to customize your facelift ~experience~",
            "order": 2,
            "canDisable": false,
            "canUninstall": false,

            "load": function(){
                if(pageinfo.usercp && pageinfo.qparams.do === "facelift"){
                    this.createOptionsMenu();
                    this.makeactive = true;
                }
            },
            "loadLate": function(){
                if(pageinfo.usercp){
                    facelift.addOptionToUserCP("Configuration", "profile.php?do=facelift", this.makeactive || false);
                }
            
                //create link back to config menu
                $(document.createElement("a"))
                    .attr("href","profile.php?do=facelift")
                    .append($(document.createElement("img"))
                        .attr("src", icons["artistic"])
                        .attr("alt", "Facelift")
                        .attr("title", "Facelift")
                    )
                    .appendTo($("#navbar-login .buttons"));
            },
            "createOptionsMenu": function(){
                var mybody = facelift.prepUCPMenu("Facelift Configuration", "Edit Facelift Options");

                var myconfigbody = $(document.createElement("div"))
                    .addClass("blockbody formcontrols settings_form_border");

                //allow editing/resetting of config, but not data
                for(var i = 0; i < configList.length; i++){
                    if(configList[i] === scripts) continue;
                    configList[i].prettyPrintList(myconfigbody);
                }

                mybody.append(myconfigbody);
            },
        });

        // script list menu in usercp
        registerScriptReal(true, {
            "version": "0.3.7",
            "author": "HeroicPillow",
            "name": "Script Menu",
            "shortname": "scriptmenu",
            "description": "This script controls what you're looking at right now!!!",
            "order": 2,
            "canDisable": false,
            "canUninstall": false,

            "load": function(){
                if(pageinfo.usercp && pageinfo.qparams.do === "faceliftscripts"){
                    this.createMenu();
                    this.makeactive = true;
                }
                if(pageinfo.usercp && pageinfo.qparams.do === "scriptinstall"){
                    this.installMenu();
                    this.makeactive = false;
                }
            },
            "loadLate": function(){
                if(pageinfo.usercp){
                    facelift.addOptionToUserCP("Scripts", "profile.php?do=faceliftscripts", this.makeactive || false);
                }
            },
            "createMenu": function(){
                var mybody = facelift.prepUCPMenu("Facelift Scripts", "Manage your installed scripts");

                var myconfigbody = $(document.createElement("div"))
                    .addClass("blockbody formcontrols settings_form_border");

                this.prettyPrintList(myconfigbody);

                mybody.append(myconfigbody);
            },
            "installMenu": function(){
                var mybody = facelift.prepUCPMenu("Facelift Scripts", "Install a facelift script!!");

                var myconfigbody = $(document.createElement("div"))
                    .addClass("blockbody formcontrols settings_form_border");

                mybody.append(myconfigbody);
                
                myconfigbody.append($(document.createElement("h3"))
                    .text("Script Source")
                    .addClass("blocksubhead")
                );
                
                var mytextbox = $(document.createElement("textarea"))
                    .addClass("scriptbox")
                    .css("resize", "none")
                    .css("width", "100%")
                    .css("height", "300px");
                myconfigbody.append(mytextbox);
                
                if(pageinfo.qparams.install){
                    $.ajax({
                        type: "GET",
                        url: pageinfo.qparams.install,
                        dataType: "text",
                        })
                        .done(function(msg) {
                            mytextbox.text(msg);
                        })
                        .fail(function(jx, e) {
                            logerror( "Whoops failed with fetching your install script: ", e );
                        });
                } else {
                    myconfigbody.text("You need to specify an install thing!!");
                }
            },
            "prettyPrintList": function(target){
                target.append($(document.createElement("div"))
                    .text("Script Management")
                    .addClass("blocksubhead")
                );

                target.append($(document.createElement("div"))
                    .addClass("facelift_config section")
                    .append(
                        $(document.createElement("a"))
                        .text("Install New Script")
                        .addClass("facelift_link button")
                        .attr("href", "profile.php?do=scriptinstall")
                    )
                );

                target.append($(document.createElement("h3"))
                    .text("Installed Scripts")
                    .addClass("blocksubhead")
                );

                var mysection = $(document.createElement("h3"));
                mysection.addClass("facelift_config section");

                target.append(mysection);

                var mylist = scripts.list();
                for(var i = 0; i < mylist.length; i++){
                    var mykey = Object.keys(mylist[i])[0];
                    scripts.prettyPrint(mysection, mykey, mylist[i][mykey]);
                }
            },

        });
        
        // navbar links
        registerScriptReal(true, {
            "version": "0.2.0",
            "author": "HeroicPillow",
            "name": "Navbar Links",
            "shortname": "navbarlinks",
            "description": "Adds some miscellaneous links to the navigation bar at the top of the page",
            "order": 9,
            "canDisable": true,
            "canUninstall": false,

            "loadLate": function(){
                facelift.addNavbarLink("Ticker", "/fp_ticker.php", "ticker");
                facelift.addNavbarLink("Subscriptions", "/usercp.php", "book");
            },
        });

        // chat functionality
        registerScriptReal(true, {
            "version": "0.2.0",
            "author": "HeroicPillow",
            "name": "Facepunch Chat",
            "shortname": "facepunchchat",
            "description": "Reimplements chat functionality for facepunch",
            "order": 5,
            "canDisable": true,
            "canUninstall": false,

            'load': function(){
                this.addCSS();
                if(config.get("showchat", false) === true) this.toggle();

                var mythis = this;
                $(document.createElement('button'))
                    .text("Chat")
                    .addClass("chatbutton")
                    .click(function(){
                        if(config.get("showchat") === true){
                            config.set("showchat", false);
                        } else {
                            config.set("showchat", true);
                        }
                        mythis.toggle();
                    })
                    .appendTo(document.body);
            },
            'addCSS': function(){
                var ourcss = "";
                ourcss += "\r\n body { margin-bottom: 2em; }";
                ourcss += "\r\n .chatbutton{ position:fixed; z-index: 2; bottom:0; right:0em; padding: .4em 1em; background: #fff; border:1px solid #222; cursor: pointer; }";
                ourcss += "\r\n #sidebar { float: right; width: 40%; background: rgba(255,255,255,.8); margin-top: 1em;}";
                ourcss += "\r\n #sidebar h2 { font-size: 12pt; font-weight: bold; padding: .5em;}";
                ourcss += "\r\n #disqus_thread { margin: 2em; }";
                //fixing the clears for chat
                ourcss += "\r\n #footer { z-index: 1; position: relative; clear:left; width: inherit; }";
                ourcss += "\r\n .threadlist, .below_threadlist, .above_threadlist, .member_summary, .member_summary .block, table#threads, #content_inner, .postlist, #postlist, div.threadhead, div.threadfoot, ol#posts .postbitlegacy, ol#announcements .postbitlegacy, div#showpm > ol .postbitlegacy, ol#message_list .postbitlegacy, ol#posts .postbit, ol#announcements .postbit, div#showpm > ol .postbit, ol#message_list .postbit, ol#posts .postbitdeleted, ol#announcements .postbitdeleted, div#showpm > ol .postbitdeleted, ol#message_list .postbitdeleted { clear: left; }";
                ourcss += "\r\n .makeroomforsidebar { margin-right: calc(40% + 1em) !important; }";

                facelift.appendCSS(ourcss);
            },
            'toggle': function(){
                var sidebar = $("#sidebar");

                //create it if we can't find it already
                if(sidebar.length == 0){
                    sidebar = $(document.createElement('div'));

                    sidebar.attr("id", "sidebar")
                        .append($(document.createElement('h2'))
                            .text("Facepunch Chat")
                        )
                        .append($(document.createElement('div'))
                            .attr("id", "disqus_thread")
                        )
                        .insertBefore($("#content_inner"));
                    sidebar.hide();

                    sidebar.append($(document.createElement('script'))
                        .attr("type", "text/javascript")
                        .text("var disqus_shortname = 'fpfacelift';\
                        var disqus_identifier = 'general';\
                        var disqus_title = 'Facepunch Chat';\
                        var disqus_url = 'http://facepunch.com/';\
                        \
                        /* * * DON'T EDIT BELOW THIS LINE * * */\
                        (function() {\
                            var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;\
                            dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';\
                            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);\
                        })();")
                    );

                }

                var myscroll = $(document).scrollTop();
                var myheight = $(document).height();

                $("#content_inner").toggleClass("makeroomforsidebar");
                $("#footer").toggleClass("makeroomforsidebar");
                sidebar.toggle();

                //HACK: HOW THE FUCK DO I MATH
                var mynewheight = $(document).height();
                var mynewscroll = myscroll + Math.ceil((myscroll / mynewheight) * (mynewheight - myheight));

                //scroll back to where we were
                $(document).scrollTop(mynewscroll);
            },
        });

        // subscribe functionality
        registerScriptReal(true, {
            "version": "0.2.0",
            "author": "HeroicPillow",
            "name": "Subscription Improvement",
            "shortname": "subscriptions",
            "description": "Vastly overhauls the VBulletin subscription functionality to not be so shitty",
            "order": 5,
            "canDisable": true,
            "canUninstall": false,

            "load": function(){
                this.addCSS();
                if(pageinfo.forum === true){
                    //add subscription column to thread list
                    $("#threads .threadlisthead .threadicon").after($(document.createElement("td"))
                        .addClass("threadsubscribe")
                        .append($(document.createElement("span"))
                            .text("Sub")
                        )
                    );

                    var mythis = this;
                    $("#threads .threadbit").each(function(index){
                        mythis.attachToThread($(this));
                    });
                } else if(pageinfo.subscription === true){
                    $("#jump-to-folder").prepend($(document.createElement("a"))
                        .addClass("textcontrol")
                        .attr("href", "/usercp.php")
                        .css("float", "left").css("margin-right", "1em")
                        .text("View Subscriptions with New Posts")
                    );

                    //whoever made these buttons is probably retarded
                    $("#usercp_content .groupcontrols a[href=\"subscription.php?do=viewsubscription&daysprune=-1folderid=all\"]")
                        .attr("href", "subscription.php?do=viewsubscription&daysprune=-1&folderid=all" );
                        
                    this.updateSubscriptionData();
                }
            },
            "attachToThread": function(thread){
                var mythis = this;

                thread.find(".threadicon").after($(document.createElement("td"))
                    .addClass("threadsubscribe alt")
                    .append($(document.createElement("a"))
                        .text("★")
                        .attr("rel", "nofollow")
                        .attr("title", "Subscribe")
                        .attr("href", "")
                        .click(function(e){
                            e.preventDefault();
                            mythis.subscribeThread(
                                $(this),
                                parseInt(facelift.getQueryParams(thread.find(".threadtitle .title").attr("href")).t, 10)
                            );
                        })
                    )
                );

            },
            "subscribeThread": function(obj, id){
                /* Can just visit this URL for removing
                    /subscription.php?do=removesubscription&return=ucp&t=1444284
                */

                /* Ajax POST to this??
                    /subscription.php?do=doaddsubscription&threadid=1448770
                    emailupdate: 0  (only through control panel)
                    folderid: 0 (default subscribe area)
                */
                var subscribedata = data.get("subscribe_" + id);

                if(subscribedata){
                    console.log(subscribedata);
                } else {
                    data.set("subscribe_" + id, "subscribed");
                }

                logger("Fake subscribing to ", id);
                obj.toggleClass("subscribed");
                var mytitle = obj.attr("title");
                if(mytitle === "Subscribe") obj.attr("title", "Un-Subscribe");
                else obj.attr("title", "Subscribe");
            },
            "updateSubscriptionData": function(){
                console.log("Totally not updating subscription data");
            },
            "addCSS": function(){
                var ourcss = "";
                ourcss += "\r\n table#threads tr td.threadsubscribe { text-align:center; min-width: auto; }";
                ourcss += "\r\n .threadsubscribe a { font-size: 170%; vertical-align: middle; color: #BBB !important; text-shadow: -1px -1px 0px #000, 1px 1px 0px #FFF;}";
                ourcss += "\r\n .threadsubscribe a:hover { text-decoration: none; color: #E0DD9F !important; }";
                ourcss += "\r\n .threadsubscribe a.subscribed { color: #FFA !important; text-shadow: 1px 0px #777, 0px 1px #777, -1px 0px #777, 0px -1px #777;}";
                facelift.appendCSS(ourcss);
            },
        });

        // debug posts
        registerScriptReal(true, {
            "version": "0.2.0",
            "author": "HeroicPillow",
            "name": "Debug Posts",
            "shortname": "debugposts",
            "description": "Adds inline information to posts for easy viewing/debugging",
            "order": 5,
            "canDisable": true,
            "canUninstall": false,

            "load": function(){
                if(config.get("debug") === true){
                
                    var mythis = this;
                
                    for(var key in pageinfo['posts']){
                        var post = pageinfo['posts'][key];
                    
                        $(document.createElement("a"))
                        .attr("href","")
                        .click(function(e){
                            e.preventDefault();
                            var div = popup.createFloatingDiv('debug_'+post.id, 'debug');
                            if (!div) return false;

                            div.show('fast');
                            var mybox = popup.prep(div);

                            mythis.debugPosts(post, mybox);
                        })
                        .append($(document.createElement("img"))
                            .attr("src", icons["wrench"])
                            .attr("alt", "Debug")
                            .attr("title", "Debug")
                        )
                        .appendTo($(post.idname + " .postlinking"));
                    }
                
                }
                
            },
            "debugPosts": function(post, div){
                var mytable = $(document.createElement("table")).css("border-collapse", "separate").css("border-spacing", ".5em");
                div.append(mytable);
                for(key in post){
                    var mydata = post[key];
                    if(typeof(mydata) === "object") mydata = JSONfn.stringify(mydata);

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
            },
        });

        // css fixes
        registerScriptReal(true, {
            "version": "0.2.0",
            "author": "HeroicPillow",
            "name": "CSS Normalizer",
            "shortname": "cssnormalizer",
            "description": "Completely overhauls Facepunch's CSS to try and not make it so fucked up.",
            "order": 5,
            "canDisable": true,
            "canUninstall": false,

            'load': function(){
                this.addCSS();
            },
            'addCSS': function(){
                var ourcss = '';
                ourcss += GM_getResourceText("FPFIXER_CSS") + "\n";

                if(config.get('shrinkimages', true) === true){
                    ourcss += "\r\n .quote { display: block; left:0; right: 1em; overflow:hidden; height:auto;}";
                    ourcss += "\r\n .postbit .content img, .postbitlegacy .content img, .postbitdeleted .content img, .postbitignored .content img, .eventbit .content img { max-width: 100% !important; max-height: 1024px !important; }";
                    ourcss += "\r\n .postbit .content img[class~=\"thumbnail\"], .postbitlegacy .content img[class~=\"thumbnail\"], .postbitdeleted .content img[class~=\"thumbnail\"], .postbitignored .content img[class~=\"thumbnail\"], .eventbit .content img[class~=\"thumbnail\"], div.quote div.message img { max-width: 800px !important; max-height: 350px !important; }";
                    ourcss += "\r\n DIV.video {max-width: 100%; position:relative;}";
                    ourcss += "\r\n DIV.video iframe {top:0; left:0; position:absolute;}";
                }
                else{ //someone has bad taste tbh
                    ourcss += '\r\n blockquote.postcontent { overflow:auto !important; }';
                }

                //now we actually add our CSS to the page
                facelift.appendCSS(ourcss);
            },
        });
             
    } //end update block
    
    
    //this mostly is just a startup message to know if the config was reset properly
    if(data.get("firsttime", true) === true){
        $.growl({ title: "Facelift", message: "This is your first time running facelift!", location: "tc"});
        //make sure we don't run this again ever unless someone deletes their settings
        //data should now be visible hopefully so we can set this
        data.set("firsttime", false);
    }
}


//for "easy" development unfucking
function resetEverything(){
    scripts.resetAll();
    data.resetAll();
    config.resetAll();
}

//try for development purposes
try{
//resetEverything();

//add basic css to page
facelift.appendCSS(GM_getResourceText("GROWL_CSS") + "\n");

//jquery ui css because relative images
$("head").append(
    '<link '
  + 'href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/themes/flick/jquery-ui.min.css" '
  + 'rel="stylesheet" type="text/css">'
);

handleScriptChecks();
executeScripts();
}
catch (e){
    logerror(e);
}