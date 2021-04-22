
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

socket.on('time', function(timeString) {
    $servertime = timeString;
    });


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






function Start(){

console.log("Starting up for room "+$room);
socket.emit('getlibrary', $room);
socket.emit('getpresets', $room);
socket.emit('getbackgrounds', $room);
socket.emit("getbackground", $room);
socket.emit("getcurrentpresetstart", $room);

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

socket.on("feedbackgrounds", function(array){

    $("#theartlist").html("");

    $.each(array, function(index, item){

        var element = '<div class="art-option" url="'+item.filename+'" style="background-image:url('+item.filename+');"></div>';
        $("#theartlist").append(element);

    });
    
});


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
    //mytracks = [];
    $(".sound-item").removeClass('selected');
    $(".dot").fadeOut(600, function() { $(this).remove(); });

    GatherPreset();

    $.each(mytracks, function(index, item){
        FadeOutAudio(item.id);
    });

    

    
    

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


socket.on("feedcurrentpresetstart", function(data){
    console.log("Building audio tracks for current preset at launch");
    $currentpreset = data.preset;
    BuildTracksFirst(data.library);
    $("#title-text-frame").html(data.title);

});

function SeedPresets(library){
    $.each(library, function(index, item)
        {
        SeedPresetSound(item.id, item.name, item.file, item.gain, item.pan, item.icon, item.loop);
        });
}

// GATHER TRACKS TO LIBRARY
socket.on("sendtracks", function(data){
    console.log("Receiving the tracks...");
    console.log(data);
    BuildTracks(data);
});

function BuildTracks(array){

console.log(array);

$.each(array, function(index, item){
    //console.log(item);
    if ( Existing(item.file)) 
        {
        console.log("already exits");
        ReGenerateDot(item.id, item.name, item.file, item.gain, item.pan, item.icon, item.loop);   
        }
    else 
        { 
        //console.log("fresh!"); 

        // GENERATE THE TRACK LOCALLY
        GenerateDot(item.id, item.name, item.file, item.gain, item.pan, item.icon, item.loop);
        }
});

}



function BuildTracksFirst(array){

console.log(array);

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
        GenerateDotFirst(item.id, item.name, item.file, item.gain, item.pan, item.icon, item.loop);
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

function GenerateDot(id, name, file, gain, pan, icon, loop) {
    console.log("Adding "+id+" to the canvas with name "+name);
    //console.log(gain);
    $new = {'id':id, 'name':name, 'file':file, "gain":gain, "pan":pan, "icon":icon, "loop":loop };
    console.log($new);
    mytracks.push($new);
    console.log(mytracks);

    // update current preset
    var $index = presets.findIndex(x => x.id === $currentpreset);
    var library = presets[$index].library;
    //console.log(library);
    var $existing = library.findIndex(x => x.id === id);
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
    var $element = "<div target='"+id+"' name='"+name+"' file='"+file+"' gain='"+gain+"' loop='"+loop+"' style='left:"+x+"px; top:"+y+"px' class='draggable dot loading noselect'><div class='sound-button play-button on'></div><div class='trackname'>"+name+"</div><div class='sound-button loop-button'></div></div>";
    $("#arena").append($element);

    // toggle the sound item in drawer
    $(".sound-item[target="+id+"]").addClass("selected");

    // generate pixi-sound object
    AddSound(id, name, file, gain, pan, loop);

}


// RE GENERATE THE TRACK LOCALLY FROM EXISTING

function ReGenerateDot(id, name, file, gain, pan, icon, loop) {
    console.log("Adding "+id+" to the canvas with name "+name);
    //console.log(gain);

    // update current preset
    var $index = presets.findIndex(x => x.id === $currentpreset);
    var library = presets[$index].library;
    //console.log(library);
    var $existing = library.findIndex(x => x.id === id);
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
    var $element = "<div target='"+id+"' name='"+name+"' file='"+file+"' gain='"+gain+"' loop='"+loop+"' style='left:"+x+"px; top:"+y+"px' class='draggable dot loading noselect'><div class='sound-button play-button on'></div><div class='trackname'>"+name+"</div><div class='sound-button loop-button'></div></div>";
    $("#arena").append($element);

    // toggle the sound item in drawer
    $(".sound-item[target="+id+"]").addClass("selected");

    // generate pixi-sound object
    ReAddSound(id, name, file, gain, pan, loop);

}





// GENERATE THE TRACK LOCALLY

function GenerateDotFirst(id, name, file, gain, pan, icon, loop) {
    console.log("Adding "+id+" to the canvas");
    //console.log(gain);
    $new = {'id':id, 'name':name, 'file':file, "gain":gain, "pan":pan, "icon":icon, "loop":loop };
    mytracks.push($new);
    console.log(mytracks);

    // update current preset
    var $index = presets.findIndex(x => x.id === $currentpreset);
    var library = presets[$index].library;
    //console.log(library);
    var $existing = library.findIndex(x => x.id === id);
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
     var $element = "<div target='"+id+"' file='"+file+"' gain='"+gain+"' loop='"+loop+"' style='left:"+x+"px; top:"+y+"px' class='draggable dot loading noselect'><div class='sound-button play-button on'></div><div class='trackname'>"+name+"</div><div class='sound-button loop-button'></div></div>";
     $("#arena").append($element);

    // toggle the sound item in drawer
    $(".sound-item[target="+id+"]").addClass("selected");

    // generate pixi-sound object
    AddSoundFirst(id, name, file, gain, pan, loop);

}



function AddSound(id, name, file, gain, pan, loop){

    //console.log("making sound: "+name+" using file: "+file+" with gain "+gain);

    SeedSound(id, name, file, gain, pan, loop);

    // do the pixi.js thing
    PIXI.sound.add(id, {
    url: 'audio/'+file,
    preload: true,
    loaded: function() {
        // duration can only be used once the sound is loaded
        //console.log('Duration: ', PIXI.sound.duration(sound), 'seconds');
        //console.log(name+' is loaded');
        //StartVolume(id, gain);
        StartPan(id, pan);
        StartLoop(id, loop);
        PIXI.sound._sounds[id].volume = 0;
        FadeInAudio(id, gain);
        MakeDraggable();
        $(".dot[target="+id+"]").removeClass("loading");
        }
    });

}



function ReAddSound(id, name, file, gain, pan, loop){

    console.log("REmaking sound: "+name+" using file: "+file+" with gain "+gain);

    //SeedSound(id, name, file, gain, pan, loop);

    // do the pixi.js thing
    //StartVolume(id, gain);
    StartPan(id, pan);
    StartLoop(id, loop);
    FadeInAudio(id, gain);
    MakeDraggable();
    $(".dot[target="+id+"]").removeClass("loading");

}




function AddSoundFirst(id, name, file, gain, pan, loop){

    //console.log("making sound: "+name+" using file: "+file+" with gain "+gain);

    //SeedSound(name, file, gain, pan, loop);

    // do the pixi.js thing
    PIXI.sound.add(id, {
    url: 'audio/'+file,
    preload: true,
    loaded: function() {
        // duration can only be used once the sound is loaded
        //console.log('Duration: ', PIXI.sound.duration(sound), 'seconds');
        //console.log(name+' is loaded');
        //StartVolume(id, gain);
        StartPan(id, pan);
        StartLoop(id, loop);
        PIXI.sound._sounds[id].volume = 0;
        FadeInAudio(id, gain);
        MakeDraggable();
        $(".dot[target="+id+"]").removeClass("loading");
        }
    });

}



function FadeOutAudio (target) 
    {
    var sound = PIXI.sound._sounds[target];
    var currenttime = sound.media.context.audioContext.currentTime;
    var $index = mytracks.findIndex(x => x.id === target);
    mytracks[$index].status = 0;
    var ninth = sound.volume.toFixed(2) / 45;

    var fadeOut = setInterval(function () 
        {
        var status = mytracks[$index].status;
        sound.volume -= ninth;
        console.log(status);
        if (sound.volume <= 0) { sound.volume = 0; PIXI.sound.stop(target); console.log(PIXI.sound._sounds); clearInterval(fadeOut); };
        if ( status == 1 ) { console.log("Interrupted"); clearInterval(fadeOut); }

        }, 200);
    
    console.log(mytracks);

    }


function FadeInAudio (target, gain) 
    {
    console.log("Fading in sound '"+target+"' with gain '"+gain+"'");
    var sound = PIXI.sound._sounds[target];
    var currenttime = sound.media.context.audioContext.currentTime;
    var $index = mytracks.findIndex(x => x.id === target);
    mytracks[$index].status = 1;
    var ninth = gain.toFixed(2) / 45;
    
    PIXI.sound.play(target);

    var fadeAudio = setInterval(function () 
        {
        var status = mytracks[$index].status;
        sound.volume += ninth;
        console.log(sound.volume);
        if (sound.volume > gain) { sound.volume = gain; PIXI.sound.play(target); console.log(PIXI.sound._sounds); clearInterval(fadeAudio); };
        if ( status == 0 ) { console.log("Interrupted"); clearInterval(fadeAudio); }
        }, 200);
    
    console.log(mytracks);

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
        $(".dot[target="+target+"]").find(".loop-button").addClass("on");
        }

}

// KILL SOUND FUNCTION

function KillSound(id){
    //console.log("Killing track: "+name);
    $data = {"room":$room, "id":id };
    socket.emit("removesound", $data);
}

socket.on("soundscrubbed", function(id){

    FadeOutAudio(id);
    $(".dot[target="+id+"]").fadeOut(600, function() { $(this).remove(); });


    setTimeout(function(){

        //console.log("Scrubbing sound "+name);
    PIXI.sound.remove(id);
    var $index = mytracks.findIndex(x => x.id === id);
    mytracks.splice($index, 1);
    //mytracks[$index].status = 0;
    // remove from local preset library
    // update current preset
    var $presetindex = presets.findIndex(x => x.id === $currentpreset);
    var $presetitem = presets[$presetindex].library.findIndex(x => x.id === id);
    //console.log($presetitem);
    presets[$presetindex].library.splice($presetitem, 1);
    //console.log(presets);

    }, 10000);

 
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

    console.log(data);

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
        $element = '<li class="sound-item noselect" id="'+item.id+'" target="'+item.id+'" name="'+item.name+'" file="'+item.file+'" icon="'+item.icon+'">'+item.name+'</li>'; 
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
    
    var $data = {"room":$room, "id": target, "gain":gain, "preset":$currentpreset };
    socket.emit("volume", $data);

}

socket.on("changevolume", function(data){ 

    var it = PIXI.sound._sounds[data.id];
    if ( data.gain == 0 ) 
        { 
        $(".dot[target="+data.id+"]").addClass("faded");
        }
    else
        { 
        $(".dot[target="+data.id+"]").removeClass("faded");
        };

    //console.log(data.gain);

    it.volume = data.gain;

});



// LOOP BUTTON

$(document).on("click", ".loop-button", function(e){
    e.preventDefault;
    $(this).toggleClass("on");
    var sound = $(this).parent().attr("target");
    console.log(sound);
    if ( $(this).hasClass("on") )
        {
        Loop(sound, true) 
        }
    else 
        {
        Loop(sound, false)
        }
        return false;
});

$(document).on("touchstart", ".loop-button", function(e){
    e.preventDefault;
    $(this).toggleClass("on");
    var sound = $(this).parent().attr("target");
    console.log(sound);
    if ( $(this).hasClass("on") )
        {
        Loop(sound, true) 
        }
    else 
        {
        Loop(sound, false)
        }
        return false;
});




// SET LOOP

function Loop(id, toggle){
    var $data = {"room":$room, "id": id, "loop":toggle };
    socket.emit("seedloop", $data);
}

socket.on("feedloop", function(data){
    var it = PIXI.sound._sounds[data.id];
    it.loop = data.loop;
});






// PLAY BUTTON

$(document).on("click", ".play-button", function(e){
    e.preventDefault;
    $(this).toggleClass("on");
    var thesound = $(this).parent().attr("target");
    if ( $(this).hasClass("on") )
        {
            $data = {"room":$room, "sound":thesound };
            socket.emit("unpausesound", $data);
                }
    else 
        {
            $data = {"room":$room, "sound":thesound };
            socket.emit("pausesound", $data);
                }
        return false;
});

$(document).on("touchstart", ".play-button", function(e){
    e.preventDefault;
    $(this).toggleClass("on");
    var thesound = $(this).parent().attr("target");
    if ( $(this).hasClass("on") )
        {
        $data = {"room":$room, "sound":thesound };
        socket.emit("unpausesound", $data);
        }
    else 
        {
        $data = {"room":$room, "sound":thesound };
        socket.emit("pausesound", $data);
        }
        return false;
});


socket.on("feedunpause", function(data){
    PIXI.sound.resume(data.sound);
});

socket.on("feedpause", function(data){
    PIXI.sound.pause(data.sound);
});

// PAN FUNCTION

function ChangePan(target, pan){
    var $data = {"room":$room, "id": target, "pan":pan, "preset":$currentpreset };
    //console.log($data);
    socket.emit("pan", $data);
    
}

socket.on("changepan", function(data){
    var it = PIXI.sound._sounds[data.id];
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
    PIXI.sound.pause(data.target);
    PIXI.sound._sounds[data.target].media.context.audioContext.currentTime = data.current;
    PIXI.sound.resume(data.target);
    $(".dot[target="+data.target+"]").find(".play-button").addClass("on");
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
    socket.emit("downloadbackground", $data);
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
    var id = $(this).attr("target");
    var name = $(this).attr("name");
    var file = $(this).attr("file");
    var icon = $(this).attr("icon");
    var gain = 0;
    var pan = 0;
    var loop = false;

    var array = {"id":id, "name":name, "file":file, "gain":gain, "pan":pan, "icon":icon, "loop":loop};

    if ( $(this).hasClass("selected") ) { BuildTracks(array); }
    else { KillSound(id); }
    
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



//SEED NEW SOUND TO SERVER         
function SeedSound(id, name, file, gain, pan, loop) {
    console.log("Sending sound out to players");
    $data = {"room":$room, "id":id, "name":name, "file":file, 'gain':gain, 'pan':pan, 'loop':loop};
    console.log($data);
    socket.emit("seedsound", $data);
}




// SUMMON PRESET

function SeedPresetSound(id, name, file, gain, pan, icon, loop){
    $data = {"room":$room, "id":id, "name":name, "file":file, "icon":icon, 'gain':gain, 'pan':pan, 'loop':loop};
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




