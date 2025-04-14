/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2012 John Foerch
 *
 * Portions of this file were derived from Vimperator,
 * (C) Copyright 2007 Doug Kearns
 * (C) Copyright 2007-2008 Martin Stubenschrott.
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("element.js");

const RELATIONSHIP_NEXT = 0;
const RELATIONSHIP_PREVIOUS = 1;

var browser_relationship_rel_regexp = ["next", "prev|previous"];
var browser_relationship_rev_regexp = ["prev|previous", "next"];

define_variable("browser_relationship_patterns", {},
    "Patterns used by `follow-next' and `follow-previous'. "+
    "User value may be overridden for specific websites by "+
    "page-modes.");

browser_relationship_patterns[RELATIONSHIP_NEXT] =
    [
     // Standalone symbols as complete content
     /^>$/i,    // Greater than sign alone
     /^\u003E$/i, // Greater than sign (>) as Unicode
     /^&gt;$/i,   // Greater than sign HTML entity
     
     // Exact matches for each special character as Unicode code points
     /^\u2192$/, // Right arrow (→)
     /^\u00BB$/, // Right double angle quotation mark (»)
     /^\u276F$/, // Heavy right-pointing angle quotation mark ornament (❯)
     /^\u27E9$/, // Mathematical right angle bracket (⟩)
     /^\u21D2$/, // Rightwards double arrow (⇒)
     /^\u25B6$/, // Black right-pointing triangle (▶)
     /^\u203A$/, // Single right-pointing angle quotation mark (›)
     /^\u226B$/, // Much greater-than (≫)
     /^\u2283$/, // Superset of (⊃)
     
     // Double symbols at start of text (e.g., ">> Next")
     /^(>>|&gt;&gt;|\u00BB|\u276F|\u2192|\u27E9|\u21D2|\u25B6|\u203A|\u226B|\u2283)/i, 
     
     // Double symbols at end of text (e.g., "Next >>")
     /(>>|&gt;&gt;|\u00BB|\u276F|\u2192|\u27E9|\u21D2|\u25B6|\u203A|\u226B|\u2283)$/i,
     
     // Single symbols at beginning of text (e.g., "> Next")
     /^(>|&gt;|\u00BB|\u276F|\u2192|\u27E9|\u21D2|\u25B6|\u203A|\u226B|\u2283)/i,
     
     // Single symbols at end of text (e.g., "Next >")
     /(>|&gt;|\u00BB|\u276F|\u2192|\u27E9|\u21D2|\u25B6|\u203A|\u226B|\u2283)$/i,
     
     // Text matches
     /\b(next|forward|newer|next page|blahn)\b/i
    ];

browser_relationship_patterns[RELATIONSHIP_PREVIOUS] =
    [
     // Standalone symbols as complete content
     /^<$/i,    // Less than sign alone
     /^\u003C$/i, // Less than sign (<) as Unicode
     /^&lt;$/i,   // Less than sign HTML entity
     
     // Exact matches for each special character as Unicode code points
     /^\u2190$/, // Left arrow (←)
     /^\u00AB$/, // Left double angle quotation mark («)
     /^\u276E$/, // Heavy left-pointing angle quotation mark ornament (❮)
     /^\u27E8$/, // Mathematical left angle bracket (⟨)
     /^\u21D0$/, // Leftwards double arrow (⇐)
     /^\u25C0$/, // Black left-pointing triangle (◀)
     /^\u2039$/, // Single left-pointing angle quotation mark (‹)
     /^\u226A$/, // Much less-than (≪)
     /^\u2282$/, // Subset of (⊂)
     
     // Double symbols at start of text (e.g., "<< Previous")
     /^(<<|&lt;&lt;|\u00AB|\u276E|\u2190|\u27E8|\u21D0|\u25C0|\u2039|\u226A|\u2282)/i,
     
     // Double symbols at end of text (e.g., "Previous <<")
     /(<<|&lt;&lt;|\u00AB|\u276E|\u2190|\u27E8|\u21D0|\u25C0|\u2039|\u226A|\u2282)$/i,
     
     // Single symbols at beginning of text (e.g., "< Previous")
     /^(<|&lt;|\u00AB|\u276E|\u2190|\u27E8|\u21D0|\u25C0|\u2039|\u226A|\u2282)/i,
     
     // Single symbols at end of text (e.g., "Previous <")
     /(<|&lt;|\u00AB|\u276E|\u2190|\u27E8|\u21D0|\u25C0|\u2039|\u226A|\u2282)$/i,
     
     // Text matches
     /\b(prev|previous|back|older|previous page|blahp)\b/i
    ];

function document_get_element_by_relationship (doc, patterns, relationship) {
    patterns = patterns[relationship];
    var rel_name = new RegExp(browser_relationship_rel_regexp[relationship], "i");
    var rev_name = new RegExp(browser_relationship_rev_regexp[relationship], "i");

    var elems = doc.getElementsByTagName("link");
    // links have higher priority than anchors
    for (var i = 0, n = elems.length; i < n; i++) {
        if (rel_name.test(elems[i].rel) || rev_name.test(elems[i].rev))
            return elems[i];
    }

    // no links? look for anchors
    elems = doc.getElementsByTagName("a");
    for (i = 0, n = elems.length; i < n; i++) {
        if (rel_name.test(elems[i].rel) || rev_name.test(elems[i].rev))
            return elems[i];
    }

    for (var j = 0, p = patterns.length; j < p; ++j) {
        var pattern = patterns[j];
        if (pattern instanceof Function) {
            var elem = pattern(doc);
            if (elem)
                return elem;
        } else {
            for (i = 0, n = elems.length; i < n; i++) { // loop through list of anchors again
                if (pattern.test(elems[i].textContent))
                    return elems[i];
                // images with alt text being href
                var children = elems[i].childNodes;
                for (var k = 0, c = children.length; k < c; k++) {
                    if (children[k].alt && pattern.test(children[k].alt))
                        return elems[i];
                }
            }
        }
    }
    return null;
}

define_browser_object_class("relationship-next", null,
    function (I, prompt) {
        var doc = I.buffer.document;
        for (let frame in frame_iterator(I.buffer.top_frame, I.buffer.focused_frame)) {
            let elem = document_get_element_by_relationship(
                frame.document,
                I.local.browser_relationship_patterns,
                RELATIONSHIP_NEXT);
            if (elem)
                yield co_return(elem);
        }
        throw interactive_error("No \"next\" link found.");
    });

define_browser_object_class("relationship-previous", null,
    function (I, prompt) {
        var doc = I.buffer.document;
        for (let frame in frame_iterator(I.buffer.top_frame, I.buffer.focused_frame)) {
            let elem = document_get_element_by_relationship(
                frame.document,
                I.local.browser_relationship_patterns,
                RELATIONSHIP_PREVIOUS);
            if (elem)
                yield co_return(elem);
        }
        throw interactive_error("No \"previous\" link found.");
    });

provide("follow-relationship");
