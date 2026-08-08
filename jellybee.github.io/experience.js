(function () {
    "use strict";

    const VideoOverlay = document.querySelector( "[data-video-overlay]" );
    const VideoOverlayPlayer = document.querySelector( "[data-video-overlay-player]" );
    const VideoOverlayClose = document.querySelector( "[data-video-close]" );
    const VideoPanels = document.querySelectorAll( "[data-video-fullscreen]" );
    const InlineVideos = document.querySelectorAll( ".hero-video-panel video" );
    const ReducedMotion = window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches;
    let LastVideoPanel = null;
    let OverlayRequestedFullscreen = false;

    function CloseVideo()
    {
        if ( !VideoOverlay || !VideoOverlayPlayer || VideoOverlay.hidden )
        {
            return;
        }

        VideoOverlayPlayer.pause();
        VideoOverlayPlayer.removeAttribute( "src" );
        VideoOverlayPlayer.load();
        VideoOverlay.hidden = true;
        document.body.classList.remove( "video-fullscreen-open" );

        if ( document.fullscreenElement === VideoOverlay && document.exitFullscreen )
        {
            document.exitFullscreen().catch( function () {} );
        }

        if ( LastVideoPanel )
        {
            LastVideoPanel.focus();
        }
    }

    function OpenVideo( Panel )
    {
        const SourceVideo = Panel.querySelector( "video" );
        if ( !VideoOverlay || !VideoOverlayPlayer || !SourceVideo )
        {
            return;
        }

        LastVideoPanel = Panel;
        VideoOverlayPlayer.src = SourceVideo.currentSrc || SourceVideo.getAttribute( "src" );
        try
        {
            VideoOverlayPlayer.currentTime = SourceVideo.currentTime || 0;
        }
        catch ( Error )
        {
            // Metadata may not be ready yet.
        }

        VideoOverlay.hidden = false;
        document.body.classList.add( "video-fullscreen-open" );
        VideoOverlayPlayer.focus();
        VideoOverlayPlayer.play().catch( function () {} );

        if ( VideoOverlay.requestFullscreen )
        {
            OverlayRequestedFullscreen = true;
            VideoOverlay.requestFullscreen().catch( function () {
                OverlayRequestedFullscreen = false;
            } );
        }
    }

    VideoPanels.forEach( function ( Panel ) {
        Panel.addEventListener( "click", function () {
            OpenVideo( Panel );
        } );

        Panel.addEventListener( "keydown", function ( Event ) {
            if ( Event.key === "Enter" || Event.key === " " )
            {
                Event.preventDefault();
                OpenVideo( Panel );
            }
        } );
    } );

    if ( "IntersectionObserver" in window )
    {
        const VideoObserver = new IntersectionObserver( function ( Entries ) {
            Entries.forEach( function ( Entry ) {
                if ( Entry.isIntersecting && !ReducedMotion )
                {
                    Entry.target.play().catch( function () {} );
                }
                else
                {
                    Entry.target.pause();
                }
            } );
        }, { rootMargin: "160px 0px", threshold: 0.05 } );

        InlineVideos.forEach( function ( Video ) {
            VideoObserver.observe( Video );
        } );
    }
    else if ( ReducedMotion )
    {
        InlineVideos.forEach( function ( Video ) {
            Video.pause();
        } );
    }

    if ( VideoOverlay )
    {
        VideoOverlay.addEventListener( "click", function ( Event ) {
            if ( Event.target === VideoOverlay )
            {
                CloseVideo();
            }
        } );
    }

    if ( VideoOverlayClose )
    {
        VideoOverlayClose.addEventListener( "click", CloseVideo );
    }

    document.addEventListener( "keydown", function ( Event ) {
        if ( Event.key === "Escape" )
        {
            CloseVideo();
        }
    } );

    document.addEventListener( "fullscreenchange", function () {
        if ( OverlayRequestedFullscreen && !document.fullscreenElement && VideoOverlay && !VideoOverlay.hidden )
        {
            OverlayRequestedFullscreen = false;
            CloseVideo();
        }
    } );
}());
