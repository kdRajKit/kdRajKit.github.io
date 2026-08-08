( function()
{
    var Script = document.currentScript;
    var Root = Script ? ( Script.getAttribute( "data-root" ) || "" ) : "";

    function WithRoot( Path )
    {
        if ( !Path || Path.charAt( 0 ) === "#" || /^[a-z]+:/i.test( Path ) || Path.charAt( 0 ) === "/" )
        {
            return Path;
        }

        return Root + Path;
    }

    function ResolvePaths( Scope )
    {
        Scope.querySelectorAll( "[data-href]" ).forEach( function( Node )
        {
            Node.setAttribute( "href", WithRoot( Node.getAttribute( "data-href" ) ) );
        } );

        Scope.querySelectorAll( "[data-src]" ).forEach( function( Node )
        {
            Node.setAttribute( "src", WithRoot( Node.getAttribute( "data-src" ) ) );
        } );
    }

    function MarkActiveNav( Scope )
    {
        var BodyClass = document.body.className || "";

        Scope.querySelectorAll( "[data-nav]" ).forEach( function( Link )
        {
            var NavName = Link.getAttribute( "data-nav" );
            var IsActive = BodyClass.indexOf( "page-" + NavName ) >= 0;

            if ( NavName === "menu" && document.body.classList.contains( "page-blog" ) )
            {
                IsActive = true;
            }

            Link.classList.toggle( "nav-jellybee", IsActive );
            Link.classList.toggle( "is-active", IsActive );

            if ( IsActive )
            {
                Link.setAttribute( "aria-current", "page" );
            }
            else
            {
                Link.removeAttribute( "aria-current" );
            }
        } );
    }

    function LoadPartial( Selector, Path )
    {
        var Target = document.querySelector( Selector );
        if ( !Target || !window.fetch )
        {
            return;
        }

        var CustomPath = Target.getAttribute( Selector.replace( /^\[|\]$/g, "" ) );
        var PartialPath = CustomPath || WithRoot( Path );

        fetch( PartialPath, { cache: "no-cache" } )
            .then( function( Response )
            {
                if ( !Response.ok )
                {
                    throw new Error( "Partial load failed: " + PartialPath );
                }

                return Response.text();
            } )
            .then( function( Html )
            {
                Target.insertAdjacentHTML( "afterend", Html );

                var Partial = Target.nextElementSibling;
                Target.remove();

                if ( Partial )
                {
                    ResolvePaths( Partial );
                    MarkActiveNav( Partial );
                    InitAutoHideHeader( Partial );
                }
            } )
            .catch( function( Error )
            {
                Target.setAttribute( "data-partial-error", Error.message );
            } );
    }

    function InitAutoHideHeader( Scope )
    {
        var Header = Scope.matches && Scope.matches( ".site-header" ) ? Scope : Scope.querySelector( ".site-header" );
        var LastScrollY = Math.max( window.scrollY, 0 );
        var IsScheduled = false;
        var ScrollThreshold = 8;

        if ( !Header || Header.hasAttribute( "data-auto-hide-ready" ) )
        {
            return;
        }

        Header.setAttribute( "data-auto-hide-ready", "" );

        function UpdateHeader()
        {
            var CurrentScrollY = Math.max( window.scrollY, 0 );
            var ScrollDelta = CurrentScrollY - LastScrollY;

            if ( CurrentScrollY <= 16 )
            {
                Header.classList.remove( "is-scroll-hidden" );
                LastScrollY = CurrentScrollY;
            }
            else if ( Math.abs( ScrollDelta ) >= ScrollThreshold )
            {
                Header.classList.toggle( "is-scroll-hidden", ScrollDelta > 0 );
                LastScrollY = CurrentScrollY;
            }

            IsScheduled = false;
        }

        window.addEventListener( "scroll", function()
        {
            if ( !IsScheduled )
            {
                window.requestAnimationFrame( UpdateHeader );
                IsScheduled = true;
            }
        }, { passive: true } );

        Header.addEventListener( "focusin", function()
        {
            Header.classList.remove( "is-scroll-hidden" );
            LastScrollY = Math.max( window.scrollY, 0 );
        } );
    }

    function InitBlogCodeHighlight()
    {
        var Blocks = document.querySelectorAll( "pre.paper-pre code.language-c" );

        if ( !Blocks.length )
        {
            return;
        }

        Blocks.forEach( function( Code )
        {
            if ( window.hljs )
            {
                window.hljs.highlightElement( Code );
            }

            Code.innerHTML = Code.innerHTML
                .replace( /\bjbApiResolve\b/g, '<span class="jb-internal-function">jbApiResolve</span>' )
                .replace( /\b(JB_PILL_CONTEXT_ONE|JB_MTRIX_LOG|JB_PILL_CALL)\b/g, '<span class="jb-project-type">$1</span>' );
        } );
    }

    function LoadBlogCodeHighlight()
    {
        var Blocks = document.querySelectorAll( "pre.paper-pre code.language-c" );
        var Library;

        if ( !Blocks.length )
        {
            return;
        }

        if ( window.hljs )
        {
            InitBlogCodeHighlight();
            return;
        }

        Library = document.createElement( "script" );
        Library.src = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js";
        Library.async = true;
        Library.addEventListener( "load", InitBlogCodeHighlight );
        Library.addEventListener( "error", InitBlogCodeHighlight );
        document.head.appendChild( Library );
    }

    ResolvePaths( document );
    MarkActiveNav( document );
    LoadBlogCodeHighlight();
    LoadPartial( "[data-site-header]", "partials/header.html" );
    LoadPartial( "[data-site-footer]", "partials/footer.html" );
} )();
