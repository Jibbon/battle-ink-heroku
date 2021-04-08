// ARTSTATION STUFF

function GenerateArtstationBackground()
    {
    $.ajax({
        url: "https://cors-anywhere.herokuapp.com/https://www.artstation.com/random_project.json?keyword=mountains",
        contentType: "json",
        success: function(data) 
            {
            console.log(data);
            $image = data.cover.medium_image_url;
            UpdatePoster($image);
            //var $artistlink = '<a href="'+data.user.permalink+'">'+data.user.full_name+'</a>'; 
            //$("#artist-name").html($artistlink);
            //$("#work-title").html(data.title);
            }
    });
    }    
    
function UpdatePoster(img){
    
    $("#artstation").css("background-image", "url("+img+")").attr("url",img);

    //$("#poster").css("background-image","url("+img+")");
    
}   