
var socket = io();

var $room;

var mytracks = [];
var mylibrary = [];   
var presets = []; 

var $servertime = 0;
var $localtime = 0;

var $listopen = false; 
var $draweropen = false;

var $currentpreset = "1345768";

var $tick = false;  


socket.on('time', function(timeString) {
    $servertime = timeString;
    });

    // SEND TICK TO THE SERVER
function Clock(){
    
    $tick = true;
    socket.emit("tick");
    console.log("tick");

    setTimeout(CheckClock, 5000);
    setTimeout(Clock, 10000);
}

//TOCK

socket.on("tock", function(data){
    console.log("tock");
    $tick = false;
});

function CheckClock(){
    if ( $tick ) { $("#line").removeClass("on"); }
    else {  }
}


// CREATE NEW PRESET

$(document).on("click", "#new-preset-button", function(){
    socket.emit("addpreset", $room);
    $(".drawer").removeClass("open");
    $("#preset-handle").removeClass("on");
});


// ZOOM OUT TO PRESETS


$(document).on("click", "#poster-layer", function(){
    //console.log("Hit the poster");
    if ( $listopen ) { ClosePresets(); }
});


function ClosePresets(){
    $("#poster").removeClass("clouded");
    $(".frame").removeClass("faded");
    $("#poster-layer").removeClass("active");
    $listopen = false;
}

function OpenPresets(){
    $("#poster").addClass("clouded");
    $(".frame").addClass("faded");
    $("#poster-layer").addClass("active");
    $listopen = true;
}

function CloseDrawer(){
    $draweropen = false;
    $("#drawer").removeClass("open");
    }

function OpenDrawer(){
    $draweropen = true;
    $("#drawer").addClass("open");
}

// UPLOAD OPTIONS

//var uploader = new SocketIOFileUpload(socket);
//uploader.listenOnInput(document.getElementById("siofu_input"));
//uploader.addEventListener('start', (event)=> {
//    event.file.name = "fart.png";
//});

socket.on("sounduploaded", function(data){
    socket.emit("getlibrary", data);
});



function StartPlayer(){

    console.log("Starting up for room "+$room);
    socket.emit('getlibrary', $room);
    socket.emit('getpresets', $room);
    socket.emit("getbackground", $room);
    socket.emit("getcurrentpreset", $room);
}


function Start(){

console.log("Starting up for room "+$room);
socket.emit('getlibrary', $room);
socket.emit('getpresets', $room);
socket.emit("getbackground", $room);
socket.emit("getcurrentpreset", $room);


GenerateBackgrounds();

GenerateLink();


}


// GENERATE PLAYER LINK

function GenerateLink(){
    $("#link-handle").attr("url","http://www.battle.ink/player.html#"+$room);
}

$(document).on("click", "#link-handle", function(){
    $link = $(this).attr("url");
    copyToClipboard($link);
    alert("Link copied");
});

// BACKGROUND FUNCTIONS

function GenerateBackgrounds()
    {
    $(".art-option").each(function()
        {
        var url = $(this).attr("url");
        $(this).css("background-image", "url("+url+")");
        });
    }

$(document).on("click",'#custom-art-option', function(){
    $("#art-url-frame").toggleClass('open');
});

// GATHER PRESENTS

socket.on('sendpresets', function(data)
    {
    console.log(data);
    $('#thepresetlist').html("");
    presets = data;
    $.each(data, function(index, item){
        //console.log(item);
        $element = '<div class="preset noselect" target="'+item.id+'">'+item.title+'</div>';
        $('#thepresetlist').append($element);
    });
});


$(document).on('click', '.preset', function(e){
    $target = $(this).attr('target');
    $name = $(this).html();
    console.log("Updating the central preset to: "+$target);
    $data = {"room":$room, "preset":$target };
    socket.emit("changepreset", $data);
    $("#title-text-frame").html($name);
    e.stopPropagation();

});


socket.on("feedpreset", function(){
    console.log("A new preset has been requested...");
    $(".drawer").removeClass("open");
    $("#preset-handle").removeClass("on");
    socket.emit('getpresets', $room);
    socket.emit("getbackground", $room);
    socket.emit("wipetracklist", $room);
});


socket.on("wipetracks", function(){
    //console.log("wiping the track list clean...");
    mytracks = [];

    PIXI.sound.removeAll();
    $(".sound-item").removeClass('selected');
    $(".dot").remove();
    GatherPreset();

});






//GATHER A PRESET

function GatherPreset(){
    console.log("Requesting track list for the current preset");
    socket.emit("getcurrentpreset", $room);
}

socket.on("feedcurrentpreset", function(data){
    console.log("Building audio tracks for current preset");
    $currentpreset = data.preset;
    BuildTracks(data.library);
    $("#title-text-frame").html(data.title);
});

function SeedPresets(library){
    $.each(library, function(index, item)
        {
        SeedPresetSound(item.id, item.file, item.gain, item.pan, item.icon, item.loop);
        });
}

// GATHER TRACKS TO LIBRARY
socket.on("sendtracks", function(data){
    console.log("Receiving the tracks...");
    console.log(data);
    BuildTracks(data);
});

function BuildTracks(array){

    //console.log(array);

$.each(array, function(index, item){
    //console.log(item);
    if ( Existing(item.file)) 
        {
        //console.log("already exits")    
        }
    else 
        { 
        //console.log("fresh!"); 

        // GENERATE THE TRACK LOCALLY
        GenerateDot(item.id, item.file, item.gain, item.pan, item.icon, item.loop);
        }
});

}

function Existing(file){

// Find if the array contains an object by comparing the property value
if(mytracks.some(track => track.file === file))
    {
    return true;
    } 
    else { return false; }
}

function ExistingInLibrary(file){

// Find if the array contains an object by comparing the property value
if(mylibrary.some(track => track.file === file))
    {
    return true;
    } 
    else { return false; }
}




// GENERATE THE TRACK LOCALLY

function GenerateDot(name, file, gain, pan, icon, loop) {
    console.log("Adding "+name+" to the canvas");
    //console.log(gain);
    $new = {'id':name, 'file':file, "gain":gain, "pan":pan, "icon":icon, "loop":loop };
    mytracks.push($new);

    // update current preset
    var $index = presets.findIndex(x => x.id === $currentpreset);
    var library = presets[$index].library;
    //console.log(library);
    var $existing = library.findIndex(x => x.id === name);
    //console.log($existing);
     if ( $existing === -1 ) 
        { 
        //console.log("Adding song to the preset library"); library.push($new); 
        $fulldata = {"room":$room, "preset":$currentpreset, "track":$new };
        socket.emit("updatepreset", $fulldata);
        }
    //console.log(library);

    var x = GetX(pan);
    var y = GetY(gain);

    // generate html element
    var $element = "<div target='"+name+"' file='"+file+"' gain='"+gain+"' loop='"+loop+"' style='left:"+x+"px; top:"+y+"px' class='draggable dot loading noselect'><box-icon class='lefty' color='whitesmoke' name='"+icon+"'></box-icon><div class='trackname'>"+name+"</div></div>";
    $("#arena").append($element);

    // toggle the sound item in drawer
    $(".sound-item[name="+name+"]").addClass("selected");

    // generate pixi-sound object
    AddSound(name, file, gain, pan, loop);

}

function AddSound(name, file, gain, pan, loop){

    //console.log("making sound: "+name+" using file: "+file+" with gain "+gain);

    // do the pixi.js thing
    PIXI.sound.add(name, {
    url: 'audio/'+file,
    preload: true,
    loaded: function() {
        // duration can only be used once the sound is loaded
        //console.log('Duration: ', PIXI.sound.duration(sound), 'seconds');
        //console.log(name+' is loaded');
        StartVolume(name, gain);
        StartPan(name, pan);
        StartLoop(name, loop);
        PIXI.sound.play(name);
        MakeDraggable();
        $(".dot[target="+name+"]").removeClass("loading");
        }
    });

}

function StartVolume(target, gain){
    var it = PIXI.sound._sounds[target];
    it.volume = gain;
}


function StartPan(target, pan){
    var it = PIXI.sound._sounds[target];
    it.filters = [ new PIXI.sound.filters.StereoFilter(pan) ];
}

function StartLoop(target, loop){
    //console.log("Setting loop status to: "+loop);
    var it = PIXI.sound._sounds[target];
    it.loop = loop;
    
    if ( loop ) 
        { 
        $(".dot[target="+target+"]").addClass("loop");
        }

}

// KILL SOUND FUNCTION

function KillSound(name){
    //console.log("Killing track: "+name);
    $data = {"room":$room, "name":name };
    socket.emit("removesound", $data);
}

socket.on("soundscrubbed", function(name){
    //console.log("Scrubbing sound "+name);
    PIXI.sound.stop(name);
    $(".dot[target="+name+"]").remove();
    var $index = mytracks.findIndex(x => x.id === name);
    mytracks.splice($index, 1);
    //console.log(mytracks);
    // remove from local preset library
    // update current preset
    var $presetindex = presets.findIndex(x => x.id === $currentpreset);
    var $presetitem = presets[$presetindex].library.findIndex(x => x.id === name);
    //console.log($presetitem);
    presets[$presetindex].library.splice($presetitem, 1);
    //console.log(presets);
});



// TOOLS

$(document).on("click", "#tool-drawer-handle", function(){
    $("#tool-drawer").toggleClass("open");
    $(".drawer").removeClass("open");
    $(".tool-handle").removeClass("on");
});







function MakeDraggable() {

$('.draggable').dragon({  
      dragStart: function() 
        { 
        var Yposition = $(this).position().top;
        var Xposition = $(this).position().left;

        //console.log(Yposition+':'+Xposition);
        },
      drag: function() 
        {
        var halfscreen = $('#arena').width() / 2;
        var Xposition = $(this).position().left - halfscreen;
        var Xpercent = ($('#arena').width() / 100).toFixed(0);
        
        //console.log("TARGET = "+$(this).position().left);
        //console.log(Xposition);
        //console.log(halfscreen);

        var X = ((Xposition / Xpercent)*2).toFixed(0);
        //console.log(X);

        var Xpan = (X / 100);
        //console.log(Xpan);

        // THE REVERSAL

        var x = (((halfscreen / 100) * (Xpan * 100)) + halfscreen);
        //console.log("IT = "+x);


        var me = $(this).attr("target");

        ChangePan(me, Xpan);


        var Yposition = $('#arena').height() - $(this).position().top;
        var Ypercent = ($('#arena').height() / 100).toFixed(0);
        
        var Y = (Yposition / Ypercent).toFixed(0);
        var Ypan = (Y / 1000)*1;
        if (Ypan < 0 ) { Ypan = 0 };

        //console.log(Ypan);
        ChangeGain(me,Ypan);
        }
     });

    }



// GET THE X VALUE FROM PAN

function GetX(pan){
    var halfscreen = $('#arena').width() / 2;
    var x = (((halfscreen / 100) * (pan * 100)) + halfscreen);
    return x;
}

// GET THE Y VALUE FROM GAIN

function GetY(gain){

    var arenaheight = $('#arena').height();
    var Ypercent = ($('#arena').height() / 100).toFixed(0);
    var Yunpan = gain * 1000;
    //console.log(Yunpan);
    var Y = (Yunpan * Ypercent).toFixed(0);
    var ReverseY = 100 - Yunpan;
    //console.log(ReverseY);
    return (ReverseY * Ypercent) - 35;
}

// LIBRARY TOOLS

socket.on("sendlibrary", function(data){
    
    console.log("Receiving the library...");

    $("#thesoundlist").html("");

    $.each(data, function(index, item){
    //console.log(item);
    if ( ExistingInLibrary(item.file)) 
        {
        //console.log("already exits in library")    
        }
    else 
        { 
        //console.log("fresh!"); 

        // ADD THE ITEM TO THE LOCAL LIBRARY
        $element = '<li class="sound-item noselect" name="'+item.id+'" file="'+item.file+'" icon="'+item.icon+'">'+item.id+'</li>'; 
        $("#thesoundlist").append($element);
        }
});

SortSounds();

});


// SORT SOUND LIST

function SortSounds(){
    $("#thesoundlist li").sort(Sort).appendTo('#thesoundlist');
}

function Sort(a, b) {
    return ($(b).text().toUpperCase()) < 
    ($(a).text().toUpperCase()) ? 1 : -1; 
    }


    // GAIN FUNCTION

function ChangeGain(target, gain){
    
    var $data = {"room":$room, "name": target, "gain":gain, "preset":$currentpreset };
    socket.emit("volume", $data);

}

socket.on("changevolume", function(data){ 

    var it = PIXI.sound._sounds[data.name];
    if ( data.gain == 0 ) 
        { 
        $(".dot[target="+data.name+"]").addClass("faded");
        }
    else
        { 
        $(".dot[target="+data.name+"]").removeClass("faded");
        };

    //console.log(data.gain);

    it.volume = data.gain;

});



// GET CONTEXT MENU

$(document).on("contextmenu", ".dot", function(e){
    e.preventDefault;
    var sound = $(this).attr("target");
    $(this).toggleClass("loop");
    if ( $(this).hasClass("loop") ) { Loop(sound, true) }
    else { Loop(sound, false) };
    return false;
});


// SET LOOP

function Loop(name, toggle){
    var $data = {"room":$room, "name": name, "loop":toggle };
    socket.emit("seedloop", $data);
}

socket.on("feedloop", function(data){
    var it = PIXI.sound._sounds[data.name];
    it.loop = data.loop;
});



// PAN FUNCTION

function ChangePan(target, pan){
    var $data = {"room":$room, "name": target, "pan":pan, "preset":$currentpreset };
    //console.log($data);
    socket.emit("pan", $data);
    
}

socket.on("changepan", function(data){
    var it = PIXI.sound._sounds[data.name];
    it.filters = [ new PIXI.sound.filters.StereoFilter(data.pan) ];
    //console.log(it);
});







// SYNC FUNCTION

$(document).on("dblclick", ".dot", function(){
    var target = $(this).attr("target");
    Sync(target);

});


function Sync(target){
    var it = PIXI.sound._sounds[target];
    var currenttime = it.media.context.audioContext.currentTime;
    var $data = {"room":$room, "target": target, "current":currenttime };
    socket.emit("syncit", $data);
}

socket.on("sync", function(data){
    var it = PIXI.sound._sounds[data.target];
    PIXI.sound.stop(data.target);
    PIXI.sound.play(data.target);
    });



// TITLE DRAW FUNCTIONS

$(document).on("click", "#name-drawer-handle", function(){
    $(".drawer").removeClass("open");
    $(".tool-handle").not(this).removeClass("on");
    if ( $(this).hasClass("on") ) 
        {
        $(this).removeClass("on");
        }
    else 
        {
        $("#title-text-frame").addClass("open");
        $(this).addClass("on");
        }
});

$(document).on("keypress", "#title-text-frame", function(e) {
  if(e.which == 13) {
    e.preventDefault;
    $value = $(this).html();
    $data = {"room":$room, "title":$value};
    socket.emit("changetitle", $data);
    console.log($data);
    window.getSelection().removeAllRanges();
    return false;
  }
});




// ART DRAW FUNCTIONS


$(document).on("click", "#art-drawer-handle", function(){
    $(".drawer").removeClass("open");
    $(".tool-handle").not(this).removeClass("on");
    if ( $(this).hasClass("on") ) 
        {
        $(this).removeClass("on");
        }
    else 
        {
        $("#art-drawer").addClass("open");
        $(this).addClass("on");
        }
});

$(document).on("keypress","#art-url-frame", function(e) {
  if(e.which == 13) {
    e.preventDefault;
    $value = $(this).html();
    $data = {"room":$room, "url":$value};
    socket.emit("seedbackground", $data);
    $(this).removeClass("open");
    return false;
  }
});


socket.on("feedbackground",function(url){
    $("#poster").css("background-image","url("+url+")");
    $("#art-url-frame").html(url);
});


$(document).on("click", ".art-option", function(){
    $url = $(this).attr('url');
    $data = {"room":$room, "url":$url};
    socket.emit("seedbackground", $data);
});


// DELETE FUNCTIONS

$(document).on("click", "#delete-handle", function(){
    $(".drawer").removeClass("open");
    $(".tool-handle").not(this).removeClass("on");
    if ( $(this).hasClass("on") ) 
        {
        $(this).removeClass("on");
        }
    else 
        {
        //$("#delete-frame").addClass("open");
        $(this).addClass("on");
        if (window.confirm("Are you sure you want to delete this scene?")) 
            {
                console.log("deleting current preset");
                $(".drawer").removeClass("open");
                $("#delete-handle").removeClass("on");
                socket.emit("deletepreset", $room);
            } 
 
        }
});



socket.on("lastpreset", function(){
    alert("You can't delete the last scene.");
});


// LIBRARY DRAW FUNCTIONS

$(document).on("click", "#sound-drawer-handle", function(){
    $(".drawer").removeClass("open");
    $(".tool-handle").not(this).removeClass("on");
    if ( $(this).hasClass("on") ) 
        {
        $(this).removeClass("on");
        }
    else 
        {
        $("#drawer").addClass("open");
        $(this).addClass("on");
        }
});

$(document).on("click", ".sound-item", function(){
    $(this).toggleClass("selected");
    var name = $(this).attr("name");
    var file = $(this).attr("file");
    var icon = $(this).attr("icon");
    var gain = 0;
    var pan = 0;
    var loop = false;

    if ( $(this).hasClass("selected") ) { GenerateDot(name, file, gain, pan, icon, loop); }
    else { KillSound(name); }
    
});



// PRESET DRAW FUNCTIONS

$(document).on("click", "#preset-handle", function(){
    $(".drawer").removeClass("open");
    $(".tool-handle").not(this).removeClass("on");
    if ( $(this).hasClass("on") ) 
        {
        $(this).removeClass("on");
        }
    else 
        {
        $("#presetlist").addClass("open");
        $(this).addClass("on");
        }
});



// SEED NEW SOUND TO SERVER         
//function SeedSound(name, file, gain, pan, icon, loop) {
//    $data = {"name":name, "file":file, 'gain':gain, 'pan':pan, "icon":icon, 'loop':loop};
//    console.log($data);
//    socket.emit("seedsound", $data);
//}

//socket.on("newsound", function(){
//    socket.emit("gettracks");
//});



// SUMMON PRESET

function SeedPresetSound(name, file, gain, pan, icon, loop){
    $data = {"room":$room, "name":name, "file":file, "icon":icon, 'gain':gain, 'pan':pan, 'loop':loop};
    socket.emit('seedpreset', $data);
}


// COPY TO CLIPBOARD FUNCTION

function copyToClipboard(text) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(text).select();
    document.execCommand("copy");
    $temp.remove();
}


 