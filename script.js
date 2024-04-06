let pdfViewer = document.getElementById('pdf-viewer');
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;

function extractText(pdfUrl) {
    var pdf = pdfjsLib.getDocument(pdfUrl);
    return pdf.promise.then(function (pdf) {
        var totalPageCount = pdf.numPages;
        var countPromises = [];
        for (var currentPage = 1; currentPage <= totalPageCount; currentPage++) {
            var page = pdf.getPage(currentPage);
            countPromises.push(
                page.then(function (page) {
                    var textContent = page.getTextContent();
                    return textContent.then(function (text) {
                        return text.items
                            .map(function (s) {
                                return s.str;
                            })
                            .join('');
                    });
                }),
            );
        }

        return Promise.all(countPromises).then(function (texts) {
            return texts.join('');
        });
    });
}

function speakText(text) {
    var msg = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(msg);
}

document.getElementById('speak-text').addEventListener('click', function() {
    var pdfUrl = 'books/G1/01_Stop_and_Go.pdf'; // Update this with your PDF file's URL
    extractText(pdfUrl).then(function(text) {
        speakText(text);
    });
});

function renderPage(num) {
    pageRendering = true;

    pdfDoc.getPage(num).then(function(page) {
        let viewport = page.getViewport({ scale: 1.5 });
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        let renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        let renderTask = page.render(renderContext);

        renderTask.promise.then(function() {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });

        pdfViewer.appendChild(canvas);
    });
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onDocumentLoaded(pdfDoc_) {
    pdfDoc = pdfDoc_;
    renderPage(pageNum);
}

function loadPdf(url) {
    pdfjsLib.getDocument(url).promise.then(onDocumentLoaded);
}

document.getElementById('prev-page').addEventListener('click', function() {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
});

document.getElementById('next-page').addEventListener('click', function() {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
});

loadPdf('books/G1/01_Stop_and_Go.pdf');