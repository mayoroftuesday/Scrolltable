//////// CLEAR CHILD NODES ////////////////////////////////////////////////////
//http: //matthom.com/archive/2007/05/03/removing-all-child-nodes-from-an-element

function RemoveChildren(elem)
{
    if (elem.hasChildNodes())
    {
        while (elem.childNodes.length >= 1)
        {
            elem.removeChild(elem.firstChild);
        }
    }
}

//////// ADD AND REMOVE CLASS NAMES ///////////////////////////////////////////
// From: http://particletree.com/features/javascript-basics-for-prototyping/
String.prototype.trim = function() { return this.replace(/^\s+|\s+$/, ""); };
function addClassName(elem, className)
{
    if (elem.className.indexOf(className) == -1)
    {
        elem.className = (elem.className + " " + className).trim();
    }
}
function removeClassName(elem, className)
{
    elem.className = elem.className.replace(className, "").trim();
}

//////// DELEGATES ////////////////////////////////////////////////////////////
// From: http: //www.terrainformatica.com/?p=9
function delegate(that, thatMethod)
{
    return function(e) { return thatMethod.call(that, e); }
}

//////// MOUSECAPTURE /////////////////////////////////////////////////////////
// Adapted from: http://www.codelifter.com/main/javascript/capturemouseposition1.html
function MouseCapture() { }
MouseCapture.prototype =
{
    IE: window.document.all ? true : false,
    initMouseX: null,   // mouseX at startMouseCapturing (useful for drag)
    initMouseY: null,   // mouseY at startMouseCapturing (useful for drag)
    mouseX: null,       // x pos
    mouseY: null,       // y pos
    currDelegate: null
}
// Get mouse coordinates and save to mouseX and mouseY. Also set initial values for use when doing click+drag
MouseCapture.prototype.getMouseXY = function(e)
{
    if (this.IE)
    { // grab the x-y pos.s if browser is IE
        this.mouseX = window.event.clientX + window.document.body.scrollLeft;
        this.mouseY = window.event.clientY + window.document.body.scrollTop;
    }
    else
    {  // grab the x-y pos.s if browser is NS
        this.mouseX = e.pageX;
        this.mouseY = e.pageY;
    }

    if (this.mouseX < 0) { this.mouseX = 0; }
    if (this.mouseY < 0) { this.mouseY = 0; }

    // get start point for drag
    if (this.initMouseX === null) { this.initMouseX = this.mouseX; }
    if (this.initMouseY === null) { this.initMouseY = this.mouseY; }

    return true;
}
MouseCapture.prototype.startMouseCapturing = function()
{
    this.currDelegate = delegate(this, this.getMouseXY);
    if (this.IE) { window.document.attachEvent("onmousemove", this.currDelegate, false); }
    else { window.document.addEventListener("mousemove", this.currDelegate, false); }
}
MouseCapture.prototype.stopMouseCapturing = function()
{
    if (this.IE) { window.document.detachEvent("onmousemove", this.currDelegate, false); }
    else { window.document.removeEventListener("mousemove", this.currDelegate, false); }
    this.currDelegate = null;

    this.initMouseX = null;
    this.initMouseY = null;
}


//////// SCROLLBAR ////////////////////////////////////////////////////////////
function ScrollBar(_divid, _orientation, _size, _itemCount)
{
    this.container = document.getElementById(_divid);
    this.direction = _orientation;                      // see ScrollBar.Orientations
    this.size = _size;                                  // in pixels
    this.scrollableSize = _size - 80;                   // available scrolling size (size - total size of buttons)
    this.itemCount = _itemCount || this.scrollableSize; // # of items to be scrolled through. if not provided, will assume number of items = pixels

    // create new buttons
    RemoveChildren(this.container); // clear in case this is a redraw
    this.lessButton = document.createElement("div");
    this.moreButton = document.createElement("div");
    this.scroller = document.createElement("div");

    // register event handlers
    var scrollMoreDel = delegate(this, function() { this.scroll(1); });
    var scrollLessDel = delegate(this, function() { this.scroll(-1); });
    var scrollLessDelDbl = delegate(this, function() { this.scroll(-1, true); });
    var scrollMoreDelDbl = delegate(this, function() { this.scroll(1, true); });
    var stopScrollDel = delegate(this, this.stopScroll);
    var startDragDel = delegate(this, this.startDragItem);
    if (window.document.all)
    {
        this.lessButton.attachEvent("onmousedown", scrollLessDel, false);   // register click, click+hold
        this.moreButton.attachEvent("onmousedown", scrollMoreDel, false);
        this.lessButton.attachEvent("onmouseup", stopScrollDel, false);     // cancel click+hold
        this.moreButton.attachEvent("onmouseup", stopScrollDel, false);
        this.lessButton.attachEvent("onmouseout", stopScrollDel, false);    // cancel click+hold
        this.moreButton.attachEvent("onmouseout", stopScrollDel, false);
        this.lessButton.attachEvent("ondblclick", scrollLessDelDbl, false); // when IE encounters double-click, it ignores the 2nd click event, so we have to add these handlers
        this.moreButton.attachEvent("ondblclick", scrollMoreDelDbl, false);
        this.scroller.attachEvent("onmousedown", startDragDel, false);      // register drag
    }
    else
    {
        this.lessButton.addEventListener("mousedown", scrollLessDel, false);// register click, click+hold
        this.moreButton.addEventListener("mousedown", scrollMoreDel, false);
        this.lessButton.addEventListener("mouseup", stopScrollDel, false);  // cancel click+hold
        this.moreButton.addEventListener("mouseup", stopScrollDel, false);
        this.lessButton.addEventListener("mouseout", stopScrollDel, false); // cancel click+hold
        this.moreButton.addEventListener("mouseout", stopScrollDel, false);
        this.scroller.addEventListener("mousedown", startDragDel, false);   // register drag
    }
    
    // format scrollbar and buttons
    if (this.direction == ScrollBar.Orientations.horiz)
    {
        this.container.className = "scrollXContainer";
        this.lessButton.className = "button leftButton";
        this.scroller.className = "button scrollerX";
        this.moreButton.className = "button rightButton";
        this.container.style.width = this.size;
        this.moreButton.style.left = this.scrollableSize;
    }
    else
    {
        this.container.className = "scrollYContainer";
        this.lessButton.className = "button upButton";
        this.scroller.className = "button scrollerY";
        this.moreButton.className = "button downButton";
        this.container.style.height = this.size;
        this.moreButton.style.top = this.scrollableSize;
    }

    // add buttons to scrollbar container
    this.container.appendChild(this.lessButton);
    this.container.appendChild(this.scroller);
    this.container.appendChild(this.moreButton);
}
ScrollBar.prototype =
{
    container: null,
    direction: null,
    size: null,
    scrollableSize: null,
    currItem: 0,               // current scrolled-to item
    percent: 0,                // percent scrolled
    itemCount: null,
    scrollerPosition: 0,
    currDragDelegate: null,
    currUpDelegate: null,
    mouse: new MouseCapture(),
    lessButton: null,
    moreButton: null,
    scroller: null,
    onChange: null,            // set this handler to fire when scrolling to new item
    scrollInterval: null,
    intervalScrollID: null,
    slowInterval: 500,         // click+hold wait interval before fast scroll
    fastInterval: 75           // click+hold fast scrolling interval
}
ScrollBar.Orientations = { horiz: "horiz", vert: "vert" }

ScrollBar.prototype.hide = function()
{
    this.container.style.display = "none";
}
ScrollBar.prototype.show = function()
{
    this.container.style.display = "block";
}
// Stop capturing click+drag event
ScrollBar.prototype.endDragItem = function(e)
{
    this.scroller.focus(); // bug? sometimes focus gets whacked and browser thinks your trying to click+drag to copy text

    // detach drag functions
    if (window.document.all)
    {
        window.document.detachEvent("onmousemove", this.currDragDelegate, false);
        window.document.detachEvent("onmouseup", this.currUpDelegate, false);
    }
    else
    {
        window.document.removeEventListener("mousemove", this.currDragDelegate, false);
        window.document.removeEventListener("mouseup", this.currUpDelegate, false);
    }

    // save latest position
    if (this.direction == ScrollBar.Orientations.horiz)
    {
        this.scrollerPosition = parseInt(this.scroller.style.left);
    }
    else
    {
        this.scrollerPosition = parseInt(this.scroller.style.top);
    }

    this.currDragDelegate = null;
    this.currUpDelegate = null;

    this.mouse.stopMouseCapturing();
}

// Capture click+drag event and scroll table accordingly
ScrollBar.prototype.dragItem = function(e)
{
    // get latest mouse positions
    var startPos, endPos;
    if (this.direction == ScrollBar.Orientations.horiz)
    {
        startPos = this.mouse.initMouseX;
        endPos = this.mouse.mouseX;
    }
    else
    {
        startPos = this.mouse.initMouseY;
        endPos = this.mouse.mouseY;
    }

    if (startPos === null || endPos === null)
    {
        return false;
    }
    
    // update scrollbar to latest position
    var newPos = this.boundValue(this.scrollerPosition + (endPos - startPos));
    this.updatePosition(newPos);

    return true;
}

// Start capturing click+drag events for scrollers
ScrollBar.prototype.startDragItem = function(e)
{
    // just in case events got messed up, clear them now
    if (this.currDragDelegate !== null || this.currUpDelegate !== null)
    {
        this.endDragItem(e);
    }

    // attach drag functions
    this.currDragDelegate = delegate(this, this.dragItem);
    this.currUpDelegate = delegate(this, this.endDragItem);
    if (window.document.all)
    {
        window.document.attachEvent("onmousemove", this.currDragDelegate, false);
        window.document.attachEvent("onmouseup", this.currUpDelegate, false);
    }
    else
    {
        window.document.addEventListener("mousemove", this.currDragDelegate, false);
        window.document.addEventListener("mouseup", this.currUpDelegate, false);
    }

    this.mouse.startMouseCapturing();
}

ScrollBar.prototype.scroll = function(d, dbl)
{
    this.scroller.focus(); // bug? sometimes when you click and drag, browser thinks your trying to copy text

    // if interval scrolling is pending, end it
    if (this.intervalScrollID !== null)
    {
        window.clearTimeout(this.intervalScrollID);
        this.intervalScrollID = null;
    }

    // update scrollbar to new position
    this.scrollerPosition = this.boundValue(this.scrollerPosition + d * (this.scrollableSize / (this.itemCount - 1)));
    this.updatePosition(this.scrollerPosition);

    // setup interval scrolling if doing click+hold
    if (this.scrollInterval === null)
    {
        this.scrollInterval = this.slowInterval;
    }
    else if (this.scrollInterval == this.slowInterval)
    {
        this.scrollInterval = this.fastInterval;
    }
    if (d < 0)
    {
        this.intervalScrollId = window.setTimeout(delegate(this, function() { this.scroll(-1); }), this.scrollInterval);
    }
    else
    {
        this.intervalScrollId = window.setTimeout(delegate(this, function() { this.scroll(1); }), this.scrollInterval);
    }

    // This if for buggy IE. On double-click, IE registers a 1 click and 1 double-click, whereas Firefox registers 2 clicks and 1 double-click
    if (dbl == true)
    {
        this.stopScroll();
    }
}
ScrollBar.prototype.stopScroll = function(e)
{
    window.clearTimeout(this.intervalScrollId);
    this.intervalScrollId = null;
    this.scrollInterval = null;
};

ScrollBar.prototype.boundValue = function(val)
{
    // keep scrollbar position inside scrollbar
    if (val < 0)
    {
        return 0;
    }
    else if (val > this.scrollableSize)
    {
        return this.scrollableSize;
    }
    else
    {
        return val;
    }
}

ScrollBar.prototype.updatePosition = function(val)
{
    var oldItem = this.currItem;

    // get latest scrollbar position calculations
    this.percent = val / this.scrollableSize;                             // percent scrolled
    this.currItem = Math.round((this.itemCount - 1) * this.percent);      // current item scrolled-to
    
    // circumvent floating-point issues and make sure scrollbar is flush against edge at first and last items
    if (this.currItem == 0)
    {
        this.percent = 0;
        val = 0;
    }
    if (this.currItem == this.itemCount - 1)
    {
        this.percent = 1;
        val = this.scrollableSize;
    }

    // if current item changed, fire onChange event
    if (oldItem != this.currItem && this.onChange !== null)
    {
        this.onChange();
    }

    // change scroller position
    if (this.direction == ScrollBar.Orientations.horiz)
    {
        this.scroller.style.left = val;
    }
    else
    {
        this.scroller.style.top = val;
    }
}

var startTime;
function logTimestamp(str)
{
    var newTime = (new Date()).getTime();
    var timeDiff = newTime - startTime;
    log(str + ": " + timeDiff);
}

//////// SCROLLTABLE //////////////////////////////////////////////////////////
window.document.ScrollTables = new Array();
window.document.ScrollTables.Current = null;
function ScrollTable(_tableID, _horizScrollbarID, _vertScrollbarID)
{
    startTime = (new Date()).getTime();

    logTimestamp("Start");

    this.tableID = _tableID;
    this.horizScrollbarID = _horizScrollbarID;
    this.vertScrollbarID = _vertScrollbarID;
    
    window.document.ScrollTables[window.document.ScrollTables.length] = this;
    this.ScrollTableID = window.document.ScrollTables.length - 1;

    logTimestamp("store table");
    
    // store table in memory
    this.table = window.document.getElementById(this.tableID);
    this.rows = this.table.getElementsByTagName("tr"); // the collection of data rows
    var currRow, child, cells;
    for (var r = 0; r < this.rows.length; r++)
    {
        currRow = this.rows[r];

        // get array of cells in this row
        currRow.tableCells = new Array();              // the collection of cells within a row
        for (var c = 0; c < currRow.childNodes.length; c++)
        {
            child = currRow.childNodes[c];
            if (child.nodeName == "TD" || child.nodeName == "TH")
            {
                currRow.tableCells[currRow.tableCells.length] = currRow.childNodes[c];
            }
        }
    }

    logTimestamp("set widths");

    // get and set initial column widths
    this.columnWidths = new Array();  // array of original column widths
    for (var col = 0; col < this.rows[0].tableCells.length; col++)
    {
        this.columnWidths[col] = this.rows[0].tableCells[col].offsetWidth;
    }
    for (var r = 0; r < this.rows.length; r++)
    {
        currRow = this.rows[r];
        for (var c = 0; c < currRow.tableCells.length; c++)
        {
            currRow.tableCells[c].style.width = this.columnWidths[c];
        }
    }
    
    logTimestamp("done");
}
ScrollTable.prototype =
{
    ScrollTableID: null,   // use this ID to send current table to a callback e.g. setTimeout()

    fixedCols: 1,            // number of columns that should stay fixed when scrolling
    fixedRows: 1,            // number of rows that should stay fixed when scrolling
    dispCols: 6,             // total number of columns to display
    dispRows: 5,             // total number of rows to display

    rows: null,
    table: null,
    columnWidths: null,
    
    tableID: null,
    horizScrollbarID: null,
    vertScrollbarID: null,
    
    horizScrollbar: null,
    vertScrollbar: null,
    
    synchYPosition: -1
}
// If user updates any of the public members (see above), draw() may have to be called
ScrollTable.prototype.draw = function()
{
    logTimestamp("start draw");
    this.table.style.display = "none"; // this dramatically increases initial performance

    // grab table dimension data
    this.numCols = this.rows[0].tableCells.length - this.fixedCols;           // number of columns of data that can be scrolled
    this.numRows = this.rows.length - this.fixedRows;                         // number of rows of data that can be scrolled
    this.scrollCols = Math.min(this.dispCols - this.fixedCols, this.numCols); // number of columns visible that can be scrolled
    this.scrollRows = Math.min(this.dispRows - this.fixedRows, this.numRows); // number of rows visible that can be scrolled

    // starting point for table
    this.tableX = this.fixedCols;
    this.tableY = this.fixedRows;

    logTimestamp("crop");
    this.table.style.display = "none";

    // crop table to visible section
    this.updateTable();

    this.table.style.display = "block";
    logTimestamp("adjust");

    // adjust scrollbars to table dimensions
    this.table.style.width = "100%";
    var tableWidth = this.table.offsetWidth;
    var tableHeight = this.table.offsetHeight;
    this.horizScrollbar = new ScrollBar(this.horizScrollbarID, ScrollBar.Orientations.horiz, tableWidth * 1.0, this.numCols - (this.scrollCols - 1)); // *1.0 so they aren't linked by reference
    this.vertScrollbar = new ScrollBar(this.vertScrollbarID, ScrollBar.Orientations.vert, tableHeight * 1.0, this.numRows - (this.scrollRows - 1));

    this.horizScrollbar.onChange = delegate(this, function() { this.updateTable(); });
    this.vertScrollbar.onChange = delegate(this, function() { this.updateTable(); });

    logTimestamp("hide/show");

    // hide/show scrollbars
    if (this.scrollCols == this.numCols)
    {
        this.horizScrollbar.hide();
    }
    else
    {
        this.horizScrollbar.show();
    }
    if (this.scrollRows == this.numRows)
    {
        this.vertScrollbar.hide();
    }
    else
    {
        this.vertScrollbar.show();
    }

    logTimestamp("done draw");
};

ScrollTable.prototype.setInitialRowDisplay = function()
{
    var cells, currRow;
    for (var r = 0; r < this.rows.length; r++)
    {
        currRow = this.rows[r];

        // set initial row visibility
        if (r < this.tableY || (r >= this.tableY && r <= this.fixedRows + this.scrollRows - 1))
        {
            removeClassName(currRow, "ScrollTable_HiddenCell");
        }
        else
        {
            addClassName(currRow, "ScrollTable_HiddenCell");
        }

        currRow.synchXPosition = -1;
    }

}

ScrollTable.prototype.setInitialColumnDisplay = function(row)
{
    for (var c = this.fixedCols; c < row.tableCells.length; c++)
    {
        if (c >= this.tableX && c <= this.tableX + this.scrollCols - 1)
        {
            removeClassName(row.tableCells[c], "ScrollTable_HiddenCell");
        }
        else
        {
            addClassName(row.tableCells[c], "ScrollTable_HiddenCell");
        }
    }

    row.synchXPosition = this.tableX;
}

// Shift one row of data so it is synch'd with the current column
ScrollTable.prototype.shiftTableHoriz = function(row)
{
    var oldPos = row.synchXPosition;
    var newPos = this.tableX;

    if (oldPos == newPos)
    {
        return;
    }

    // shift cells to synch this row
    var cell;
    if (oldPos == -1) // initial, must set all columns
    {
        this.setInitialColumnDisplay(row);
    }
    else // if not initial, only shift columns
    {
        if (oldPos < newPos)
        { // shift right
            for (cell = oldPos; cell < Math.min(newPos, oldPos + this.scrollCols); cell++)
            {
                addClassName(row.tableCells[cell], "ScrollTable_HiddenCell"); // switch off
            }
            for (cell = Math.max(oldPos + this.scrollCols, newPos); cell < newPos + this.scrollCols; cell++)
            {
                removeClassName(row.tableCells[cell], "ScrollTable_HiddenCell"); // switch on
            }
        }
        else
        { // shift left
            for (cell = Math.max(newPos + this.scrollCols, oldPos); cell < oldPos + this.scrollCols; cell++)
            {
                addClassName(row.tableCells[cell], "ScrollTable_HiddenCell"); // switch off
            }
            for (cell = newPos; cell < Math.min(oldPos, newPos + this.scrollCols); cell++)
            {
                removeClassName(row.tableCells[cell], "ScrollTable_HiddenCell"); // switch on
            }
        }
    }

    // update synch status. this row is now synched with the display
    row.synchXPosition = newPos;
};

// Shift visible rows to current row
ScrollTable.prototype.shiftTableVert = function()
{
    var oldPos = this.synchYPosition;
    var newPos = this.tableY;

    if (oldPos == newPos || typeof (oldPos) == "undefined")
    {
        return;
    }

    // shift rows to synch the table
    var row;
    if (oldPos == -1)
    {
        this.setInitialRowDisplay();
    }
    else
    {
        if (oldPos < newPos)
        { // shift down
            for (row = oldPos; row < Math.min(newPos, oldPos + this.scrollRows); row++)
            {
                addClassName(this.rows[row], "ScrollTable_HiddenCell"); // switch off
            }
            for (row = Math.max(oldPos + this.scrollRows, newPos); row < newPos + this.scrollRows; row++)
            {
                removeClassName(this.rows[row], "ScrollTable_HiddenCell"); // switch on
                this.shiftTableHoriz(this.rows[row]);
            }
        }
        else
        { // shift up
            for (row = Math.max(newPos + this.scrollRows, oldPos); row < oldPos + this.scrollRows; row++)
            {
                addClassName(this.rows[row], "ScrollTable_HiddenCell"); // switch off
            }
            for (row = newPos; row < Math.min(oldPos, newPos + this.scrollRows); row++)
            {
                removeClassName(this.rows[row], "ScrollTable_HiddenCell"); // switch on
                this.shiftTableHoriz(this.rows[row]);
            }
        }
    }

    // update synch status
    this.synchYPosition = newPos;
};

// Shift rows and columns after a scroll request is made
ScrollTable.prototype.updateTable = function()
{
    // get new values
    if (this.horizScrollbar !== null && this.vertScrollbar !== null)
    {
        this.tableX = this.horizScrollbar.currItem + this.fixedCols;
        this.tableY = this.vertScrollbar.currItem + this.fixedRows;
    }

    // shift table vertically
    this.shiftTableVert();

    // only shift currently displayed rows
    var row;
    for (row = 0; row < this.fixedRows; row++)
    {
        this.shiftTableHoriz(this.rows[row]); // fixed rows
    }
    for (row = this.tableY; row < this.tableY + this.scrollRows; row++)
    {
        this.shiftTableHoriz(this.rows[row]); // scrollable rows
    }
};

//////// LOGGING //////////////////////////////////////////////////////////////
function log(str)
{
    var log = document.getElementById("log");
    log.value = str + "\n" + log.value;
}