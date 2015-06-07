// javascipt verified by http://www.jslint.com/ and http://www.javascriptlint.com/ on 2/3/2009

// CSS Utility Code
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
// END CSS Utility Code

// Mouse Capture code
// Adapted from: http://www.codelifter.com/main/javascript/capturemouseposition1.html

var mouse = null;
function MouseCapture() 
{
    this.IE = window.document.all ? true : false;
    this.initMouseX = null;
    this.initMouseY = null;
    this.mouseX = null;
    this.mouseY = null;
}
function initMouseCapture() 
{
    if (mouse === null) 
    {
        mouse = new MouseCapture();
    }
}

// Get mouse coordinates and save to mouseX and mouseY. Also set initial values for use when doing click+drag
function getMouseXY(e) 
{
    if (mouse.IE) 
    { // grab the x-y pos.s if browser is IE
        mouse.mouseX = window.event.clientX + window.document.body.scrollLeft;
        mouse.mouseY = window.event.clientY + window.document.body.scrollTop;
    }
    else 
    {  // grab the x-y pos.s if browser is NS
        mouse.mouseX = e.pageX;
        mouse.mouseY = e.pageY;
    }

    if (mouse.mouseX < 0) { mouse.mouseX = 0; }
    if (mouse.mouseY < 0) { mouse.mouseY = 0; }

    // get start point for drag
    if (mouse.initMouseX === null) { mouse.initMouseX = mouse.mouseX; }
    if (mouse.initMouseY === null) { mouse.initMouseY = mouse.mouseY; }

    return true;
}
function startMouseCapturing() 
{
    if (mouse.IE) { window.document.attachEvent("onmousemove", getMouseXY, false); }
    else { window.document.addEventListener("mousemove", getMouseXY, false); }

}
function stopMouseCapturing(m) 
{
    if (mouse.IE) { window.document.detachEvent("onmousemove", getMouseXY, false); }
    else { window.document.removeEventListener("mousemove", getMouseXY, false); }

    mouse.initMouseX = null;
    mouse.initMouseY = null;
}
// END Mouse Capture code

// Scrollable table
// by: mherring Jan/Feb 2009
var currTable = null;
var ScrollTableArray = new Array();
function ScrollTable(tableID) 
{
    ScrollTableArray[ScrollTableArray.length] = this;
    this.ScrollTableID = ScrollTableArray.length - 1; // use this ID to send current table to a callback e.g. setTimeout()

    initMouseCapture();

    // ******* These display properties can be set by user, then call redraw() to update table ******* //
    this.fixedCols = 1;           // number of columns that should stay fixed when scrolling
    this.fixedRows = 1;           // number of rows that should stay fixed when scrolling
    this.dispCols = 6;            // total number of columns to display
    this.dispRows = 5;            // total number of rows to display
    //this.overrideWidth = null;    // override default width with a pixel value
    //this.overrideHeight = null;   // override default height with a pixel value
    this.buttonSize = 20;         // size of left/right up/down buttons in pixels
    this.scrollerSize = 40;       // size of horizontal/vertical scroller button in pixels
    this.slowScrollInterval = 500; // miliseconds to wait until starting click+hold scrolling
    this.fastScrollInterval = 75; // miliseconds between scrolls when using click+hold scroll
    // *********************************************************************************************** //

    this.scrollerXPos = 0;        // x position of the horizontal scroller on the scrollbar
    this.scrollerYPos = 0;        // y position of the vertical scroller on the scrollbar
    this.selectedItem = null;     // currently selected scroller
    this.percentX = null;         // percent scrolled in horizontal direction
    this.percentY = null;         // percent scrolled in vertical direction
    this.scrollWidth = null;      // total width of scrollbar
    this.scrollHeight = null;     // total height of scrollbar
    this.currDirection = null;    // which direction the scroller is being dragged
    this.scrollInterval = null;   // time interval that the click+hold should wait before scrolling again
    this.scrollIntervalID = null; // ID of interval scroller process

    this.table = window.document.getElementById(tableID + "_Table");
    this.scrollerXContainer = window.document.getElementById(tableID + "_ScrollerXContainer");
    this.scrollerYContainer = window.document.getElementById(tableID + "_ScrollerYContainer");
    this.scrollerX = window.document.getElementById(tableID + "_ScrollerX");
    this.scrollerY = window.document.getElementById(tableID + "_ScrollerY");
    this.rightButton = window.document.getElementById(tableID + "_RightButton");
    this.downButton = window.document.getElementById(tableID + "_DownButton");

    // store table in memory
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

    this.redraw();
}

// If user updates any of the public members (see above), redraw() may have to be called
ScrollTable.prototype.redraw = function()
{
    // grab table dimension data
    this.numCols = this.rows[0].tableCells.length - this.fixedCols;           // number of columns of data that can be scrolled
    this.numRows = this.rows.length - this.fixedRows;                         // number of rows of data that can be scrolled
    this.scrollCols = Math.min(this.dispCols - this.fixedCols, this.numCols); // number of columns visible that can be scrolled
    this.scrollRows = Math.min(this.dispRows - this.fixedRows, this.numRows); // number of rows visible that can be scrolled

    // starting point for table
    this.tableX = this.fixedCols;           // current column scrolled to
    this.tableY = this.fixedRows;           // current row scrolled to
    this.synchYPosition = this.fixedRows;   // the row that the table is currently synch'd to

    // crop table to visible section
    var cells, currRow;
    for (var r = 0; r < this.rows.length; r++)
    {
        currRow = this.rows[r];

        // set initial row visibility
        if (r < this.fixedRows || (r >= this.tableY && r <= this.tableY + this.scrollRows - 1))
        {
            removeClassName(currRow, "ScrollTable_HiddenCell");
        }
        else
        {
            addClassName(currRow, "ScrollTable_HiddenCell");
        }

        // set initial column visibility
        cells = currRow.tableCells;
        for (var c = this.fixedCols; c < cells.length; c++)
        {
            if (c >= this.tableX && c <= this.tableX + this.scrollCols - 1)
            {
                removeClassName(cells[c], "ScrollTable_HiddenCell");
            }
            else
            {
                addClassName(cells[c], "ScrollTable_HiddenCell");
            }
        }
        currRow.synchXPosition = this.fixedCols; // the column this row is synch'd to
    }

    // adjust scrollbars to table dimensions
//    if (this.overrideWidth !== null)
//    {
//        this.table.style.width = this.overrideWidth;
//    }
//    if (this.overrideHeight !== null)
//    {
//        this.table.style.height = this.overrideHeight;
//    }
    var tableWidth = this.table.offsetWidth;
    var tableHeight = this.table.offsetHeight;
    var sizeAdjust = 2 * this.buttonSize + 1 * this.scrollerSize;
    this.scrollerXContainer.style.width = tableWidth * 1.0;   // if not x*1.0, then assigned by reference and if table height changes, scrollbar will change
    this.scrollerYContainer.style.height = tableHeight * 1.0;
    this.scrollWidth = tableWidth - sizeAdjust;
    this.scrollHeight = tableHeight - sizeAdjust;
    this.rightButton.style.left = tableWidth - sizeAdjust;
    this.downButton.style.top = tableHeight - sizeAdjust;

    // hide/show scrollbars
    if (this.scrollCols == this.numCols)
    {
        addClassName(this.scrollerXContainer, "ScrollTable_HiddenCell");
    }
    else
    {
        removeClassName(this.scrollerXContainer, "ScrollTable_HiddenCell");
    }
    if (this.scrollRows == this.numRows)
    {
        addClassName(this.scrollerYContainer, "ScrollTable_HiddenCell");
    }
    else
    {
        removeClassName(this.scrollerYContainer, "ScrollTable_HiddenCell");
    }
};

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

    // update synch status
    this.synchYPosition = newPos;
};

// Shift rows and columns after a scroll request is made
ScrollTable.prototype.updateTable = function()
{
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

// Scroll table by rows or columns. Used for button clicks
ScrollTable.prototype.scrollTable = function(dX, dY, dbl)
{
    // IE triggers either a double click or a single click. Firefox triggers both
    if (dbl == true && !document.all)
    {
        return; // throw out Firefox double clicks, keep going if this is an IE double click
    }

    if (this.scrollIntervalID !== null)
    {
        window.clearTimeout(this.scrollIntervalID);
        this.scrollIntervalID = null;
    }

    if (dX !== 0)
    {        // shift horiz
        this.tableX += dX;
        if (this.tableX < this.fixedCols || this.tableX + this.scrollCols - this.fixedCols > this.numCols)
        {
            this.tableX -= dX;
        }
        this.percentX = (this.tableX - this.fixedCols) / (this.numCols - this.scrollCols);
        this.scrollerXPos = this.percentX * this.scrollWidth;
        this.scrollerX.style.left = this.scrollerXPos;
    }
    else if (dY !== 0)
    {   // shift vert
        this.tableY += dY;
        if (this.tableY < this.fixedRows || this.tableY + this.scrollRows - this.fixedRows > this.numRows)
        {
            this.tableY -= dY;
        }
        this.percentY = (this.tableY - this.fixedRows) / (this.numRows - this.scrollRows);
        this.scrollerYPos = this.percentY * this.scrollHeight;
        this.scrollerY.style.top = this.scrollerYPos;
    }

    if (dX !== 0 || dY !== 0)
    {
        this.updateTable();
    }

    // set interval scroller
    if (this.scrollInterval === null)
    {
        this.scrollInterval = this.slowScrollInterval;
    }
    else if (this.scrollInterval == this.slowScrollInterval)
    {
        this.scrollInterval = this.fastScrollInterval;
    }
    var callBackString = 'ScrollTableArray[' + this.ScrollTableID + '].scrollTable(' + dX + ',' + dY + ')';
    this.scrollIntervalID = window.setTimeout(callBackString, this.scrollInterval);

    // if IE encounters a double click, it won't trigger an onmouseup event, so we must pretend it did
    if (dbl == true && document.all)
    {
        this.stopScrollTable();
    }
};

// Stops click+hold scrolling
ScrollTable.prototype.stopScrollTable = function() 
{
    window.clearTimeout(this.scrollIntervalID);
    this.scrollIntervalID = null;
    this.scrollInterval = null;
};

// Start capturing click+drag events for scrollers
function startDragItem(st, dir) 
{
    currTable = st;
    if (dir == "horiz")
    {
        currTable.selectedItem = currTable.scrollerX;
    }
    else
    {
        currTable.selectedItem = currTable.scrollerY;
    }
    currTable.currDirection = dir;

    // attach drag functions
    if (window.document.all) 
    {
        window.document.attachEvent("onmousemove", dragItem, false);
        window.document.attachEvent("onmouseup", endDragItem, false);
    }
    else 
    {
        window.document.addEventListener("mousemove", dragItem, false);
        window.document.addEventListener("mouseup", endDragItem, false);
    }

    startMouseCapturing();
}

// Stop capturing click+drag event
function endDragItem(e) 
{
    // detach drag functions
    if (window.document.all) 
    {
        window.document.detachEvent("onmousemove", dragItem, false);
        window.document.detachEvent("onmouseup", endDragItem, false);
    }
    else 
    {
        window.document.removeEventListener("mousemove", dragItem, false);
        window.document.removeEventListener("mouseup", endDragItem, false);
    }

    // save last position
    try 
    { // sometimes inexplicably breaks in IE if you scroll to violently
        if (currTable.currDirection == "horiz")
        {
            currTable.scrollerXPos = parseInt(currTable.selectedItem.style.left, 10);
        }
        else
        {
            currTable.scrollerYPos = parseInt(currTable.selectedItem.style.top, 10);
        }
    }
    catch (err) { }

    currTable.currDirection = null;
    currTable.selectedItem = null;
    currTable = null;

    stopMouseCapturing();
}

// Capture click+drag event and scroll table accordingly
function dragItem(e) 
{
    var newPos;
    if (currTable.currDirection == "horiz") 
    {
        // get position
        if (mouse.mouseX === null || mouse.initMouseX === null) // mouse event might not fire first
        {
            return false;
        }
        newPos = currTable.scrollerXPos + (mouse.mouseX - mouse.initMouseX);
        if (newPos < 0) { newPos = 0; }
        if (newPos > currTable.scrollWidth) { newPos = currTable.scrollWidth; }

        // adjust table
        currTable.scrollerX.style.left = newPos;
        currTable.percentX = newPos / currTable.scrollWidth;
        var newTableX = currTable.fixedCols + Math.round((currTable.numCols - currTable.scrollCols) * currTable.percentX);
        if (newTableX == currTable.tableX)
        {
            return false;
        }
        else
        {
            currTable.tableX = newTableX;
        }
    }
    else if (currTable.currDirection == "vert") 
    {
        // get position
        if (mouse.mouseY === null || mouse.initMouseY === null) // mouse event might not fire first
        {
            return false;
        }
        newPos = currTable.scrollerYPos + (mouse.mouseY - mouse.initMouseY);
        if (newPos < 0) { newPos = 0; }
        if (newPos > currTable.scrollHeight) { newPos = currTable.scrollHeight; }
        
        // adjust table
        currTable.scrollerY.style.top = newPos;
        currTable.percentY = newPos / currTable.scrollHeight;
        var newTableY = currTable.fixedRows + Math.round((currTable.numRows - currTable.scrollRows) * currTable.percentY);
        if (newTableY == currTable.tableY)
        {
            return false;
        }
        else
        {
            currTable.tableY = newTableY;
        }
    }

    if (currTable.currDirection !== null)
    {
        currTable.updateTable();
    }

    return true;
}


function log(str)
{
	var log = document.getElementById("log");
	log.value = str + "\n" + log.value;
}