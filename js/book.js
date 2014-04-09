(function($){

  // ------------------------------------------------------------
  $.fn.figure = function(options) {
    return this.each(function() {        
      var $figure = $(this);
      var $image = $('img', this);
      $('map > area[shape=rect]', this).each(function() {
        var match = $(this).attr('coords').match(/(\d+),(\d+),(\d+),(\d+)/);
        if (match)
        {
          var left = parseInt(match[1]);
          var top = parseInt(match[2]);
          var right = parseInt(match[3]);
          var bottom = parseInt(match[4]);
          var box = $('<div class="hover-zone"></div>');
          
          box.css('left', (left - 1) + 'px');
          box.css('top', (top - 1) + 'px');
          box.css('width', (right - left) + 'px');
          box.css('height', (bottom - top) + 'px');
          box.css('background-image', 'url(' + $image.attr('src') + ')');
          box.css('background-position', '-' + left + 'px -' + top + 'px');
          $figure.append(box);

          box.popover({
            trigger: 'hover',
            placement: 'bottom',
            title: $(this).data('caption'),
            content: $(this).attr('title')
          });
        }
      });
      $(this).hover(function() {
        $(this).addClass('active');
        $('img', this).fadeTo('fast', 0.85);
      }, function() {
        $(this).removeClass('active');
        $('img', this).fadeTo('fast', 1.0);
      });
    });
  };

  // ------------------------------------------------------------
  $.fn.doclink = function(options) {
    return this.each(function() {
      var link = $(this).text();

      if (link.match(/^android\./)) {
        var baseUrl = "http://developer.android.com/reference/";
      }
      else if (link.match(/^sofia\./)) {
        var baseUrl = "http://sofia.cs.vt.edu/sofia-2114/api/reference/";
      }
      else {
        var baseUrl = null;
      }

      if (baseUrl) {
        var hash = link.indexOf('#');
        if (hash == -1) {
          // Just link to the class.
          link = link.replace(/\./g, '/');
          link = baseUrl + link + ".html";
          $(this).replaceWith('<code><a href="' + link + '">'
            + $(this).html() + '</a></code>');
        }
        else {
          // Grab the hash out of it and fudge the text inside the node.
          var className = link.substr(0, hash).replace(/\./g, '/');
          var method = link.substr(hash + 1);

          link = baseUrl + className + ".html#" + method.replace(/\s+/g, '');
          $(this).replaceWith('<code><a href="' + link + '">'
            + method + '</a></code>');
        }
      }
    });
  };

  // ------------------------------------------------------------
  $.fn.examplecode = function(options) {
    var processCode = function(html) {
      var result = { code: '', marks: [] };

      var lines = html.split(/\r?\n/);

      $.each(lines, function(index, line) {
        var $line = $("<span>" + line + "</span>");
        var lineSoFar = '';

        $line.contents().each(function(nodeIndex, node) {
          if (node.nodeName == '#text')
          {
            lineSoFar += $(node).text();
          }
          else
          {
            var text = $(node).text();
            result.marks.push({
              from: { line: index, ch: lineSoFar.length },
              to: { line: index, ch: lineSoFar.length + text.length },
              options: {
                className: $(node).attr('class'),
                startStyle: 'start',
                endStyle: 'end',
                content: $(node).data('content'),
                title: $(node).data('title')
              }
            });
            lineSoFar += text;
          }
        });

        result.code += lineSoFar + '\n';
      });

      return result;
    };

    return this.each(function() {
      var codeNode = this;
      var codeData = processCode($(codeNode).html());
      var body = codeData.code;

      var title = $(codeNode).attr('data-title');
      if (body != null) { body = body.replace(/(\r?\n|\r)\s*$/, ''); }
      var cm = CodeMirror(function(newEditor) {
        $(codeNode).replaceWith(newEditor);
        if (title) { $(newEditor).attr('data-title', title); }
      }, {
        value: body,
        theme: 'simple',
        mode: $(codeNode).data('lang') || 'text/x-java',
        readOnly: true,
        matchBrackets: true,
        lineNumbers: $(codeNode).hasClass('lineNumbers')
          || !$(codeNode).hasClass('noLineNumbers')
      });

      $.each(codeData.marks, function(index, mark) {
        cm.markText(mark.from, mark.to, mark.options);
      });

      //var lines = cm.getWrapperElement().getElementsByClassName('CodeMirror-lines')[0];
      //cm.on(lines, 'mousemove', function(e) {
      var lines = $('.CodeMirror-lines', cm.getWrapperElement());
      var currentPopoverMark = null;
      var currentPopover = null;
      var destroyTimer = null;

      var isPopoverOpen = function(mark) {
        if (!currentPopoverMark) return false;
        var currentMark = currentPopoverMark.find();
        var newMark = mark.find();
        return currentMark.from.line == newMark.from.line
            && currentMark.from.ch   == newMark.from.ch
            && currentMark.to.line   == newMark.to.line
            && currentMark.to.ch     == newMark.to.ch;
      };
      var destroyCurrentPopover = function() {
        destroyTimer = setTimeout(function() {
          if (currentPopover)
          {
            currentPopover.popover('destroy');
            currentPopover = null;
            currentPopoverMark = null;
          }
        }, 100);
      };

      lines.mouseover(function(e) {
        var pos = cm.coordsChar({ left: e.clientX, top: e.clientY });
        var marks = cm.findMarksAt(pos);

        if (marks.length > 0)
        {
          var mark = marks[0];
          if (!isPopoverOpen(mark))
          {
            clearTimeout(destroyTimer);
            currentPopoverMark = mark;
            currentPopover = $(e.target).popover({
              placement: 'bottom',
              trigger: 'manual',
              title: mark.title,
              content: mark.content
            }).popover('show');
          }
          else
          {
            clearTimeout(destroyTimer);
          }
        }
        else if (currentPopover)
        {
          destroyCurrentPopover();
        }
      });
      lines.mouseout(function(e) {
        destroyCurrentPopover();
      });

    });
  };

})(jQuery);

$(function() {
  $('[rel="tooltip"]').tooltip();
  $('code.link').doclink();
  $('pre').examplecode();
  $('.figure.interactive').figure();

  $('a.thumbnail').click(function(e) {
    $(this).closest('.thumbnails').find('img.sink').attr(
      'src', $('img', this).attr('src'));
    e.preventDefault();
  });
});
