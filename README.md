<!-- -*- coding: utf-8 -*- -->

# Window Titles - Chrome Extension for setting the window title.

Prototype stage, not published on the store yet.

### Usage

If the left-most tab on a given window has a title of the form
`[TITLE]`, the *TITLE* will be used as the title of the window.

Such a tab can be created either by manually typing

    data:text/html,<title>TITLE</title>
    
into the URL bar, or by using the bookmarklet

    javascript:/* TitleTab */(function(){ const title=window.prompt('Enter title',document.title.replace(/^\[(.*)\]/,"$1"));const url='data:text/html,'+'<title>['+title+']</title>'+'<h1>'+title+'</h1>';window.prompt('Copy, then paste as URL',url);})();undefined;
    
### Motivation

When working with a lot of tabs and windows, some of which may stay
open over a long time, it would be nice to assign titles to different
Chrome windows. 

These titles should also be visible in tab manager extensions like 
[Tablii](https://chrome.google.com/webstore/detail/tabli/igeehkedfibbnhbfponhjjplpkeomghi),
and be visible on mobile devices where tabs of a synchronized desktop
otherwise are presented as an unstructured list.

The title of the window is derived from the title of the active tab,
but cannot otherwise be changed. Additionally it is tricky to preserve
data about tabs and windows across restarts of the browser.

These requirements were fulfillable by:

  - Adding a prefix to titles of active tabs, that follows a pattern
    that can easily be detected. I chose `[...]' for this.
  - Storing the title of the window in a “title tab” left-most of the
    window, which would solve both persistence and visibility to
    extensions and mobile devices.
    
### Plans

Until now I was using only the bookmarklet, and manually switching to
the title tab in windows that I don't currently need.

Having the titles of tabs change provides some inconvenient visual
noise. So I'll be trying if this addon actually contributes positively
to the workflow, before I'll make it publication-ready.
