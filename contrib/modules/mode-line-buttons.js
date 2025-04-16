/**
 * (C) Copyright 2009 David Kettler
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("mode-line.js");

function button_widget (window) {
    this.class_name = "button-widget";
    text_widget.call(this, window);
}
button_widget.prototype = {
    constructor: button_widget,
    __proto__: text_widget.prototype,

    make_element: function (window) {
        var command = this.command;
        var element = create_XUL(window, "toolbarbutton");

        // Set appropriate attributes for toolbar button
        if (this.attributes.label) {
            element.setAttribute("label", this.attributes.label);
            element.setAttribute("tooltiptext", this.attributes.tooltiptext || this.attributes.label);
        }

        element.addEventListener("click", function (event) {
            var I = new interactive_context(window.buffers.current);
            co_call(call_interactively(I, command));
        }, false);

        element.addEventListener("mouseover", function (event) {
            // Get the button name from the map if available
            var buttonName = "";
            for (var i = 0; i < standard_mode_line_buttons.length; i++) {
                if (standard_mode_line_buttons[i][0] === command) {
                    buttonName = " (" + standard_mode_line_buttons[i][1] + ")";
                    break;
                }
            }
            var msg = "Button: " + command + buttonName;
            var keymaps = get_current_keymaps(window);
            var list = keymap_lookup_command(keymaps, command);
            if (list.length)
                msg += " (which is on key " + list.join(", ") + ")";
            window.minibuffer.show(msg);
        }, false);

        element.addEventListener("mouseout", function (event) {
            window.minibuffer.show("");
        }, false);

        element.setAttribute("id", "button-widget-" + command);
        // Ensure existing classes are kept, including the base class_name and the new hover class
        element.setAttribute("class", this.class_name + " magnify-on-hover");
        for (var a in this.attributes) {
            // Avoid overwriting the class attribute set above
            if (a !== "class") {
                element.setAttribute(a, this.attributes[a]);
            } else {
                 // Append other classes from attributes if they exist, checking they aren't already added
                 this.attributes[a].split(' ').filter(Boolean).forEach(cls => {
                    if (!element.classList.contains(cls)) {
                        element.classList.add(cls);
                    }
                 });
            }
        }

        return element;
    }
};

function make_button_widget (command, attributes) {
    if (typeof attributes == "string") {
        // Single character symbol instead of full text or icon
        var symbol = get_symbol_for_button(attributes);
        var tooltipText = attributes; // Use the full name as tooltip
        attributes = { 
            label: symbol, 
            class: "symbol-button",
            tooltiptext: tooltipText  // Add tooltiptext attribute
        };
    }

    function new_widget (window) {
        button_widget.call(this, window);
    }
    new_widget.prototype = {
        constructor: new_widget,
        __proto__: button_widget.prototype,
        command: command,
        attributes: attributes
    };
    new_widget.mode_line_adder = function (window) {
        var widget = new new_widget(window);
        window.mode_line.add_widget(widget, widget.make_element(window));
    };

    return new_widget;
}

function mode_line_add_buttons (buttons, prepend) {
    for (var i = 0, n = buttons.length; i < n; i++) {
        var j = prepend ? n - i - 1 : i;
        var w = make_button_widget(buttons[j][0], buttons[j][1]);
        add_hook("mode_line_hook", mode_line_adder(w), prepend);
    }
}

var standard_mode_line_buttons = [
    ["find-url", "open"],
    ["find-url-new-buffer", "new"],
    ["back", "go-back"],
    ["forward", "go-forward"],
    ["reload", "refresh"],
    ["kill-current-buffer", "close"],
    ["buffer-previous", "go-up"],
    ["buffer-next", "go-down"],
    ["home", "home"],
    ["help-page", "help"],
    ["quit", "quit"],
];

function get_symbol_for_button(button_text) {
    // Map button text to simple ASCII characters
    // Unicode equivalents commented for reference
    const symbolMap = {
        'go-back': '<',
        'go-forward': '>',
        'open': 'O',
        'new': '+', 
        'refresh': 'R',
        'close': 'X',
        'go-up': '^',
        'go-down': 'v',
        'home': 'H',
        'help': '?', 
        'quit': 'Q',
    };
    
    return symbolMap[button_text] || button_text.charAt(0);
}

provide("mode-line-buttons");
