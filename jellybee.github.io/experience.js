( function()
{
    "use strict";

    const Carousels              = document.querySelectorAll( "[data-controlcenter-carousel]" );
    const Debuggers              = document.querySelectorAll( "[data-debugger]" );
    const Overlay                = document.querySelector( "[data-controlcenter-overlay]" );
    const OverlayImage           = document.querySelector( "[data-controlcenter-overlay-image]" );
    const OverlayClose           = document.querySelector( "[data-controlcenter-overlay-close]" );
    const ReducedMotion          = window.matchMedia( "(prefers-reduced-motion: reduce)" );
    let   LastImageTrigger       = null;

    function initDebugger( Debugger )
    {
        const Phases =
        [
            {
                Line:       5,
                Location:   "Ln 18 · Col 5",
                State:      "BREAKPOINT",
                Clock:      "+000.000 ms",
                Thread:     "THREAD 0x16C8",
                Event:      0,
                Registers:
                {
                    rip:    "00007FF6`14001000",
                    rsp:    "000000D4`4A6FF7A0",
                    rcx:    "000001F3`8C220000",
                    r15:    "00000000`00000000"
                },
                Frames:
                [
                    "pinit + 0x00",
                    "JellyBee!dispatch + 0x62",
                    "ntdll!RtlUserThreadStart + 0x21"
                ],
                Memory:     "48 8B C4 48 89 58 08 57 48 83 EC 20"
            },
            {
                Line:       7,
                Location:   "Ln 20 · Col 5",
                State:      "CONTEXT_BIND",
                Clock:      "+000.184 ms",
                Thread:     "THREAD 0x16C8",
                Event:      1,
                Registers:
                {
                    rip:    "00007FF6`1400102A",
                    rsp:    "000000D4`4A6FF770",
                    rcx:    "000001F3`8C220000",
                    r15:    "000001F3`8C220000"
                },
                Frames:
                [
                    "jbContextBind + 0x09",
                    "pinit + 0x2A",
                    "JellyBee!dispatch + 0x62"
                ],
                Memory:     "4C 8B F9 4D 85 FF 74 2A 49 8B 47 08"
            },
            {
                Line:       8,
                Location:   "Ln 21 · Col 5",
                State:      "API_RESOLVE",
                Clock:      "+000.426 ms",
                Thread:     "THREAD 0x16C8",
                Event:      2,
                Registers:
                {
                    rip:    "00007FF6`14001390",
                    rsp:    "000000D4`4A6FF6F0",
                    rcx:    "000001F3`8C240000",
                    r15:    "000001F3`8C220000"
                },
                Frames:
                [
                    "jbModuleResolve + 0x31",
                    "pinit + 0x48",
                    "JellyBee!dispatch + 0x62"
                ],
                Memory:     "65 48 8B 04 25 60 00 00 00 48 8B 40"
            },
            {
                Line:       9,
                Location:   "Ln 22 · Col 5",
                State:      "MODULE_RUN",
                Clock:      "+000.912 ms",
                Thread:     "THREAD 0x16C8",
                Event:      3,
                Registers:
                {
                    rip:    "00007FF6`14001842",
                    rsp:    "000000D4`4A6FF720",
                    rcx:    "000001F3`8C220000",
                    r15:    "000001F3`8C220000"
                },
                Frames:
                [
                    "jbCapabilityRun + 0x42",
                    "pinit + 0x52",
                    "JellyBee!dispatch + 0x62"
                ],
                Memory:     "48 83 EC 28 4C 8B C9 49 8B 51 10 FF"
            },
            {
                Line:       10,
                Location:   "Ln 23 · Col 5",
                State:      "MATRIX_WRITE",
                Clock:      "+001.337 ms",
                Thread:     "THREAD 0x16C8",
                Event:      4,
                Registers:
                {
                    rip:    "00007FF6`14001C10",
                    rsp:    "000000D4`4A6FF730",
                    rcx:    "000001F3`8C220030",
                    r15:    "000001F3`8C220000"
                },
                Frames:
                [
                    "jbMatrixFlush + 0x18",
                    "pinit + 0x61",
                    "JellyBee!dispatch + 0x62"
                ],
                Memory:     "14 E0 E2 EF 03 00 00 00 44 00 43 00"
            },
            {
                Line:       11,
                Location:   "Ln 24 · Col 1",
                State:      "RETURN",
                Clock:      "+001.608 ms",
                Thread:     "THREAD 0x16C8",
                Event:      5,
                Registers:
                {
                    rip:    "00007FF6`14001068",
                    rsp:    "000000D4`4A6FF7A0",
                    rcx:    "00000000`00000000",
                    r15:    "000001F3`8C220000"
                },
                Frames:
                [
                    "pinit + 0x68",
                    "JellyBee!dispatch + 0x62",
                    "ntdll!RtlUserThreadStart + 0x21"
                ],
                Memory:     "48 83 C4 20 5F C3 CC CC CC CC CC CC"
            }
        ];
        const Lines             = Array.from( Debugger.querySelectorAll( "[data-debugger-line]" ) );
        const Events            = Array.from( Debugger.querySelectorAll( "[data-debugger-event]" ) );
        const Frames            = Array.from( Debugger.querySelectorAll( "[data-debugger-frame]" ) );
        const Location          = Debugger.querySelector( "[data-debugger-location]" );
        const State             = Debugger.querySelector( "[data-debugger-state]" );
        const Clock             = Debugger.querySelector( "[data-debugger-clock]" );
        const Thread            = Debugger.querySelector( "[data-debugger-thread]" );
        const Memory            = Debugger.querySelector( "[data-debugger-memory]" );
        const Progress          = Debugger.querySelector( "[data-debugger-progress]" );
        const Toggle            = Debugger.querySelector( "[data-debugger-toggle]" );
        const ToggleIcon        = Debugger.querySelector( "[data-debugger-toggle-icon]" );
        const ToggleLabel       = Debugger.querySelector( "[data-debugger-toggle-label]" );
        const Step              = Debugger.querySelector( "[data-debugger-step]" );
        const RegisterNodes     = {};
        let   PhaseIndex        = 0;
        let   IntervalId        = null;
        let   TickClassId       = null;
        let   IsVisible         = !( "IntersectionObserver" in window );
        let   IsPaused          = ReducedMotion.matches;

        Debugger.querySelectorAll( "[data-debugger-register]" ).forEach( function( Node )
        {
            RegisterNodes[Node.getAttribute( "data-debugger-register" )] = Node;
        } );

        function renderPhase()
        {
            const Phase = Phases[PhaseIndex];

            Lines.forEach( function( Line )
            {
                const IsCurrent = Number( Line.getAttribute( "data-debugger-line" ) ) === Phase.Line;

                Line.classList.toggle( "is-current", IsCurrent );

                if ( IsCurrent )
                {
                    Line.setAttribute( "aria-current", "step" );
                }
                else
                {
                    Line.removeAttribute( "aria-current" );
                }
            } );

            Events.forEach( function( EventNode, EventIndex )
            {
                const IsActive = EventIndex === Phase.Event;

                EventNode.classList.toggle( "is-active", IsActive );
                EventNode.classList.toggle( "is-complete", EventIndex < Phase.Event );

                if ( IsActive )
                {
                    EventNode.setAttribute( "aria-current", "step" );
                }
                else
                {
                    EventNode.removeAttribute( "aria-current" );
                }
            } );

            Object.keys( Phase.Registers ).forEach( function( RegisterName )
            {
                if ( RegisterNodes[RegisterName] )
                {
                    RegisterNodes[RegisterName].textContent = Phase.Registers[RegisterName];
                }
            } );

            Frames.forEach( function( Frame, FrameIndex )
            {
                Frame.textContent = Phase.Frames[FrameIndex] || "";
            } );

            if ( Location ) Location.textContent = Phase.Location;
            if ( State ) State.textContent = Phase.State;
            if ( Clock ) Clock.textContent = Phase.Clock;
            if ( Thread ) Thread.textContent = Phase.Thread;
            if ( Memory ) Memory.textContent = Phase.Memory;

            if ( Progress )
            {
                Progress.value = Phase.Event + 1;
                Progress.textContent = String( Phase.Event + 1 ) + " / " + String( Phases.length );
            }

            Debugger.classList.remove( "is-ticking" );
            void Debugger.offsetWidth;
            Debugger.classList.add( "is-ticking" );

            if ( TickClassId !== null )
            {
                window.clearTimeout( TickClassId );
            }

            TickClassId = window.setTimeout( function()
            {
                Debugger.classList.remove( "is-ticking" );
                TickClassId = null;
            }, 360 );
        }

        function advancePhase()
        {
            PhaseIndex = ( PhaseIndex + 1 ) % Phases.length;
            renderPhase();
        }

        function stopDebugger()
        {
            if ( IntervalId !== null )
            {
                window.clearInterval( IntervalId );
                IntervalId = null;
            }
        }

        function startDebugger()
        {
            if ( IsPaused || !IsVisible || document.hidden || IntervalId !== null )
            {
                return;
            }

            IntervalId = window.setInterval( advancePhase, 1600 );
        }

        function syncDebuggerControls()
        {
            Debugger.classList.toggle( "is-paused", IsPaused );

            if ( Toggle )
            {
                Toggle.setAttribute( "aria-pressed", String( IsPaused ) );
            }

            if ( ToggleIcon ) ToggleIcon.textContent = IsPaused ? "▶" : "Ⅱ";
            if ( ToggleLabel ) ToggleLabel.textContent = IsPaused ? "Run" : "Pause";
        }

        function setPaused( NewPaused )
        {
            IsPaused = NewPaused;
            syncDebuggerControls();

            if ( IsPaused )
            {
                stopDebugger();
            }
            else
            {
                startDebugger();
            }
        }

        if ( Toggle )
        {
            Toggle.addEventListener( "click", function()
            {
                setPaused( !IsPaused );
            } );
        }

        if ( Step )
        {
            Step.addEventListener( "click", function()
            {
                setPaused( true );
                advancePhase();
            } );
        }

        if ( "IntersectionObserver" in window )
        {
            const Observer = new IntersectionObserver( function( Entries )
            {
                IsVisible = Entries.some( function( Entry )
                {
                    return Entry.isIntersecting;
                } );

                if ( IsVisible ) startDebugger();
                else stopDebugger();
            }, { rootMargin: "120px 0px", threshold: 0.08 } );

            Observer.observe( Debugger );
        }

        document.addEventListener( "visibilitychange", function()
        {
            if ( document.hidden ) stopDebugger();
            else startDebugger();
        } );

        if ( ReducedMotion.addEventListener )
        {
            ReducedMotion.addEventListener( "change", function( Event )
            {
                if ( Event.matches )
                {
                    setPaused( true );
                }
            } );
        }

        renderPhase();
        syncDebuggerControls();
        startDebugger();
    }

    function closeControlCenterImage()
    {
        if ( !Overlay || Overlay.hidden )
        {
            return;
        }

        Overlay.hidden = true;
        document.body.classList.remove( "controlcenter-fullscreen-open" );

        if ( LastImageTrigger )
        {
            LastImageTrigger.focus();
        }
    }

    function openControlCenterImage( Slide, Trigger )
    {
        if ( !Overlay || !OverlayImage || !Slide )
        {
            return;
        }

        LastImageTrigger       = Trigger;
        OverlayImage.src       = Slide.currentSrc || Slide.getAttribute( "src" );
        OverlayImage.alt       = Slide.alt;
        Overlay.hidden         = false;

        document.body.classList.add( "controlcenter-fullscreen-open" );

        if ( OverlayClose )
        {
            OverlayClose.focus();
        }
    }

    function initControlCenterCarousel( Carousel )
    {
        const Card            = Carousel.closest( ".environment-card" ) || Carousel.parentElement;
        const Slides          = Array.from( Carousel.querySelectorAll( "[data-controlcenter-slide]" ) );
        const Dots            = Card ? Array.from( Card.querySelectorAll( "[data-controlcenter-dot]" ) ) : [];
        const Previous        = Carousel.querySelector( "[data-controlcenter-previous]" );
        const Next            = Carousel.querySelector( "[data-controlcenter-next]" );
        const Current         = Carousel.querySelector( "[data-controlcenter-current]" );
        const Expand          = Carousel.querySelector( "[data-controlcenter-expand]" );
        const Title           = Card ? Card.querySelector( "[data-controlcenter-title]" ) : null;
        const Description     = Card ? Card.querySelector( "[data-controlcenter-description]" ) : null;
        let   Index           = 0;

        if ( !Slides.length || !Previous || !Next )
        {
            return;
        }

        function showSlide( NewIndex )
        {
            const ActiveSlide = Slides[( NewIndex + Slides.length ) % Slides.length];

            Index = Slides.indexOf( ActiveSlide );

            Slides.forEach( function( Slide, SlideIndex )
            {
                const IsActive = SlideIndex === Index;

                Slide.hidden = !IsActive;
                Slide.setAttribute( "aria-hidden", String( !IsActive ) );
            } );

            Dots.forEach( function( Dot, DotIndex )
            {
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

            if ( Title )
            {
                Title.textContent = ActiveSlide.dataset.slideTitle || ActiveSlide.alt;
            }

            if ( Description )
            {
                Description.textContent = ActiveSlide.dataset.slideDescription || "";
            }
        }

        Previous.addEventListener( "click", function()
        {
            showSlide( Index - 1 );
        } );

        Next.addEventListener( "click", function()
        {
            showSlide( Index + 1 );
        } );

        Dots.forEach( function( Dot, DotIndex )
        {
            Dot.addEventListener( "click", function()
            {
                showSlide( DotIndex );
            } );
        } );

        Slides.forEach( function( Slide )
        {
            Slide.addEventListener( "click", function()
            {
                openControlCenterImage( Slides[Index], Carousel );
            } );
        } );

        if ( Expand )
        {
            Expand.addEventListener( "click", function()
            {
                openControlCenterImage( Slides[Index], Expand );
            } );
        }

        Carousel.addEventListener( "keydown", function( Event )
        {
            if ( Event.key === "ArrowLeft" || Event.key === "ArrowRight" )
            {
                Event.preventDefault();
                showSlide( Index + ( Event.key === "ArrowLeft" ? -1 : 1 ) );
            }
            else if ( Event.key === "Home" || Event.key === "End" )
            {
                Event.preventDefault();
                showSlide( Event.key === "Home" ? 0 : Slides.length - 1 );
            }
            else if ( Event.target === Carousel && ( Event.key === "Enter" || Event.key === " " ) )
            {
                Event.preventDefault();
                openControlCenterImage( Slides[Index], Carousel );
            }
        } );

        showSlide( 0 );
    }

    Debuggers.forEach( initDebugger );
    Carousels.forEach( initControlCenterCarousel );

    if ( Overlay )
    {
        Overlay.addEventListener( "click", function( Event )
        {
            if ( Event.target === Overlay || Event.target.classList.contains( "controlcenter-fullscreen-figure" ) )
            {
                closeControlCenterImage();
            }
        } );
    }

    if ( OverlayClose )
    {
        OverlayClose.addEventListener( "click", closeControlCenterImage );
    }

    document.addEventListener( "keydown", function( Event )
    {
        if ( Event.key === "Escape" )
        {
            closeControlCenterImage();
        }
        else if ( Event.key === "Tab" && Overlay && !Overlay.hidden && OverlayClose )
        {
            Event.preventDefault();
            OverlayClose.focus();
        }
    } );
} )();
