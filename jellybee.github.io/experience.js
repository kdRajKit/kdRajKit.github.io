(function () {
    "use strict";

    const VideoOverlay = document.querySelector( "[data-video-overlay]" );
    const VideoOverlayPlayer = document.querySelector( "[data-video-overlay-player]" );
    const VideoOverlayClose = document.querySelector( "[data-video-close]" );
    const VideoPanels = document.querySelectorAll( "[data-video-fullscreen]" );
    const InlineVideos = document.querySelectorAll( ".hero-video-panel video" );
    const ControlCenterCarousels = document.querySelectorAll( "[data-controlcenter-carousel]" );
    const ControlCenterOverlay = document.querySelector( "[data-controlcenter-overlay]" );
    const ControlCenterOverlayImage = document.querySelector( "[data-controlcenter-overlay-image]" );
    const ControlCenterOverlayClose = document.querySelector( "[data-controlcenter-overlay-close]" );
    const ReducedMotion = window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches;
    let LastVideoPanel = null;
    let LastImageTrigger = null;
    let OverlayRequestedFullscreen = false;

    function CloseControlCenterImage()
    {
        if ( !ControlCenterOverlay || ControlCenterOverlay.hidden )
        {
            return;
        }

        ControlCenterOverlay.hidden = true;
        document.body.classList.remove( "controlcenter-fullscreen-open" );

        if ( LastImageTrigger )
        {
            LastImageTrigger.focus();
        }
    }

    function OpenControlCenterImage( Slide, Trigger )
    {
        if ( !ControlCenterOverlay || !ControlCenterOverlayImage || !Slide )
        {
            return;
        }

        LastImageTrigger = Trigger;
        ControlCenterOverlayImage.src = Slide.currentSrc || Slide.getAttribute( "src" );
        ControlCenterOverlayImage.alt = Slide.alt;

        ControlCenterOverlay.hidden = false;
        document.body.classList.add( "controlcenter-fullscreen-open" );

        if ( ControlCenterOverlayClose )
        {
            ControlCenterOverlayClose.focus();
        }
    }

    function InitControlCenterCarousel( Carousel )
    {
        const Slides = Array.from( Carousel.querySelectorAll( "[data-controlcenter-slide]" ) );
        const Dots = Array.from( Carousel.querySelectorAll( "[data-controlcenter-dot]" ) );
        const Previous = Carousel.querySelector( "[data-controlcenter-previous]" );
        const Next = Carousel.querySelector( "[data-controlcenter-next]" );
        const Current = Carousel.querySelector( "[data-controlcenter-current]" );
        const Expand = Carousel.querySelector( "[data-controlcenter-expand]" );
        let Index = 0;

        if ( !Slides.length || !Previous || !Next )
        {
            return;
        }

        function ShowSlide( NewIndex )
        {
            Index = ( NewIndex + Slides.length ) % Slides.length;

            Slides.forEach( function ( Slide, SlideIndex ) {
                Slide.hidden = SlideIndex !== Index;
            } );

            Dots.forEach( function ( Dot, DotIndex ) {
                if ( DotIndex === Index )
                {
                    Dot.setAttribute( "aria-current", "true" );
                }
                else
                {
                    Dot.removeAttribute( "aria-current" );
                }
            } );

            if ( Current )
            {
                Current.textContent = String( Index + 1 );
            }

        }

        Previous.addEventListener( "click", function () {
            ShowSlide( Index - 1 );
        } );

        Next.addEventListener( "click", function () {
            ShowSlide( Index + 1 );
        } );

        Dots.forEach( function ( Dot, DotIndex ) {
            Dot.addEventListener( "click", function () {
                ShowSlide( DotIndex );
            } );
        } );

        Slides.forEach( function ( Slide ) {
            Slide.addEventListener( "click", function () {
                OpenControlCenterImage( Slides[Index], Carousel );
            } );
        } );

        if ( Expand )
        {
            Expand.addEventListener( "click", function () {
                OpenControlCenterImage( Slides[Index], Expand );
            } );
        }

        Carousel.addEventListener( "keydown", function ( Event ) {
            if ( Event.key === "ArrowLeft" || Event.key === "ArrowRight" )
            {
                Event.preventDefault();
                ShowSlide( Index + ( Event.key === "ArrowLeft" ? -1 : 1 ) );
            }
            else if ( Event.target === Carousel && ( Event.key === "Enter" || Event.key === " " ) )
            {
                Event.preventDefault();
                OpenControlCenterImage( Slides[Index], Carousel );
            }
        } );

        ShowSlide( 0 );
    }

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

    ControlCenterCarousels.forEach( InitControlCenterCarousel );

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

    if ( ControlCenterOverlay )
    {
        ControlCenterOverlay.addEventListener( "click", function ( Event ) {
            if ( Event.target === ControlCenterOverlay || Event.target.classList.contains( "controlcenter-fullscreen-figure" ) )
            {
                CloseControlCenterImage();
            }
        } );
    }

    if ( ControlCenterOverlayClose )
    {
        ControlCenterOverlayClose.addEventListener( "click", CloseControlCenterImage );
    }

    document.addEventListener( "keydown", function ( Event ) {
        if ( Event.key === "Escape" )
        {
            CloseVideo();
            CloseControlCenterImage();
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
