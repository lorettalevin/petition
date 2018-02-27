const canvas = $("#canvas");

const context = document.getElementById("canvas").getContext("2d");

let offsetX;
let offsetY;

context.strokeStyle = "cyan";
context.lineWidth = 3;

canvas.mousedown(function(e) {
    context.beginPath();
    canvas.mousemove(function(e) {
        offsetX = e.offsetX;
        offsetY = e.offsetY;
        context.lineTo(offsetX, offsetY);
        context.stroke();
    });
});

canvas.mouseup(function(e) {
    canvas.unbind("mousemove");
    const dataURL = document.querySelector("#canvas").toDataURL();
    $("#hidden").val(dataURL);
});
