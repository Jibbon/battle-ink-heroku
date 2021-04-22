
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
    //socket.emit('getpresets', $room);
    socket.emit("getbackground", $room);
    //socket.emit("wipetracklist", $room);
    socket.emit('getcurrentpreset', $room);
});


socket.on("wipetracks", function(){
    //console.log("wiping the track list clean...");
    //mytracks = [];
    $(".sound-item").removeClass('selected');
    $(".dot").fadeOut(3000, function() { $(this).remove(); });

    $.each(mytracks, function(index, item){
        FadeOutAudioNew(item.id);
    });

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
    socket.emit("cleartracks", $room);
    MakeTracks(data.library);
    $("#title-text-frame").html(data.title);
});


socket.on("feedcurrentpresetstart", function(data){
    console.log("Building audio tracks for current preset at launch");
    $currentpreset = data.preset;
    //BuildTracksNew(data.library);
    MakeTracks(data.library);
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




function MakeTracks(library){

    $.each(library, function(index, item){

        MakeTrack(item);

    });

}



function MakeTrack(item){
    console.log("Adding "+item.id+" to the canvas");
        
        r = new Date().getTime();

        var $data = {"room":$room, "code":r, "id":item.id, "name":item.name, "file":item.file, "gain":item.gain, "pan":item.pan, "loop":item.loop, "icon":item.icon};
        
        socket.emit("seedsound", $data);
}











function ExistingInLibrary(file){

// Find if the array contains an object by comparing the property value
if(mylibrary.some(track => track.file === file))
    {
    return true;
    } 
    else { return false; }
}









 
    socket.on("clearexisting", function(){
        console.log("Wiping the slate");
        $.each(mytracks, function(index, item)
        {
        FadeOutAudioNew(item.code);
        });
    });


    function FadeOutAudioNew (target) 
        {
        console.log("Fading out track "+target);

        $(".dot[target="+target+"]").fadeOut(5000, function() { $(this).remove(); });

        var $index = mytracks.findIndex(x => x.code === target );
        var sound = mytracks[$index].audio;
        var volume = sound.volume();

        sound.fade(volume, 0, 5000);    

        setTimeout(function(){ sound.unload(); DeleteTrack(target); }, 5000);

        }



function DeleteTrack(target)
    {
    console.log("Deleting track with code: "+target);
    var $index = mytracks.findIndex(x => x.code === target);
    mytracks.splice($index, 1);
    console.log(mytracks);
    }




    function FadeInAudioNew (code) 
        {
        console.log("fading in audio track: "+code);

        var $index = mytracks.findIndex(x => x.code === code );
        var gain = mytracks[$index].gain;
        var sound = mytracks[$index].audio;

        sound.play();
        sound.fade(0, gain, 10000);

        }


    









// KILL SOUND FUNCTION

function KillSound(id){
    //console.log("Killing track: "+name);
    var code = $("#"+id).attr("code");
    $data = {"room":$room, "code":code };
    socket.emit("removesound", $data);
}

socket.on("soundscrubbed", function(code){

    FadeOutAudioNew(code);

 
});



// TOOLS

$(document).on("click", "#tool-drawer-handle", function(){
    $("#tool-drawer").toggleClass("open");
    $(".drawer").removeClass("open");
    $(".tool-handle").removeClass("on");
});







function MakeDraggable() {

$('.draggable').dragon({ 
    
    within: $('#arena'),

      dragStart: function() 
        { 
        var Yposition = $(this).position().top;
        var Xposition = $(this).position().left;

        //console.log(Yposition+':'+Xposition);
        },
      drag: function() 
        {
        var halfscreen = $('#arena').width() / 2;
        var actualX = $(this).position().left + ( $(this).width() / 2 );
        var Xposition = actualX - halfscreen;
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


        var code = $(this).attr("target");
        var id = $(this).attr("id");


        ChangePan(code, id, Xpan);


        var Yposition = $('#arena').height() - $(this).position().top;
        var Ypercent = ($('#arena').height() / 100).toFixed(0);
        
        var Y = (Yposition / Ypercent).toFixed(0);
        var Ypan = (Y / 1000)*1;
        if (Ypan < 0 ) { Ypan = 0 };

        //console.log(Ypan);
        ChangeGain(code, id, Ypan);
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

function ChangeGain(code, id, gain){
    
    var $data = {"room":$room, "code":code, "id": id, "gain":gain, "preset":$currentpreset };
    socket.emit("volume", $data);

}

socket.on("changevolume", function(data){ 

    var index = parseInt(data.code);
    var $index = mytracks.findIndex(x => x.code === index);
    var sound = mytracks[$index].audio;
    console.log(sound);

    if ( data.gain == 0 ) 
        { 
        $(".dot[target="+data.id+"]").addClass("faded");
        }
    else
        { 
        $(".dot[target="+data.id+"]").removeClass("faded");
        };

    //console.log(data.gain);

    sound.volume(data.gain);

});



// LOOP BUTTON

$(document).on("click", ".loop-button", function(e){
    e.preventDefault;
    $(this).toggleClass("true");
    var code = $(this).parent().attr("target");
    var id = $(this).parent().attr("id");

    if ( $(this).hasClass("true") )
        {
        Loop(code, id, true) 
        }
    else 
        {
        Loop(code, id, false)
        }
        return false;
});

$(document).on("touchstart", ".loop-button", function(e){
    e.preventDefault;
    $(this).toggleClass("true");
    var sound = $(this).parent().attr("target");
    console.log(sound);
    if ( $(this).hasClass("true") )
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

function Loop(code, id, toggle){
    var $data = {"room":$room, "code":code, "id": id, "loop":toggle };
    socket.emit("seedloop", $data);
}

socket.on("feedloop", function(data){
    
    var index = parseInt(data.code);
    var $index = mytracks.findIndex(x => x.code === index);
    sound = mytracks[$index].audio;
    sound.loop(data.loop);
    console.log(sound);


});






// PLAY BUTTON

$(document).on("click", ".play-button", function(e){
    e.preventDefault;
    $(this).toggleClass("on");
    var code = $(this).parent().attr("target");
    var id = $(this).parent().attr("id");

    $data = {"room":$room, "code":code, "id":id };

    if ( $(this).hasClass("on") )
        {
            socket.emit("unpausesound", $data);
                }
    else 
        {
            socket.emit("pausesound", $data);
                }
        return false;
});

$(document).on("touchstart", ".play-button", function(e){
    e.preventDefault;
    $(this).toggleClass("on");
    var code = $(this).parent().attr("target");
    var id = $(this).parent().attr("id");

    $data = {"room":$room, "code":code, "id":id };

    if ( $(this).hasClass("on") )
        {
        socket.emit("unpausesound", $data);
        }
    else 
        {
        socket.emit("pausesound", $data);
        }
        return false;
});


socket.on("feedunpause", function(data){
    var index = parseInt(data.code);
    var $index = mytracks.findIndex(x => x.code === index);
    var sound = mytracks[$index].audio;
    sound.play();
});

socket.on("feedpause", function(data){
    var index = parseInt(data.code);
    var $index = mytracks.findIndex(x => x.code === index);
    var sound = mytracks[$index].audio;
    sound.pause();
});

// PAN FUNCTION

function ChangePan(code, id, pan){
    var $data = {"room":$room, "code":code, "id":id, "pan":pan, "preset":$currentpreset };
    //console.log($data);
    socket.emit("pan", $data);
    
}

socket.on("changepan", function(data){
    var index = parseInt(data.code);
    var $index = mytracks.findIndex(x => x.code === index);
    sound = mytracks[$index].audio;
    sound.stereo(data.pan);
    console.log(sound);

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

    array = {"id":id, "name":name, "file":file, "icon":icon, "gain":gain, "pan":pan, "loop":loop };

    if ( $(this).hasClass("selected") ) 
        { 
        MakeTrack(array);  
        }
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
socket.on("feedsound", function(data) {

    console.log("Receiving a new sound from the server...");
    console.log(data);

    var sound = new Howl({
        src: ['audio/'+data.file],
        volume: 0,
        stereo: data.pan,
        loop:data.loop
      });

    $new = {'code':data.code, 'id':data.id, 'name':data.name, 'file':data.file, "gain":data.gain, "pan":data.pan, "icon":data.icon, "loop":data.loop, "audio":sound };
    mytracks.push($new);
    console.log(mytracks);

    // toggle the sound item in drawer
    $(".sound-item[target="+r+"]").addClass("selected");
    
    // generate the dot element    
    var x = GetX(data.pan);
    var y = GetY(data.gain);

    var $element = "<div target='"+data.code+"' id='"+data.id+"' file='"+data.file+"' gain='"+data.gain+"' loop='"+data.loop+"' style='left:"+x+"px; top:"+y+"px' class='draggable dot loading noselect'><div class='sound-button play-button on'></div><div class='trackname'>"+data.name+"</div><div class='sound-button loop-button "+data.loop+"'></div></div>";
    $("#arena").append($element);
    MakeDraggable();

    // Adjust Pan Position
    var newX = x - ( $("#"+data.id).width() / 2);
    $("#"+data.id).css("left",newX+"px");


    $index = mytracks.findIndex(x => x.code === data.code);
    var thecode = mytracks[$index].code;
    
    mytracks[$index].audio.once('load', function()
        {
        $(".dot[target="+thecode+"]").removeClass("loading");
        FadeInAudioNew(thecode);
        });


});




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




